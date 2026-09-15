// Paid evaluation of /api/ask: routing stability and answer language.
//   node scripts/eval-ask.mjs --runs 2
// Uses the model configured in env (ASK_MODEL_BASE_URL, ASK_MODEL, ASK_MODEL_API_KEY,
// prices) and costs real money. Counters live in memory for this run only; the
// visitor limit is lifted, the budget thresholds still apply.
// Options: --runs N (default 1), --cases <json> (default tests/fixtures/ask-paraphrases.json),
// --ask <module> (a module whose default export replaces the model-backed ask; for tests).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
const HAN = /\p{Script=Han}/gu;
const ES_WORDS = new Set(['el', 'la', 'los', 'las', 'que', 'está', 'están', 'proyecto', 'es', 'en', 'del', 'por', 'para', 'una', 'un', 'con', 'se', 'su', 'y', 'usa', 'dónde', 'cómo', 'qué', 'código', 'pila', 'también', 'repositorio']);
const EN_WORDS = new Set(['the', 'is', 'are', 'and', 'of', 'to', 'in', 'it', 'on', 'for', 'with', 'this', 'that', 'what', 'where', 'how', 'uses', 'runs', 'every', 'code', 'project', 'stack', 'a', 'an', 'his', 'he']);

/** Heuristic, evaluation-only language tag: ja, zh, es or en. */
export function detectLang(text) {
  if (KANA.test(text)) return 'ja';
  if ((text.match(HAN) ?? []).length >= 2) return 'zh';
  const words = text.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  const es = words.filter((w) => ES_WORDS.has(w)).length;
  const en = words.filter((w) => EN_WORDS.has(w)).length;
  return es > en ? 'es' : 'en';
}

/** Every case in the fixture, flattened: typed paraphrases by group, then chip cases. */
export function flattenCases(cases) {
  const typed = cases.groups.flatMap((g) =>
    g.cases.map((c) => ({ group: g.id, via: 'typed', question: c.question, scopeId: c.scopeId ?? null, expect: c.expect })),
  );
  const chips = cases.chips.map((c, i) => ({
    group: `chip-${i + 1}`,
    via: 'chip',
    question: c.question,
    scopeId: c.scopeId ?? null,
    intent: c.intent,
    langSample: c.langSample,
    expect: c.expect,
  }));
  return [...typed, ...chips];
}

const pct = (p) => (p.total ? `${p.pass}/${p.total} (${Math.round((p.pass / p.total) * 100)}%)` : '0/0');

/**
 * Run every case `runs` times through `ask` and judge it. `ask` receives
 * { question, scopeId, intent?, langSample? } and resolves to
 * { kind:"answer", key, scopeId, answer, costUsd?, inputTokens?, outputTokens? } or
 * another kind, optionally with { status, reason, raw } saying why there was no answer.
 */
export async function evaluate(cases, ask, { runs = 1 } = {}) {
  const all = flattenCases(cases);
  const failures = [];
  const byLang = {};
  const seenRoutes = new Map();
  let costUsd = 0;
  const tokens = { input: 0, output: 0 };

  for (let run = 1; run <= runs; run++) {
    for (const c of all) {
      const body = {
        question: c.question,
        scopeId: c.scopeId,
        ...(c.intent ? { intent: c.intent } : {}),
        ...(c.langSample ? { langSample: c.langSample } : {}),
      };
      const res = await ask(body);
      costUsd += res?.costUsd ?? 0;
      tokens.input += res?.inputTokens ?? 0;
      tokens.output += res?.outputTokens ?? 0;
      const lang = c.expect.lang;
      const stats = (byLang[lang] ??= { route: { pass: 0, total: 0 }, lang: { pass: 0, total: 0 } });
      stats.route.total++;
      stats.lang.total++;
      if (res?.kind !== 'answer') {
        failures.push({
          type: 'no-answer',
          label: '没有回答',
          group: c.group,
          question: c.question,
          run,
          kind: res?.kind,
          ...(res?.status !== undefined ? { status: res.status } : {}),
          ...(res?.reason !== undefined ? { reason: res.reason } : {}),
          ...(res?.raw !== undefined ? { raw: res.raw } : {}),
        });
        continue;
      }
      const route = `${res.key}/${res.scopeId}`;
      if (!seenRoutes.has(c.group)) seenRoutes.set(c.group, new Set());
      seenRoutes.get(c.group).add(route);
      if (res.key === c.expect.key && res.scopeId === c.expect.scopeId) stats.route.pass++;
      else failures.push({ type: 'route-wrong', label: '路由错误', group: c.group, question: c.question, run, got: route, want: `${c.expect.key}/${c.expect.scopeId}` });
      const got = detectLang(res.answer);
      if (got === lang) stats.lang.pass++;
      else failures.push({ type: 'lang-mismatch', label: '语言不符', group: c.group, question: c.question, run, got, want: lang });
    }
  }
  for (const [group, routes] of seenRoutes) {
    if (routes.size > 1) failures.push({ type: 'route-inconsistent', label: '路由不一致', group, routes: [...routes] });
  }
  return { ok: failures.length === 0, cases: all.length, runs, costUsd, tokens, byLang, failures };
}

/** The real thing: the /api/ask handler with env config, in-memory counters and a cost meter. */
async function modelAsk() {
  const { createAskHandler } = await import('../src/server/ask/handler.ts');
  const { readConfig, isConfigError } = await import('../src/server/ask/config.ts');
  const { selectProvider, costUsd } = await import('../src/server/ask/providers/index.ts');
  const { readModelOutput } = await import('../src/server/ask/output.ts');
  const { createMemoryStore } = await import('../src/server/ask/store.ts');
  const { default: index } = await import('../src/generated/ask-index.json', { with: { type: 'json' } });
  const env = { ...process.env, ASK_VISITOR_DAILY_LIMIT: String(Number.MAX_SAFE_INTEGER) };
  delete env.UPSTASH_REDIS_REST_URL;
  delete env.UPSTASH_REDIS_REST_TOKEN;
  if (env.NODE_ENV === 'production') delete env.NODE_ENV;
  const config = readConfig(env);
  if (isConfigError(config)) throw new Error(`missing or invalid env: ${config.names.join(', ')}`);
  const real = selectProvider(config, fetch);
  // What the model did on the current request, so a refusal can be explained.
  let last = null;
  const provider = {
    id: real.id,
    async ask(req) {
      try {
        const out = await real.ask(req);
        last = { content: out.content, usage: out.usage };
        return out;
      } catch (err) {
        last = { error: err instanceof Error ? `${err.name}: ${err.message}` : String(err) };
        throw err;
      }
    },
  };
  const handler = createAskHandler({ env, index, provider, store: createMemoryStore(), log: { info() {}, warn: console.warn, error: console.error } });
  return async (body) => {
    last = null;
    const res = await handler(new Request('http://localhost/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    const data = await res.json().catch(() => null);
    const usage = last?.usage;
    const metered = usage ? { costUsd: costUsd(usage, config), inputTokens: usage.inputTokens, outputTokens: usage.outputTokens } : { costUsd: 0 };
    if (res.status === 200 && data?.ok) return { kind: 'answer', key: data.key, scopeId: data.scopeId, answer: data.answer, ...metered };
    return { kind: res.status === 429 ? 'limited' : 'error', status: res.status, ...explain(last, res.status, readModelOutput), ...metered };
  };
}

/** Why the handler gave no answer, from what the model returned: a reason and the raw reply. */
export function explain(last, status, readModelOutput) {
  if (status === 504) return { reason: 'deadline' };
  if (!last) return { reason: `no model call (HTTP ${status})` };
  if (last.error) return { reason: `provider error (${last.error})` };
  const raw = last.content;
  if (!last.usage) return { reason: 'no-usage', raw };
  const read = readModelOutput(raw);
  return { reason: read.ok ? `unexplained (HTTP ${status})` : read.reason, raw };
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runs = Number(arg('--runs', '1'));
  const casesPath = resolve(arg('--cases', fileURLToPath(new URL('../tests/fixtures/ask-paraphrases.json', import.meta.url))));
  const askModule = arg('--ask', null);
  try {
    const cases = JSON.parse(readFileSync(casesPath, 'utf8'));
    const ask = askModule ? (await import(pathToFileURL(resolve(askModule)).href)).default : await modelAsk();
    const report = await evaluate(cases, ask, { runs });
    console.log(`cases ${report.cases} × runs ${report.runs}`);
    for (const [lang, s] of Object.entries(report.byLang)) {
      console.log(`${lang}: route ${pct(s.route)} · language ${pct(s.lang)}`);
    }
    for (const f of report.failures) console.log(`FAIL ${f.label} ${JSON.stringify(f)}`);
    console.log(`tokens input ${report.tokens.input} · output ${report.tokens.output}`);
    console.log(`costUsd ${report.costUsd.toFixed(6)}`);
    process.exitCode = report.ok ? 0 : 1;
  } catch (err) {
    console.error(`eval-ask: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 2;
  }
}
