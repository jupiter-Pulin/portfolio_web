// A fake ask for the eval CLI test: the first call gets no answer, with the
// reason and raw reply the real ask reports; the rest answer.
let n = 0;
export default async function ask() {
  n++;
  if (n === 1) return { kind: 'error', status: 502, reason: 'not-json', raw: '```json\n{"key":"decision"', costUsd: 0.001, inputTokens: 2000, outputTokens: 7 };
  return { kind: 'answer', key: 'fallback', scopeId: null, answer: 'It runs every night.', costUsd: 0.001, inputTokens: 2000, outputTokens: 50 };
}
