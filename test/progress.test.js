import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyProgressAction,
  createInitialProgress,
  decodeProgress,
  encodeProgress,
  progressCookie,
  publicProgress,
} from '../server/progress.js';

const secret = 'test-session-secret-with-more-than-32-characters';

test('signed HTTP-only progress survives round trip and rejects tampering', () => {
  const progress = createInitialProgress(1_000);
  const token = encodeProgress(progress, secret);
  assert.deepEqual(decodeProgress(token, secret, 2_000), progress);

  const [payload, signature] = token.split('.');
  const tamperedPayload = `${payload.slice(0, -1)}${payload.endsWith('a') ? 'b' : 'a'}`;
  assert.equal(decodeProgress(`${tamperedPayload}.${signature}`, secret, 2_000), null);
  assert.equal(decodeProgress(token, `${secret}-wrong`, 2_000), null);

  const cookie = progressCookie(progress, secret, { secure: true });
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Secure/);
});

test('server progression accepts only ordered named actions', () => {
  let progress = createInitialProgress(1_000);
  assert.deepEqual(publicProgress(progress), {
    currentLevel: 1,
    companionDiscovered: false,
    housingComplete: false,
    levelOneComplete: false,
  });

  assert.throws(() => applyProgressAction(progress, 'complete_level_1', 2_000), { code: 'INVALID_TRANSITION' });
  assert.throws(() => applyProgressAction(progress, 'set_level_5', 2_000), { code: 'INVALID_ACTION' });

  progress = applyProgressAction(progress, 'discover_companion', 2_000);
  progress = applyProgressAction(progress, 'complete_housing', 3_000);
  progress = applyProgressAction(progress, 'complete_level_1', 4_000);
  assert.equal(progress.currentLevel, 2);
  assert.ok(progress.flags.includes('level_1_complete'));
});
