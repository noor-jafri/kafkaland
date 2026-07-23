import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EFFECT_IDS,
  EFFECT_RECIPES,
  TRACK_DEFINITIONS,
  TRACK_IDS,
  buildEffectEvent,
  effectTriggerLimits,
  footstepEffectId,
  scheduleTrackWindow,
  trackLoopDuration,
} from '../src/audio/index.js';

test('four original procedural tracks expose independent integration slots', () => {
  assert.deepEqual(TRACK_IDS, [
    'cozy-exploration',
    'bureaucracy-office',
    'companion-calm',
    'deadline-pressure',
  ]);
  assert.equal(TRACK_DEFINITIONS['cozy-exploration'].slot, 'music-main');
  assert.equal(TRACK_DEFINITIONS['cozy-exploration'].bpm, 90);
  assert.deepEqual(
    new Set(TRACK_DEFINITIONS['cozy-exploration'].events.map((event) => event.voice)),
    new Set(['softGuitar', 'clarinet', 'marimba', 'roundBass', 'folkBrush', 'woodTap'])
  );
  assert.equal(TRACK_DEFINITIONS['bureaucracy-office'].slot, 'music-main');
  assert.equal(TRACK_DEFINITIONS['companion-calm'].channel, 'ambience');
  assert.equal(TRACK_DEFINITIONS['companion-calm'].slot, 'companion-ambience');
  assert.equal(TRACK_DEFINITIONS['deadline-pressure'].slot, 'pressure-layer');

  for (const track of Object.values(TRACK_DEFINITIONS)) {
    assert.ok(track.events.length > 0);
    assert.ok(track.bpm >= 40 && track.bpm <= 100, `${track.id} remains calm and non-fatiguing`);
    assert.ok(Object.isFrozen(track));
    assert.ok(Object.isFrozen(track.events));
  }
});

test('track scheduling is deterministic, ordered, half-open, and window composable', () => {
  for (const id of TRACK_IDS) {
    const loopSeconds = trackLoopDuration(id);
    const full = scheduleTrackWindow(id, 0, loopSeconds);
    const repeated = scheduleTrackWindow(id, 0, loopSeconds);
    assert.deepEqual(repeated, full);
    assert.ok(full.length > 0);
    assert.ok(full.every((event) => event.timeSeconds >= 0 && event.timeSeconds < loopSeconds));
    assert.ok(full.every((event, index) => index === 0 || event.timeSeconds >= full[index - 1].timeSeconds));
    assert.ok(full.every((event) => event.durationSeconds > 0 && event.gain <= 0.65));

    const split = loopSeconds * 0.47;
    const chunks = [
      ...scheduleTrackWindow(id, 0, split),
      ...scheduleTrackWindow(id, split, loopSeconds),
    ];
    assert.deepEqual(chunks, full, `${id} has no gaps or duplicates across look-ahead windows`);

    const nextLoopStart = scheduleTrackWindow(id, loopSeconds, loopSeconds + 0.001);
    assert.ok(nextLoopStart.length > 0);
    assert.ok(nextLoopStart.every((event) => event.loop === 1));
    assert.ok(nextLoopStart.every((event) => event.timeSeconds >= loopSeconds));
  }
  assert.deepEqual(scheduleTrackWindow('cozy-exploration', 3, 3), []);
  assert.throws(() => scheduleTrackWindow('cozy-exploration', 0, Infinity), /finite seconds/);
  assert.throws(() => scheduleTrackWindow('cozy-exploration', 0, 61), /cannot exceed 60/);
  assert.throws(() => scheduleTrackWindow('not-a-track', 0, 1), /Unknown procedural track/);
  assert.throws(() => scheduleTrackWindow('toString', 0, 1), /Unknown procedural track/);
});

test('effect catalog covers gameplay and companion events with short bounded recipes', () => {
  const requiredIds = [
    'footstep-grass', 'footstep-path', 'footstep-wood', 'footstep-tile',
    'paper-rustle', 'rubber-stamp', 'typewriter-tick',
    'interaction', 'ui-move', 'ui-confirm', 'ui-cancel', 'quest-unlock',
    'quest-success', 'quest-failure', 'official-stamp',
    'locked', 'missing-document', 'door-open', 'door-close', 'mailbox',
    'slime', 'frustration', 'tree-vent',
    'companion-activation', 'companion-thinking', 'companion-answer', 'companion-error',
    'environment-breeze', 'environment-bird', 'environment-bicycle',
    'environment-traffic', 'environment-tram', 'environment-room',
  ];
  assert.deepEqual([...EFFECT_IDS].sort(), [...requiredIds].sort());

  for (const [id, recipe] of Object.entries(EFFECT_RECIPES)) {
    assert.ok(recipe.durationSeconds > 0 && recipe.durationSeconds <= 2.25, `${id} stays short`);
    assert.ok(recipe.cooldownMs >= 0, `${id} has a cooldown`);
    assert.ok(recipe.maxPolyphony >= 1 && recipe.maxPolyphony <= 4, `${id} polyphony is bounded`);
    assert.ok(['effects', 'ambience'].includes(recipe.channel));
    for (const variation of recipe.variations) {
      assert.ok(variation.length > 0);
      assert.ok(variation.every((layer) => layer.gain <= 0.2), `${id} uses restrained layer gain`);
    }
    assert.deepEqual(effectTriggerLimits(id), {
      cooldownMs: recipe.cooldownMs,
      maxPolyphony: recipe.maxPolyphony,
      durationMs: recipe.durationSeconds * 1000,
    });
  }
});

test('effect event decisions rotate deterministically without browser audio nodes', () => {
  assert.equal(footstepEffectId('WOOD'), 'footstep-wood');
  assert.equal(footstepEffectId('unknown'), 'footstep-grass');

  const first = buildEffectEvent('footstep-grass', 0, 12);
  assert.deepEqual(buildEffectEvent('footstep-grass', 0, 12), first);
  assert.equal(first.variationIndex, 0);
  assert.equal(first.startTime, 12);
  assert.ok(first.layers.every((layer) => layer.startTime >= 12));
  assert.equal(buildEffectEvent('footstep-grass', 1, 12).variationIndex, 1);
  assert.equal(buildEffectEvent('footstep-grass', 2, 12).variationIndex, 0);
  assert.equal(buildEffectEvent('footstep-grass', Infinity, Infinity).startTime, 0);
  assert.notEqual(
    buildEffectEvent('footstep-grass', 0, 12).layers.find((layer) => layer.frequency).frequency,
    buildEffectEvent('footstep-grass', 2, 12).layers.find((layer) => layer.frequency).frequency,
    'stable micro-variation avoids identical repeated footsteps'
  );
  assert.throws(() => buildEffectEvent('not-an-effect'), /Unknown procedural effect/);
  assert.throws(() => buildEffectEvent('toString'), /Unknown procedural effect/);
});
