// Test doubles for /api/ask: a fake Upstash REST server backed by a Map, a fake
// model endpoint, a recording provider, a capturing log and a request builder.
// Nothing here touches the network.

export const UPSTASH_URL = 'https://upstash.test';
export const MODEL_BASE = 'https://model.test/v1';

/** Complete non-production config for the openai-compatible provider. */
export const baseEnv = (extra = {}) => ({
  NODE_ENV: 'test',
  ASK_MODEL_BASE_URL: MODEL_BASE,
  ASK_MODEL: 'test-model',
  ASK_MODEL_API_KEY: 'test-api-key',
  ASK_PRICE_INPUT_USD_PER_MTOK: '1',
  ASK_PRICE_OUTPUT_USD_PER_MTOK: '2',
  ...extra,
});

export const upstashEnv = (extra = {}) =>
  baseEnv({ UPSTASH_REDIS_REST_URL: UPSTASH_URL, UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token', ...extra });

/** Redis semantics for the four commands the store sends, over a Map. */
export function fakeUpstash({ fail = null } = {}) {
  const data = new Map();
  const ttl = new Map();
  const requests = [];
  const run = ([cmd, key, arg]) => {
    switch (cmd) {
      case 'INCR': {
        const n = Number(data.get(key) ?? 0) + 1;
        data.set(key, String(n));
        return n;
      }
      case 'INCRBYFLOAT': {
        const n = Number(data.get(key) ?? 0) + Number(arg);
        data.set(key, String(n));
        return String(n);
      }
      case 'EXPIRE':
        ttl.set(key, Number(arg));
        return 1;
      case 'GET':
        return data.get(key) ?? null;
      default:
        return { error: `unknown ${cmd}` };
    }
  };
  const handle = async (url, init) => {
    requests.push({ url, headers: init.headers, body: init.body });
    if (fail === 'reject') throw new TypeError('fetch failed');
    if (fail === 500) return new Response('boom', { status: 500 });
    const commands = JSON.parse(init.body);
    return Response.json(commands.map((c) => ({ result: run(c) })));
  };
  return { data, ttl, requests, handle };
}

/** A chat-completions response in the OpenAI shape. */
export const completion = (content, usage = { prompt_tokens: 100, completion_tokens: 50 }, finish) =>
  Response.json({
    choices: [{ message: { role: 'assistant', content }, ...(finish ? { finish_reason: finish } : {}) }],
    ...(usage ? { usage } : {}),
  });

/**
 * One fetch for both hosts. `model` answers model calls (default: a valid
 * overview answer); Upstash calls go to `upstash` when given.
 */
export function fakeFetch({ upstash = null, model } = {}) {
  const modelCalls = [];
  const fn = async (url, init = {}) => {
    const href = String(url);
    if (href.startsWith(UPSTASH_URL)) {
      if (!upstash) throw new Error('unexpected upstash call');
      return upstash.handle(href, init);
    }
    if (href.startsWith(MODEL_BASE)) {
      modelCalls.push({ url: href, init, body: JSON.parse(init.body) });
      return model ? model(href, init) : completion('{"key":"overview","scopeId":"chain","answer":"chain-pulse runs nightly."}');
    }
    throw new Error(`unexpected fetch ${href}`);
  };
  fn.modelCalls = modelCalls;
  return fn;
}

/** A provider that records every call and answers with `respond(req)`. */
export function fakeProvider(respond = () => ({ content: '{"key":"overview","scopeId":"chain","answer":"OK"}', usage: { inputTokens: 100, outputTokens: 50 } })) {
  const calls = [];
  return {
    id: 'fake',
    calls,
    async ask(req) {
      calls.push(req);
      return respond(req);
    },
  };
}

export function captureLog() {
  const entries = [];
  const at = (level) => (...args) => entries.push({ level, text: args.map(String).join(' ') });
  return { entries, info: at('info'), warn: at('warn'), error: at('error') };
}

export const post = (handler, body, headers = {}) =>
  handler(
    new Request('http://localhost/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.51.100.1', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

export const readJson = async (res) => ({ status: res.status, body: await res.json() });

export const fixedClock = (iso) => {
  const clock = () => new Date(clock.now);
  clock.now = Date.parse(iso);
  return clock;
};
