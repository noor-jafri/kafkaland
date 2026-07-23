import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createCompanionServer } from '../server/app.js';
import { DeterministicProvider } from '../server/provider.js';

const ORIGIN = 'http://127.0.0.1:5173';

async function startApi() {
  const logs = [];
  const provider = new DeterministicProvider();
  const logger = {
    info(value) { logs.push(value); },
    warn(value) { logs.push(value); },
    error(value) { logs.push(value); },
  };
  const server = await createCompanionServer({
    env: {
      NODE_ENV: 'test',
      COMPANION_SESSION_SECRET: 'api-test-secret-with-at-least-32-characters',
      COMPANION_ALLOWED_ORIGINS: ORIGIN,
      COMPANION_RATE_LIMIT: '30',
    },
    provider,
    logger,
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}`, provider, logs };
}

async function closeApi(server) {
  server.close();
  await once(server, 'close');
}

function client(baseUrl) {
  let cookie = '';
  return {
    get cookie() { return cookie; },
    set cookie(value) { cookie = value; },
    async request(path, { method = 'GET', body, cookieOverride } = {}) {
      const headers = {};
      if (method !== 'GET') {
        headers.origin = ORIGIN;
        headers['content-type'] = 'application/json';
      }
      const selectedCookie = cookieOverride ?? cookie;
      if (selectedCookie) headers.cookie = selectedCookie;
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) cookie = setCookie.split(';', 1)[0];
      const payload = await response.json();
      return { response, payload };
    },
  };
}

test('API enforces signed progress, grounding, letter evidence, and safe logs', async () => {
  const { server, baseUrl, provider, logs } = await startApi();
  const api = client(baseUrl);
  try {
    let result = await api.request('/api/companion/session');
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.progress.currentLevel, 1);
    assert.match(result.response.headers.get('set-cookie'), /HttpOnly/);

    result = await api.request('/api/companion/messages', {
      method: 'POST',
      body: { mode: 'ask', input: 'Which documents should I prepare before arriving?' },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.type, 'answer');
    assert.equal(result.payload.citations[0].path, 'wiki/01-before-you-arrive.md');
    assert.match(result.payload.answer, /\[S1\]/);
    assert.equal(provider.callCount, 1);

    result = await api.request('/api/companion/messages', {
      method: 'POST',
      body: { mode: 'ask', input: 'How do I open a bank account?' },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.type, 'locked');
    assert.deepEqual(result.payload.citations, []);
    assert.equal(provider.callCount, 1, 'locked text never reaches the provider');

    result = await api.request('/api/companion/messages', {
      method: 'POST',
      body: { mode: 'ask', input: 'hello', level: 5 },
    });
    assert.equal(result.response.status, 400);
    assert.equal(result.payload.error.code, 'INVALID_REQUEST');

    result = await api.request('/api/companion/progress', {
      method: 'POST',
      body: { action: 'complete_level_1' },
    });
    assert.equal(result.response.status, 409);

    result = await api.request('/api/companion/progress', {
      method: 'POST',
      body: { action: 'complete_housing' },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.progress.housingComplete, true);

    result = await api.request('/api/companion/messages', {
      method: 'POST',
      body: { mode: 'ask', input: 'Was brauche ich für die Anmeldung?' },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.locale, 'de');
    assert.equal(result.payload.type, 'answer');
    assert.ok(result.payload.citations.some((citation) => citation.path === 'wiki/04-city-registration-anmeldung.md'));

    result = await api.request('/api/companion/progress', {
      method: 'POST',
      body: { action: 'complete_level_1' },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.progress.currentLevel, 2);

    result = await api.request('/api/companion/messages', {
      method: 'POST',
      body: { mode: 'ask', input: 'How do I open a bank account?' },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.type, 'answer');
    assert.equal(result.payload.citations[0].path, 'wiki/05-bank-account.md');

    const letter = 'Für die Anmeldung: Bitte reichen Sie die Wohnungsgeberbestätigung bis zum 30.09.2026 ein.';
    result = await api.request('/api/companion/messages', {
      method: 'POST',
      body: { mode: 'letter', input: letter },
    });
    assert.equal(result.response.status, 200);
    assert.equal(result.payload.type, 'letter');
    assert.equal(result.payload.locale, 'de');
    assert.match(result.payload.warning, /Keine Rechtsberatung/);
    assert.equal(result.payload.deadlines[0].evidenceQuote, letter);
    assert.equal(result.payload.actions[0].evidenceQuote, letter);
    assert.ok(result.payload.citations.length > 0);

    result = await api.request('/api/companion/messages', {
      method: 'POST',
      cookieOverride: `${api.cookie}tampered`,
      body: { mode: 'ask', input: 'passport' },
    });
    assert.equal(result.response.status, 401);

    result = await api.request('/api/companion/messages', {
      method: 'POST',
      body: { mode: 'letter', input: 'x'.repeat(12_001) },
    });
    assert.equal(result.response.status, 413);

    const serializedLogs = JSON.stringify(logs);
    assert.doesNotMatch(serializedLogs, /30\.09\.2026|Wohnungsgeberbestätigung|COMPANION_SESSION_SECRET/);
  } finally {
    await closeApi(server);
  }
});

test('POST requests reject missing or cross-site origins', async () => {
  const { server, baseUrl } = await startApi();
  try {
    const response = await fetch(`${baseUrl}/api/companion/progress`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'discover_companion' }),
    });
    assert.equal(response.status, 403);
  } finally {
    await closeApi(server);
  }
});
