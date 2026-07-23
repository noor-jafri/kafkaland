import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AUDIO_PREFERENCES,
  channelGain,
  clamp,
  combineDucking,
  createGainTransition,
  createTriggerState,
  crossfadeGains,
  evaluateTrigger,
  parseAudioPreferences,
  readAudioPreferences,
  sampleGainTransition,
  serializeAudioPreferences,
  writeAudioPreferences,
} from '../src/audio/index.js';

test('audio values clamp and channel math composes master state separately', () => {
  assert.equal(clamp(-4), 0);
  assert.equal(clamp(4), 1);
  assert.equal(clamp(0.37), 0.37);
  assert.equal(clamp(Number.NaN), 0);

  const preferences = parseAudioPreferences(JSON.stringify({
    muted: false,
    volumes: { master: 0.5, music: 0.8, ambience: 3, effects: -2 },
    channelMutes: { music: false, ambience: true, effects: false },
  }));
  assert.equal(channelGain(preferences, 'master'), 0.5);
  assert.equal(channelGain(preferences, 'music', { music: 0.25 }), 0.2);
  assert.equal(channelGain(preferences, 'ambience'), 0);
  assert.equal(channelGain(preferences, 'effects'), 0);
  assert.throws(() => channelGain(preferences, 'dialogue'), /Unknown audio channel/);

  preferences.muted = true;
  assert.equal(channelGain(preferences, 'master'), 0);
  assert.equal(channelGain(preferences, 'music'), 0);
});

test('preference parsing and local storage helpers are schema-safe and failure-safe', () => {
  assert.deepEqual(parseAudioPreferences('{oops'), DEFAULT_AUDIO_PREFERENCES);
  assert.notEqual(parseAudioPreferences('{oops'), DEFAULT_AUDIO_PREFERENCES);

  const parsed = parseAudioPreferences(JSON.stringify({
    version: 999,
    muted: true,
    volumes: { master: 2, music: 0.4, effects: null },
    channelMutes: { music: true, effects: 'yes' },
    unknown: 'discard me',
  }));
  assert.deepEqual(parsed, {
    version: 1,
    muted: true,
    volumes: { master: 1, music: 0.4, ambience: 0.55, effects: 0.8 },
    channelMutes: { music: true, ambience: false, effects: false },
  });
  assert.equal('unknown' in JSON.parse(serializeAudioPreferences(parsed)), false);

  let stored = null;
  const storage = {
    getItem: () => stored,
    setItem: (_key, value) => { stored = value; },
  };
  assert.equal(writeAudioPreferences(storage, parsed), true);
  assert.deepEqual(readAudioPreferences(storage), parsed);
  assert.equal(writeAudioPreferences({ setItem: () => { throw new Error('denied'); } }, parsed), false);
  assert.deepEqual(readAudioPreferences({ getItem: () => { throw new Error('denied'); } }), DEFAULT_AUDIO_PREFERENCES);
});

test('ducking chooses the quietest active profile per channel', () => {
  assert.deepEqual(combineDucking([]), { music: 1, ambience: 1, effects: 1 });
  assert.deepEqual(combineDucking(['dialogue']), {
    music: 0.32,
    ambience: 0.58,
    effects: 0.78,
  });
  assert.deepEqual(combineDucking(new Map([
    ['dialogue', 'dialogue'],
    ['custom', { music: 0.5, ambience: 0.2, effects: 2 }],
  ])), {
    music: 0.32,
    ambience: 0.2,
    effects: 0.78,
  });
});

test('gain transitions and equal-power crossfades have smooth bounded endpoints', () => {
  const transition = createGainTransition(0.2, 0.8, 10, 2);
  assert.equal(sampleGainTransition(transition, 9), 0.2);
  assert.equal(sampleGainTransition(transition, 10), 0.2);
  assert.equal(sampleGainTransition(transition, 11), 0.5);
  assert.equal(sampleGainTransition(transition, 12), 0.8);
  assert.equal(sampleGainTransition(transition, 20), 0.8);

  assert.deepEqual(crossfadeGains(0), { outgoing: 1, incoming: 0 });
  const midpoint = crossfadeGains(0.5);
  assert.ok(Math.abs(midpoint.outgoing - midpoint.incoming) < 1e-12);
  assert.ok(Math.abs(midpoint.outgoing ** 2 + midpoint.incoming ** 2 - 1) < 1e-12);
  assert.ok(crossfadeGains(1).outgoing < 1e-12);
  assert.equal(crossfadeGains(1).incoming, 1);
});

test('trigger decisions enforce retrigger cooldown and bounded polyphony immutably', () => {
  const initial = createTriggerState();
  const limits = { cooldownMs: 100, durationMs: 500, maxPolyphony: 2 };
  const first = evaluateTrigger(initial, limits, 1000);
  assert.equal(first.accepted, true);
  assert.deepEqual(initial.activeUntilMs, [], 'input state is not mutated');

  const cooldown = evaluateTrigger(first.state, limits, 1050);
  assert.deepEqual({ accepted: cooldown.accepted, reason: cooldown.reason }, {
    accepted: false,
    reason: 'cooldown',
  });
  const second = evaluateTrigger(first.state, limits, 1100);
  assert.equal(second.accepted, true);
  const polyphony = evaluateTrigger(second.state, limits, 1200);
  assert.deepEqual({ accepted: polyphony.accepted, reason: polyphony.reason }, {
    accepted: false,
    reason: 'polyphony',
  });
  const afterVoicesEnd = evaluateTrigger(second.state, limits, 1600);
  assert.equal(afterVoicesEnd.accepted, true);
});
