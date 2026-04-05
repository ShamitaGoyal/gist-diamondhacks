import { dispatchFromLlmJson, mergeStoryIntoDispatch } from './llmVisualDispatch';
import type { VisualDispatchResponse } from './visualDispatch';

export type ApiCognitiveDepth = 'basic' | 'medium' | 'deep';

function apiBase(): string {
  const b = import.meta.env.VITE_API_BASE_URL;
  return typeof b === 'string' ? b.replace(/\/$/, '') : '';
}

function mapDepth(appDepth: 'skim' | 'deep'): ApiCognitiveDepth {
  return appDepth === 'deep' ? 'deep' : 'basic';
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const j = await res.json();
    if (j && typeof j.error === 'string') {
      let msg = j.error;
      if (typeof j.retryAfterSec === 'number') {
        msg += ` Retry in ~${j.retryAfterSec}s.`;
      }
      return msg;
    }
  } catch {
    /* ignore */
  }
  const ra = res.headers.get('Retry-After');
  if (ra) {
    return `${res.statusText || `HTTP ${res.status}`} Retry in ~${ra}s.`;
  }
  return res.statusText || `HTTP ${res.status}`;
}

/**
 * Phase 1: POST /api/visual-dispatch → JSON → dispatchFromLlmJson.
 */
export async function fetchVisualDispatch(
  selectedText: string,
  cognitiveDepth: 'skim' | 'deep',
  signal?: AbortSignal
): Promise<VisualDispatchResponse> {
  const res = await fetch(`${apiBase()}/api/visual-dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedText,
      cognitiveDepth: mapDepth(cognitiveDepth)
    }),
    signal
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const json = await res.json();
  return dispatchFromLlmJson(json);
}

/**
 * Phase 1: POST /api/story-regen → merge story_analogy + story_icons into existing dispatch.
 */
export async function fetchStoryRegen(
  visualJson: VisualDispatchResponse,
  signal?: AbortSignal
): Promise<VisualDispatchResponse> {
  const res = await fetch(`${apiBase()}/api/story-regen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visualJson }),
    signal
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const patch = await res.json();
  return mergeStoryIntoDispatch(visualJson, {
    story_analogy: patch.story_analogy,
    story_icons: patch.story_icons
  });
}
