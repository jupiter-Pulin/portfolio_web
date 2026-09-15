// A fake ask for the eval CLI test: routes the first paraphrase of each group
// differently from the rest, and answers every chip case in English.
let n = 0;
export default async function ask() {
  n++;
  return { kind: 'answer', key: n % 2 ? 'fallback' : 'code', scopeId: null, answer: 'It runs every night.', costUsd: 0.001 };
}
