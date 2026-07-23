import http from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { answerCompanion } from './answer-service.js';
import { createProvider, ProviderError } from './provider.js';
import {
  applyProgressAction,
  createInitialProgress,
  progressCookie,
  publicProgress,
  readProgressFromRequest,
} from './progress.js';
import { loadWikiCorpus } from './wiki-corpus.js';

const BODY_LIMIT = 16 * 1024;
const QUESTION_LIMIT = 1_000;
const LETTER_LIMIT = 12_000;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

class FixedWindowLimiter {
  constructor({ limit = 8, windowMs = 60_000 } = {}) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.entries = new Map();
  }

  take(key, now = Date.now()) {
    let entry = this.entries.get(key);
    if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + this.windowMs };
    entry.count++;
    this.entries.set(key, entry);
    if (this.entries.size > 5_000) {
      for (const [entryKey, candidate] of this.entries) if (candidate.resetAt <= now) this.entries.delete(entryKey);
    }
    return { allowed: entry.count <= this.limit, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
}

function allowedOriginsFrom(env) {
  const configured = env.COMPANION_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (configured?.length) return new Set(configured);
  if (env.NODE_ENV === 'production') throw new Error('COMPANION_ALLOWED_ORIGINS is required in production');
  return new Set(['http://127.0.0.1:5173', 'http://localhost:5173']);
}

function requestIp(request) {
  return request.socket.remoteAddress || 'unknown';
}

function assertOrigin(request, allowedOrigins) {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigins.has(origin)) throw new HttpError(403, 'ORIGIN_REJECTED', 'Request origin is not allowed');
  if (request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'ORIGIN_REJECTED', 'Cross-site requests are not allowed');
}

function assertOnlyKeys(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'INVALID_REQUEST', 'Expected a JSON object');
  const allowed = new Set(keys);
  if (Object.keys(value).some((key) => !allowed.has(key))) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Request contains unsupported fields');
  }
}

function readJson(request, maxBytes = BODY_LIMIT) {
  return new Promise((resolve, reject) => {
    if (!String(request.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      reject(new HttpError(415, 'CONTENT_TYPE_REQUIRED', 'Content-Type must be application/json'));
      return;
    }
    const declaredLength = Number(request.headers['content-length']);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      reject(new HttpError(413, 'REQUEST_TOO_LARGE', 'Request is too large'));
      request.resume();
      return;
    }
    const chunks = [];
    let bytes = 0;
    let tooLarge = false;
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        tooLarge = true;
        chunks.length = 0;
      } else if (!tooLarge) chunks.push(chunk);
    });
    request.on('end', () => {
      if (tooLarge) {
        reject(new HttpError(413, 'REQUEST_TOO_LARGE', 'Request is too large'));
        return;
      }
      try {
        resolve({ value: JSON.parse(Buffer.concat(chunks).toString('utf8')), bytes });
      } catch {
        reject(new HttpError(400, 'INVALID_JSON', 'Request body is not valid JSON'));
      }
    });
    request.on('aborted', () => reject(new HttpError(499, 'REQUEST_CANCELLED', 'Request was cancelled')));
    request.on('error', reject);
  });
}

function sendJson(response, status, value, extraHeaders = {}) {
  if (response.writableEnded || response.destroyed) return;
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store, private',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    ...extraHeaders,
  });
  response.end(body);
}

function providerStatus(error) {
  if (error.code === 'PROVIDER_TIMEOUT') return 504;
  if (error.code === 'PROVIDER_NOT_CONFIGURED') return 503;
  if (error.code === 'INVALID_MODEL_RESPONSE' || error.code === 'LOCKED_SOURCE_BOUNDARY') return 502;
  return 503;
}

function safeError(error) {
  if (error instanceof HttpError) return { status: error.status, code: error.code, message: error.message };
  if (error?.code === 'INVALID_ACTION') return { status: 400, code: error.code, message: error.message };
  if (error?.code === 'INVALID_TRANSITION') return { status: 409, code: error.code, message: error.message };
  if (error instanceof ProviderError) {
    return {
      status: providerStatus(error),
      code: error.code,
      message: error.code === 'INVALID_MODEL_RESPONSE'
        ? 'The companion could not verify a grounded answer. Please try again.'
        : error.message,
    };
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: 'The companion service hit an unexpected error' };
}

export async function createCompanionServer({
  env = process.env,
  corpus,
  provider,
  logger = console,
  now = () => Date.now(),
} = {}) {
  const production = env.NODE_ENV === 'production';
  let sessionSecret = env.COMPANION_SESSION_SECRET;
  if (!sessionSecret) {
    if (production) throw new Error('COMPANION_SESSION_SECRET is required in production');
    sessionSecret = randomBytes(32).toString('hex');
    logger.warn?.('Companion sessions use an ephemeral development secret; sessions reset when the API restarts.');
  }
  if (sessionSecret.length < 32) throw new Error('COMPANION_SESSION_SECRET must be at least 32 characters');

  const allowedOrigins = allowedOriginsFrom(env);
  const wikiCorpus = corpus || await loadWikiCorpus();
  const modelProvider = provider || createProvider(env);
  const limiter = new FixedWindowLimiter({
    limit: Number(env.COMPANION_RATE_LIMIT) || 8,
    windowMs: Number(env.COMPANION_RATE_WINDOW_MS) || 60_000,
  });
  const inFlight = new Map();

  const server = http.createServer(async (request, response) => {
    const startedAt = now();
    const requestId = randomUUID();
    const url = new URL(request.url, 'http://companion.invalid');
    let status = 500;
    let requestBytes = 0;
    let mode;
    const abortController = new AbortController();
    request.once('aborted', () => abortController.abort());
    response.once('close', () => {
      if (!response.writableEnded) abortController.abort();
    });

    try {
      if (request.method === 'GET' && url.pathname === '/api/companion/health') {
        status = 200;
        sendJson(response, status, { ok: true, wikiSections: wikiCorpus.length });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/api/companion/session') {
        let progress = readProgressFromRequest(request, sessionSecret, now());
        if (!progress) progress = createInitialProgress(now());
        status = 200;
        sendJson(response, status, { progress: publicProgress(progress) }, {
          'set-cookie': progressCookie(progress, sessionSecret, { secure: production }),
        });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/companion/progress') {
        assertOrigin(request, allowedOrigins);
        const progress = readProgressFromRequest(request, sessionSecret, now());
        if (!progress) throw new HttpError(401, 'SESSION_REQUIRED', 'Start a companion session first');
        const parsed = await readJson(request);
        requestBytes = parsed.bytes;
        assertOnlyKeys(parsed.value, ['action']);
        const updated = applyProgressAction(progress, parsed.value.action, now());
        status = 200;
        sendJson(response, status, { progress: publicProgress(updated) }, {
          'set-cookie': progressCookie(updated, sessionSecret, { secure: production }),
        });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/companion/messages') {
        assertOrigin(request, allowedOrigins);
        const progress = readProgressFromRequest(request, sessionSecret, now());
        if (!progress) throw new HttpError(401, 'SESSION_REQUIRED', 'Start a companion session first');
        const parsed = await readJson(request);
        requestBytes = parsed.bytes;
        assertOnlyKeys(parsed.value, ['mode', 'input']);
        mode = parsed.value.mode;
        const input = parsed.value.input;
        if (!['ask', 'letter'].includes(mode) || typeof input !== 'string' || !input.trim()) {
          throw new HttpError(400, 'INVALID_REQUEST', 'Mode and input are required');
        }
        const inputLimit = mode === 'letter' ? LETTER_LIMIT : QUESTION_LIMIT;
        if (input.length > inputLimit) throw new HttpError(413, 'INPUT_TOO_LARGE', `Input exceeds ${inputLimit} characters`);

        const rateKey = `${requestIp(request)}:${progress.sessionId}`;
        const rate = limiter.take(rateKey, now());
        if (!rate.allowed) {
          throw new HttpError(429, 'RATE_LIMITED', `Too many requests. Try again in ${rate.retryAfter} seconds.`);
        }
        const active = inFlight.get(progress.sessionId) || 0;
        if (active >= 2) throw new HttpError(429, 'TOO_MANY_IN_FLIGHT', 'Wait for an earlier answer to finish');
        inFlight.set(progress.sessionId, active + 1);
        try {
          const result = await answerCompanion({
            mode,
            input,
            progress,
            corpus: wikiCorpus,
            provider: modelProvider,
            signal: abortController.signal,
          });
          status = 200;
          sendJson(response, status, result);
        } finally {
          const remaining = (inFlight.get(progress.sessionId) || 1) - 1;
          if (remaining > 0) inFlight.set(progress.sessionId, remaining);
          else inFlight.delete(progress.sessionId);
        }
        return;
      }

      status = 404;
      sendJson(response, status, { error: { code: 'NOT_FOUND', message: 'Not found' } });
    } catch (error) {
      const safe = safeError(error);
      status = safe.status;
      const headers = status === 429 ? { 'retry-after': String(error.message.match(/\d+/)?.[0] || 5) } : {};
      sendJson(response, status, { error: { code: safe.code, message: safe.message } }, headers);
      if (status >= 500 && !(error instanceof ProviderError)) {
        logger.error?.({ requestId, route: url.pathname, errorCode: safe.code });
      }
    } finally {
      logger.info?.({
        requestId,
        method: request.method,
        route: url.pathname,
        status,
        durationMs: Math.max(0, now() - startedAt),
        requestBytes,
        ...(mode ? { mode } : {}),
      });
    }
  });

  server.requestTimeout = 20_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  server.maxHeadersCount = 64;
  return server;
}
