/**
 * PaperScope Phase 1 API — Gemini-backed visual dispatch + story regen.
 * Run: pnpm run server  (default port 8787)
 */
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { gateGeminiCall, recordGeminiCall, rateLimitConfig } from './geminiRateLimit.mjs';
import {
  cacheKeyForVisual,
  getCachedVisual,
  setCachedVisual,
  visualCacheTtlMs
} from './visualDispatchCache.mjs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = Number(process.env.PAPERSCOPE_API_PORT || process.env.PORT || 8787);
/** Default to 1.5 Flash — free tier often has stricter limits on 2.0. Override with GEMINI_MODEL. */
const MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const STORY_CACHE_TTL_MS = Math.max(60_000, Number(process.env.GEMINI_STORY_CACHE_TTL_MS || 900_000)); // 15 min default

/** @type {Map<string, { at: number; body: unknown }>} */
const storyCache = new Map();

function parseGeminiJson(text) {
  const t = String(text).trim();
  if (t.startsWith('{') || t.startsWith('[')) {
    return JSON.parse(t);
  }
  const block = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (block) {
    return JSON.parse(block[1].trim());
  }
  return JSON.parse(t);
}

function enhanceGeminiError(e) {
  const msg = e?.message || String(e);
  if (/429|Too Many Requests|quota|exceeded/i.test(msg)) {
    const retryRaw =
      msg.match(/retry in ([\d.]+)s/i)?.[1] ||
      msg.match(/retryDelay[":\s]+"?(\d+)s?/i)?.[1] ||
      msg.match(/"retryDelay":"(\d+)s"/)?.[1];
    const sec = retryRaw ? Math.min(300, Math.max(5, Math.ceil(parseFloat(retryRaw)))) : 60;
    const err = new Error(
      `Gemini rate limit or quota (often free-tier). Wait ~${sec}s, try model gemini-1.5-flash in GEMINI_MODEL, or enable billing.`
    );
    err.statusCode = 429;
    err.retryAfterSec = sec;
    return err;
  }
  return e;
}

async function generateJsonPrompt(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not set');
    err.statusCode = 503;
    throw err;
  }

  const gate = gateGeminiCall();
  if (!gate.ok) {
    const err = new Error(gate.message);
    err.statusCode = 429;
    err.retryAfterSec = gate.retryAfterSec;
    throw err;
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.35,
      responseMimeType: 'application/json'
    }
  });

  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (e) {
    throw enhanceGeminiError(e);
  }

  let parsed;
  try {
    parsed = parseGeminiJson(text);
  } catch (parseErr) {
    const err = new Error(`Model returned invalid JSON: ${parseErr.message}`);
    err.statusCode = 502;
    throw err;
  }
  recordGeminiCall();
  return parsed;
}

const VISUAL_SCHEMA = `Return ONLY valid JSON (no markdown) with this shape:
{
  "visual_kind": "flow_chart | graph | causal_flow | comparison | comp_table | procedure_rail | data_sketcher",
  "summary": "One or two sentences, technical but clear.",
  "data_payload": { ... },
  "story_analogy": "2-4 short sentences for a middle-school reader, plain language.",
  "story_icons": ["emoji1", "emoji2", ...],
  "technical_mode_label": "Short label e.g. Flowchart · Causal graph",
  "deep_dive_latex": "",
  "deep_subgraph_note": ""
}

Rules for data_payload by visual_kind:
- graph OR causal_flow: { "nodes": [{"id":"a","label":"..."}], "edges": [{"source":"a","target":"b","label":"optional"}] }
- flow_chart OR procedure_rail: { "steps": [{"label":"..."}] }
- comparison OR comp_table: { "col_a_header":"...", "col_b_header":"...", "rows": [{"left":"...","right":"...","highlight_difference": false}] }
- data_sketcher: { "series": [{"x":0,"y":0.2}, ...] } with x in [0,1], y in [0,1]

story_icons: array of emojis, one per main node (causal_flow) or per step (procedure_rail), else 3-5 emojis for other kinds.
For deep_dive_latex and deep_subgraph_note: use empty string unless cognitiveDepth is deep.`;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '512kb' }));

app.get('/api/health', (_req, res) => {
  const rl = rateLimitConfig();
  res.json({
    ok: true,
    model: MODEL,
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    rateLimit: {
      maxRequestsPerMinute: rl.maxPerWindow,
      minIntervalMs: rl.minGapMs
    },
    visualCacheTtlMs: visualCacheTtlMs()
  });
});

function storyCacheKey(visualJson) {
  const h = crypto.createHash('sha256');
  h.update(JSON.stringify(visualJson));
  return h.digest('hex');
}

function getCachedStory(key) {
  const row = storyCache.get(key);
  if (!row) return null;
  if (Date.now() - row.at > STORY_CACHE_TTL_MS) {
    storyCache.delete(key);
    return null;
  }
  return row.body;
}

function setCachedStory(key, body) {
  storyCache.set(key, { at: Date.now(), body });
}

app.post('/api/visual-dispatch', async (req, res) => {
  try {
    const { selectedText, cognitiveDepth } = req.body ?? {};
    const text = typeof selectedText === 'string' ? selectedText.trim() : '';
    if (!text) {
      res.status(400).json({ error: 'selectedText is required' });
      return;
    }
    const depth =
      cognitiveDepth === 'deep' || cognitiveDepth === 'medium' || cognitiveDepth === 'basic'
        ? cognitiveDepth
        : 'basic';

    const ckey = cacheKeyForVisual(text, depth);
    const cached = getCachedVisual(ckey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const prompt = `You are PaperScope Visual AI. Generate structured visual explanations and story analogies.
${VISUAL_SCHEMA}

cognitiveDepth: "${depth}"
If depth is "deep", you may set deep_dive_latex to a short LaTeX fragment (single line) and deep_subgraph_note to one sentence; otherwise leave both as "".

Highlighted passage:
"""
${text.slice(0, 12000)}
"""`;

    const json = await generateJsonPrompt(prompt);
    setCachedVisual(ckey, json);
    res.setHeader('X-Cache', 'MISS');
    res.json(json);
  } catch (e) {
    const status = e.statusCode || 500;
    if (e.retryAfterSec) {
      res.setHeader('Retry-After', String(e.retryAfterSec));
    }
    console.error('[visual-dispatch]', e);
    res.status(status).json({
      error: e.message || 'Visual dispatch failed',
      code:
        status === 503
          ? 'MISSING_API_KEY'
          : status === 429
            ? 'RATE_LIMIT'
            : 'GEMINI_ERROR',
      retryAfterSec: e.retryAfterSec
    });
  }
});

app.post('/api/story-regen', async (req, res) => {
  try {
    const { visualJson } = req.body ?? {};
    if (!visualJson || typeof visualJson !== 'object') {
      res.status(400).json({ error: 'visualJson object is required' });
      return;
    }

    const skey = storyCacheKey(visualJson);
    const hit = getCachedStory(skey);
    if (hit) {
      res.setHeader('X-Cache', 'HIT');
      res.json(hit);
      return;
    }

    const prompt = `You refresh story-mode fields for an existing technical visual JSON.
Input (do not repeat verbatim; use it for context only):
${JSON.stringify(visualJson).slice(0, 24000)}

Return ONLY valid JSON:
{
  "story_analogy": "2-5 short sentences for a middle-schooler; friendly and concrete.",
  "story_icons": ["emoji", ...]
}

story_icons must align with the structure: for causal_flow/graph, one emoji per node in order of nodes array; for procedure_rail/flow_chart, one per step in order; otherwise 3-5 relevant emojis.`;

    const json = await generateJsonPrompt(prompt);
    const body = {
      story_analogy: typeof json.story_analogy === 'string' ? json.story_analogy : '',
      story_icons: Array.isArray(json.story_icons) ? json.story_icons : []
    };
    setCachedStory(skey, body);
    res.setHeader('X-Cache', 'MISS');
    res.json(body);
  } catch (e) {
    const status = e.statusCode || 500;
    if (e.retryAfterSec) {
      res.setHeader('Retry-After', String(e.retryAfterSec));
    }
    console.error('[story-regen]', e);
    res.status(status).json({
      error: e.message || 'Story regen failed',
      code:
        status === 503
          ? 'MISSING_API_KEY'
          : status === 429
            ? 'RATE_LIMIT'
            : 'GEMINI_ERROR',
      retryAfterSec: e.retryAfterSec
    });
  }
});

app.listen(PORT, () => {
  const rl = rateLimitConfig();
  console.log(`PaperScope API http://127.0.0.1:${PORT}  (model: ${MODEL})`);
  console.log(
    `Gemini pacing: max ${rl.maxPerWindow}/min, min ${rl.minGapMs}ms between calls (env: GEMINI_MAX_REQUESTS_PER_MINUTE, GEMINI_MIN_INTERVAL_MS)`
  );
});
