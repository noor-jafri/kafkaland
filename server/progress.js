import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'kafkaland_progress';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const TRANSITIONS = Object.freeze({
  discover_companion(progress) {
    return withFlag(progress, 'companion_discovered');
  },
  complete_housing(progress) {
    requireFlag(progress, 'arrival_complete');
    return withFlag(progress, 'housing_complete');
  },
  complete_level_1(progress) {
    requireFlag(progress, 'housing_complete');
    return { ...withFlag(progress, 'level_1_complete'), currentLevel: Math.max(progress.currentLevel, 2) };
  },
  complete_level_2(progress) {
    requireFlag(progress, 'level_1_complete');
    return { ...withFlag(progress, 'level_2_complete'), currentLevel: Math.max(progress.currentLevel, 3) };
  },
});

function requireFlag(progress, flag) {
  if (!progress.flags.includes(flag)) {
    const error = new Error('Progression prerequisites are not complete');
    error.code = 'INVALID_TRANSITION';
    throw error;
  }
}

function withFlag(progress, flag) {
  if (progress.flags.includes(flag)) return progress;
  return { ...progress, flags: [...progress.flags, flag].sort() };
}

export function createInitialProgress(now = Date.now()) {
  return {
    version: 1,
    sessionId: randomUUID(),
    currentLevel: 1,
    flags: ['arrival_complete'],
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };
}

export function applyProgressAction(progress, action, now = Date.now()) {
  if (typeof action !== 'string' || !Object.hasOwn(TRANSITIONS, action)) {
    const error = new Error('Unknown progression action');
    error.code = 'INVALID_ACTION';
    throw error;
  }
  const updated = TRANSITIONS[action](progress);
  return {
    ...updated,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };
}

function signatureFor(encodedPayload, secret) {
  return createHmac('sha256', secret).update(encodedPayload).digest('base64url');
}

export function encodeProgress(progress, secret) {
  const payload = Buffer.from(JSON.stringify(progress)).toString('base64url');
  return `${payload}.${signatureFor(payload, secret)}`;
}

export function decodeProgress(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 4096) return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;
  const payload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  const expectedSignature = signatureFor(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const progress = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (
      progress?.version !== 1 ||
      typeof progress.sessionId !== 'string' ||
      !Number.isInteger(progress.currentLevel) ||
      progress.currentLevel < 1 || progress.currentLevel > 5 ||
      !Array.isArray(progress.flags) ||
      progress.flags.some((flag) => typeof flag !== 'string') ||
      !Number.isFinite(progress.expiresAt) ||
      progress.expiresAt <= now
    ) return null;
    return progress;
  } catch {
    return null;
  }
}

export function parseCookies(header = '') {
  const cookies = {};
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim();
    try {
      cookies[key] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      // Ignore malformed cookie values.
    }
  }
  return cookies;
}

export function readProgressFromRequest(request, secret, now = Date.now()) {
  const token = parseCookies(request.headers.cookie)[SESSION_COOKIE];
  return token ? decodeProgress(token, secret, now) : null;
}

export function progressCookie(progress, secret, { secure = false } = {}) {
  const attributes = [
    `${SESSION_COOKIE}=${encodeProgress(progress, secret)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export function publicProgress(progress) {
  return {
    currentLevel: progress.currentLevel,
    companionDiscovered: progress.flags.includes('companion_discovered'),
    housingComplete: progress.flags.includes('housing_complete'),
    levelOneComplete: progress.flags.includes('level_1_complete'),
    levelTwoComplete: progress.flags.includes('level_2_complete'),
  };
}
