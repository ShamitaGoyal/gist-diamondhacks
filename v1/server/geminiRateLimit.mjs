/**
 * In-memory pacing for Gemini free tier: caps calls/minute and enforces a minimum gap.
 * Single-process only; use Redis in production if you scale horizontally.
 */

const windowMs = 60_000;
const maxPerWindow = Math.max(1, Number(process.env.GEMINI_MAX_REQUESTS_PER_MINUTE || 5));
const minGapMs = Math.max(0, Number(process.env.GEMINI_MIN_INTERVAL_MS || 12_000));

const timestamps = [];
let lastCallAt = 0;

function prune(now) {
  while (timestamps.length > 0 && now - timestamps[0] > windowMs) {
    timestamps.shift();
  }
}

/**
 * @returns {{ ok: true } | { ok: false; retryAfterSec: number; message: string }}
 */
export function gateGeminiCall() {
  const now = Date.now();
  prune(now);

  if (timestamps.length >= maxPerWindow) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return {
      ok: false,
      retryAfterSec,
      message: `Paperscope is pacing Gemini for your free tier: max ${maxPerWindow} requests per minute. Try again in about ${retryAfterSec}s.`
    };
  }

  if (lastCallAt > 0 && now - lastCallAt < minGapMs) {
    const retryAfterSec = Math.max(1, Math.ceil((minGapMs - (now - lastCallAt)) / 1000));
    return {
      ok: false,
      retryAfterSec,
      message: `Please wait ${retryAfterSec}s between API calls (set GEMINI_MIN_INTERVAL_MS / GEMINI_MAX_REQUESTS_PER_MINUTE in .env.local to tune).`
    };
  }

  return { ok: true };
}

export function recordGeminiCall() {
  const now = Date.now();
  lastCallAt = now;
  timestamps.push(now);
}

export function rateLimitConfig() {
  return { maxPerWindow, minGapMs, windowMs };
}
