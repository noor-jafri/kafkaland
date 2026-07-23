import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCompanionServer } from '../server/app.js';
import {
  createProvider,
  DEFAULT_OPENAI_MODEL,
  DeterministicProvider,
  OpenAIProvider,
  UnconfiguredProvider,
} from '../server/provider.js';

function openAiResponse(content) {
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

test('OpenAI answer request is server-side, configurable, bounded, and structured', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return openAiResponse({
      answer: 'General guidance (not from the Kafkaland wiki): Check the current official instructions.',
      citations: [],
      sourceBasis: 'general',
    });
  };
  try {
    const provider = new OpenAIProvider({
      apiKey: 'test-secret-never-sent-to-browser',
      model: 'configured-test-model',
      baseUrl: 'https://openai.example.test/v1',
      timeoutMs: 2_500,
    });
    const output = await provider.answer({
      mode: 'ask', input: 'lost passport', locale: 'en', sources: [], allowGeneralGuidance: true,
    });
    assert.equal(output.sourceBasis, 'general');
    assert.equal(request.url, 'https://openai.example.test/v1/chat/completions');
    assert.equal(request.options.headers.authorization, 'Bearer test-secret-never-sent-to-browser');
    assert.equal(request.body.model, 'configured-test-model');
    assert.equal(request.body.response_format.type, 'json_schema');
    assert.equal(request.body.temperature, 0);
    assert.doesNotMatch(request.options.body, /test-secret-never-sent-to-browser/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('OpenAI classifier receives level descriptions but no locked excerpts', async () => {
  const originalFetch = globalThis.fetch;
  let body;
  globalThis.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return openAiResponse({ inScope: true, requiredLevel: 3, highStakes: true });
  };
  try {
    const provider = new OpenAIProvider({ apiKey: 'fake', model: 'test-model' });
    const result = await provider.classify({
      input: 'ambiguous request',
      taxonomy: [{ level: 3, name: 'Permit chapter', description: 'Residence permits and the foreigners office' }],
    });
    assert.equal(result.requiredLevel, 3);
    const serialized = JSON.stringify(body);
    assert.match(serialized, /Permit chapter/);
    assert.doesNotMatch(serialized, /Step-by-step|Documents\/Requirements|wiki\/07/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('API key alone selects OpenAI with the safe default model', () => {
  const provider = createProvider({ OPENAI_API_KEY: 'not-a-real-key' });
  assert.ok(provider instanceof OpenAIProvider);
  assert.equal(provider.model, DEFAULT_OPENAI_MODEL);
  assert.equal(provider.endpoint, 'https://api.openai.com/v1/chat/completions');
  assert.equal(provider.timeoutMs, 12_000);
});

test('OpenAI model and provider configuration remain explicit overrides', () => {
  const provider = createProvider({
    COMPANION_PROVIDER: 'openai',
    OPENAI_API_KEY: 'not-a-real-key',
    OPENAI_MODEL: 'operator-selected-model',
  });
  assert.ok(provider instanceof OpenAIProvider);
  assert.equal(provider.model, 'operator-selected-model');
  assert.throws(
    () => createProvider({ OPENAI_API_KEY: 'not-a-real-key', COMPANION_PROVIDER: 'unknown' }),
    /Unsupported COMPANION_PROVIDER/,
  );
});

test('missing local key stays unconfigured without weakening production startup', () => {
  assert.ok(createProvider({}) instanceof UnconfiguredProvider);
  assert.throws(
    () => createProvider({ NODE_ENV: 'production' }),
    /OPENAI_API_KEY must be set on the server/,
  );
});

test('deterministic mode requires an explicit local test opt-in and is forbidden in production', () => {
  assert.throws(
    () => createProvider({ COMPANION_PROVIDER: 'deterministic' }),
    /restricted to local testing/,
  );
  assert.ok(createProvider({
    NODE_ENV: 'test',
    COMPANION_PROVIDER: 'deterministic',
    COMPANION_ALLOW_TEST_PROVIDER: 'true',
  }) instanceof DeterministicProvider);
  assert.throws(
    () => createProvider({
      NODE_ENV: 'production',
      COMPANION_PROVIDER: 'deterministic',
      COMPANION_ALLOW_TEST_PROVIDER: 'true',
    }),
    /restricted to local testing/,
  );
});

test('production still requires session secret, allowed origins, and HTTPS provider endpoints', async () => {
  await assert.rejects(
    createCompanionServer({ env: { NODE_ENV: 'production', OPENAI_API_KEY: 'not-a-real-key' } }),
    /COMPANION_SESSION_SECRET is required in production/,
  );
  await assert.rejects(
    createCompanionServer({ env: {
      NODE_ENV: 'production',
      COMPANION_SESSION_SECRET: 'production-secret-at-least-32-characters',
      OPENAI_API_KEY: 'not-a-real-key',
    } }),
    /COMPANION_ALLOWED_ORIGINS is required in production/,
  );
  assert.throws(
    () => createProvider({
      NODE_ENV: 'production',
      OPENAI_API_KEY: 'not-a-real-key',
      OPENAI_BASE_URL: 'http://openai.example.test/v1',
    }),
    /must use HTTPS/,
  );
});

test('browser code contains no OpenAI credentials or server configuration', async () => {
  const browserFiles = ['../index.html', '../src/companion.js', '../src/main.js'];
  for (const relative of browserFiles) {
    const source = await readFile(new URL(relative, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /OPENAI_API_KEY|OPENAI_MODEL|Bearer test-secret/);
  }
});
