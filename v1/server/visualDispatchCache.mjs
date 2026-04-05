import crypto from 'crypto';

const ttlMs = Math.max(30_000, Number(process.env.GEMINI_VISUAL_CACHE_TTL_MS || 600_000)); // default 10 min
/** @type {Map<string, { at: number; json: unknown }>} */
const cache = new Map();

export function cacheKeyForVisual(selectedText, cognitiveDepth) {
  const h = crypto.createHash('sha256');
  h.update(String(cognitiveDepth), 'utf8');
  h.update('\n', 'utf8');
  h.update(selectedText.slice(0, 12000), 'utf8');
  return h.digest('hex');
}

export function getCachedVisual(key) {
  const row = cache.get(key);
  if (!row) return null;
  if (Date.now() - row.at > ttlMs) {
    cache.delete(key);
    return null;
  }
  return row.json;
}

export function setCachedVisual(key, json) {
  cache.set(key, { at: Date.now(), json });
}

export function visualCacheTtlMs() {
  return ttlMs;
}
