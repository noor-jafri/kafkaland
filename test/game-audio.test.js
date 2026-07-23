import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio, GAME_AUDIO_EVENT_EFFECTS } from '../src/audio/game-audio.js';
import { DEFAULT_AUDIO_PREFERENCES } from '../src/audio/core.js';

class FakeManager {
  constructor() {
    this.unlocked = false;
    this.state = 'locked';
    this.preferences = structuredClone(DEFAULT_AUDIO_PREFERENCES);
    this.calls = [];
    this.activeTracks = {};
    this.ducking = { music: 1, ambience: 1, effects: 1 };
  }

  restorePreferences(storage) { this.calls.push(['restore', storage]); }
  persistPreferences(storage) { this.calls.push(['persist', storage]); return true; }
  async unlock() { this.calls.push(['unlock']); this.unlocked = true; this.state = 'running'; return true; }
  getPreferences() { return structuredClone(this.preferences); }
  setVolume(channel, value) { this.preferences.volumes[channel] = value; return value; }
  setMuted(value) { this.preferences.muted = value; return value; }
  setChannelMuted(channel, value) {
    if (channel === 'master') return this.setMuted(value);
    this.preferences.channelMutes[channel] = value;
    return value;
  }
  playTrack(id, options) {
    this.calls.push(['playTrack', id, options]);
    const slots = {
      'cozy-exploration': 'music-main',
      'bureaucracy-office': 'music-main',
      'companion-calm': 'companion-ambience',
      'deadline-pressure': 'pressure-layer',
    };
    this.activeTracks[slots[id]] = { id, level: options.level };
    return { played: true, id, slot: slots[id] };
  }
  stopTrack(slot, options) { this.calls.push(['stopTrack', slot, options]); delete this.activeTracks[slot]; return true; }
  stopAllTracks(options) { this.calls.push(['stopAllTracks', options]); this.activeTracks = {}; }
  playEffect(id, options) { this.calls.push(['playEffect', id, options]); return { played: true, id }; }
  playFootstep(surface, options) { this.calls.push(['footstep', surface, options]); return { played: true }; }
  setDialogueActive(active) { this.calls.push(['dialogue', active]); }
  setCompanionActive(active) { this.calls.push(['companion', active]); }
  setDucking(reason, active, profile) { this.calls.push(['duck', reason, active, profile]); }
  getDiagnostics() {
    return {
      unlocked: this.unlocked,
      state: this.state,
      preferences: this.getPreferences(),
      ducking: this.ducking,
      activeTracks: structuredClone(this.activeTracks),
      activeSessionCount: Object.keys(this.activeTracks).length,
    };
  }
  async dispose() { this.calls.push(['dispose']); this.state = 'closed'; }
}

function fakeDocument() {
  return {
    hidden: false,
    listeners: [],
    addEventListener(type, handler, options) { this.listeners.push(['add', type, handler, options]); },
    removeEventListener(type, handler, options) { this.listeners.push(['remove', type, handler, options]); },
  };
}

function calls(manager, name) {
  return manager.calls.filter((entry) => entry[0] === name);
}

test('GameAudio waits for a gesture, restores preferences, and orchestrates adaptive scenes', async () => {
  const manager = new FakeManager();
  const documentRef = fakeDocument();
  const storage = { name: 'storage' };
  const audio = new GameAudio({ manager, documentRef, storage });

  assert.equal(calls(manager, 'unlock').length, 0);
  assert.deepEqual(manager.calls[0], ['restore', storage]);
  audio.installGestureUnlock();
  assert.equal(documentRef.listeners.filter(([operation]) => operation === 'add').length, 2);

  audio.startGame();
  assert.equal(calls(manager, 'playTrack').length, 0, 'desired scene does not bypass autoplay');
  await audio.unlockFromGesture();
  assert.equal(calls(manager, 'unlock').length, 1);
  assert.equal(manager.activeTracks['music-main'].id, 'cozy-exploration');

  const deadlineLevel = audio.setDeadlineProgress(12, 14);
  assert.ok(deadlineLevel > 0 && deadlineLevel <= 0.42);
  assert.equal(manager.activeTracks['pressure-layer'].id, 'deadline-pressure');
  assert.equal(manager.activeTracks['pressure-layer'].level, deadlineLevel);

  audio.emit('building-enter');
  assert.equal(audio.getDiagnostics().scene, 'office');
  assert.equal(manager.activeTracks['music-main'].id, 'bureaucracy-office');
  assert.equal(manager.activeTracks['pressure-layer'], undefined);
  assert.ok(calls(manager, 'playEffect').some((entry) => entry[1] === 'door-open'));
  assert.ok(calls(manager, 'playEffect').some((entry) => entry[1] === 'environment-room'));

  audio.emit('dialogue-open');
  assert.deepEqual(calls(manager, 'dialogue').at(-1), ['dialogue', true]);
  audio.emit('dialogue-close');
  assert.deepEqual(calls(manager, 'dialogue').at(-1), ['dialogue', false]);
  assert.equal(audio.getDiagnostics().scene, 'exploration');

  audio.emit('companion-open');
  assert.equal(audio.getDiagnostics().scene, 'companion');
  assert.equal(manager.activeTracks['music-main'], undefined);
  assert.equal(manager.activeTracks['companion-ambience'].id, 'companion-calm');
  assert.deepEqual(calls(manager, 'companion').at(-1), ['companion', true]);
  audio.emit('companion-close');
  assert.equal(audio.getDiagnostics().scene, 'exploration');
  assert.deepEqual(calls(manager, 'companion').at(-1), ['companion', false]);

  audio.emit('completion');
  assert.equal(audio.getDiagnostics().scene, 'completion');
  assert.deepEqual(manager.activeTracks, {});
  assert.ok(calls(manager, 'playEffect').some((entry) => entry[1] === 'quest-success'));

  await audio.dispose();
  assert.equal(documentRef.listeners.filter(([operation]) => operation === 'remove').length, 2);
});

test('GameAudio centralizes event reuse, movement cadence, ambience, and persisted controls', async () => {
  const manager = new FakeManager();
  const audio = new GameAudio({ manager, documentRef: fakeDocument(), storage: {} });
  await audio.unlockFromGesture();
  audio.startGame();

  const requiredEvents = [
    'ui-open', 'ui-close', 'ui-select', 'ui-confirm', 'ui-back',
    'npc-interaction', 'document-pickup', 'paper-rustle', 'rubber-stamp', 'official-stamp',
    'dialogue-line', 'quest-unlock', 'quest-success', 'quest-failure',
    'locked-feedback', 'missing-document', 'door-open', 'door-close', 'mail-delivery',
    'slime-move', 'slime-collision', 'frustration-increase', 'tree-vent',
    'companion-activation', 'companion-thinking', 'companion-answer', 'companion-error',
  ];
  assert.ok(requiredEvents.every((event) => GAME_AUDIO_EVENT_EFFECTS[event]));
  assert.equal(GAME_AUDIO_EVENT_EFFECTS['ui-open'], GAME_AUDIO_EVENT_EFFECTS['npc-interaction']);
  assert.equal(GAME_AUDIO_EVENT_EFFECTS['ui-close'], GAME_AUDIO_EVENT_EFFECTS['ui-back']);

  audio.update(0.1, { active: true, moving: true, surface: 'path', slimeNearby: true });
  assert.deepEqual(calls(manager, 'footstep').at(-1), ['footstep', 'path', { gain: 0.72 }]);
  for (let index = 0; index < 80; index += 1) {
    audio.update(0.1, { active: true, moving: false, slimeNearby: true });
  }
  assert.ok(calls(manager, 'playEffect').some((entry) => entry[1] === 'slime'));
  assert.ok(calls(manager, 'playEffect').some((entry) => entry[1] === 'environment-bird'));

  const stepsBeforePause = calls(manager, 'footstep').length;
  audio.update(0.25, { active: false, moving: true, surface: 'grass', slimeNearby: true });
  assert.equal(calls(manager, 'footstep').length, stepsBeforePause);
  assert.equal(audio.getDiagnostics().paused, true);

  audio.setVolume('music', 0.31);
  audio.setChannelMuted('ambience', true);
  audio.setMuted(true);
  assert.equal(manager.preferences.volumes.music, 0.31);
  assert.equal(manager.preferences.channelMutes.ambience, true);
  assert.equal(manager.preferences.muted, true);
  assert.equal(calls(manager, 'persist').length, 3);
});
