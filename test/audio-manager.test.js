import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioManager } from '../src/audio/index.js';

class FakeAudioParam {
  constructor(value = 1) {
    this.value = value;
    this.events = [];
  }

  cancelAndHoldAtTime(time) {
    this.events.push(['hold', time]);
  }

  cancelScheduledValues(time) {
    this.events.push(['cancel', time]);
  }

  setValueAtTime(value, time) {
    this.value = value;
    this.events.push(['set', value, time]);
  }

  linearRampToValueAtTime(value, time) {
    this.value = value;
    this.events.push(['linear', value, time]);
  }
}

class FakeGainNode {
  constructor() {
    this.gain = new FakeAudioParam();
    this.connectedTo = null;
    this.disconnected = false;
  }

  connect(node) {
    this.connectedTo = node;
  }

  disconnect() {
    this.disconnected = true;
  }
}

class FakeAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.destination = { kind: 'destination' };
    this.gains = [];
    this.resumeCalls = 0;
    this.suspendCalls = 0;
    this.closeCalls = 0;
  }

  createGain() {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }

  async resume() {
    this.resumeCalls += 1;
    this.state = 'running';
  }

  async suspend() {
    this.suspendCalls += 1;
    this.state = 'suspended';
  }

  async close() {
    this.closeCalls += 1;
    this.state = 'closed';
  }
}

function fakeDocument() {
  return {
    hidden: false,
    added: [],
    removed: [],
    addEventListener(type, handler) { this.added.push([type, handler]); },
    removeEventListener(type, handler) { this.removed.push([type, handler]); },
  };
}

test('AudioManager requires explicit unlock and manages buses, ducks, visibility, and track slots', async () => {
  const context = new FakeAudioContext();
  const documentRef = fakeDocument();
  let factoryCalls = 0;
  let intervalCalls = 0;
  let clearedTimer = null;
  const audio = new AudioManager({
    contextFactory: () => {
      factoryCalls += 1;
      return context;
    },
    documentRef,
    setIntervalFn: () => {
      intervalCalls += 1;
      return 17;
    },
    clearIntervalFn: (timer) => { clearedTimer = timer; },
  });

  assert.equal(factoryCalls, 0, 'construction does not trip autoplay policy');
  assert.equal(audio.state, 'locked');
  assert.deepEqual(audio.playTrack('cozy-exploration'), {
    played: false,
    reason: 'locked',
    id: 'cozy-exploration',
  });
  assert.deepEqual(audio.playEffect('ui-confirm'), {
    played: false,
    reason: 'locked',
    id: 'ui-confirm',
  });
  assert.equal(factoryCalls, 0, 'playback calls never unlock implicitly');

  audio.setVolume('effects', 0.4);
  const firstUnlock = audio.unlock();
  const concurrentUnlock = audio.unlock();
  assert.deepEqual(await Promise.all([firstUnlock, concurrentUnlock]), [true, true]);
  assert.equal(factoryCalls, 1, 'concurrent gestures share one context creation');
  assert.equal(context.resumeCalls, 1);
  assert.equal(intervalCalls, 1);
  assert.equal(context.gains.length, 4, 'master plus three output buses');
  assert.equal(context.gains[0].gain.value, 0.8);
  assert.equal(context.gains[1].gain.value, 0.65);
  assert.equal(context.gains[2].gain.value, 0.55);
  assert.equal(context.gains[3].gain.value, 0.4);

  audio.setCompanionActive(true, { fadeSeconds: 0 });
  assert.deepEqual(audio.getDuckingFactors(), { music: 0.22, ambience: 0.42, effects: 0.7 });
  assert.ok(Math.abs(context.gains[1].gain.value - 0.65 * 0.22) < 1e-12);
  assert.ok(Math.abs(context.gains[2].gain.value - 0.55 * 0.42) < 1e-12);
  assert.ok(Math.abs(context.gains[3].gain.value - 0.4 * 0.7) < 1e-12);
  audio.setDialogueActive(true, { fadeSeconds: 0 });
  assert.deepEqual(audio.getDuckingFactors(), { music: 0.22, ambience: 0.42, effects: 0.7 });
  audio.setCompanionActive(false, { fadeSeconds: 0 });
  assert.deepEqual(audio.getDuckingFactors(), { music: 0.32, ambience: 0.58, effects: 0.78 });

  await audio.handleVisibilityChange(true);
  assert.equal(context.state, 'suspended');
  assert.equal(context.suspendCalls, 1);
  assert.deepEqual(audio.playEffect('ui-confirm'), {
    played: false,
    reason: 'suspended',
    id: 'ui-confirm',
  }, 'hidden-tab effects are not queued to play later');
  assert.equal(audio.playTrack('cozy-exploration', { fadeSeconds: 0 }).played, true);
  assert.equal(audio.playTrack('bureaucracy-office', { fadeSeconds: 0 }).played, true);
  assert.equal(audio.getActiveTrack('music-main'), 'bureaucracy-office');
  assert.equal(audio.stopTrack('music-main', { fadeSeconds: 0 }), true);
  assert.equal(audio.getActiveTrack('music-main'), null);

  await audio.handleVisibilityChange(false);
  assert.equal(context.state, 'running');
  assert.equal(context.resumeCalls, 2);

  await audio.dispose();
  assert.equal(context.closeCalls, 1);
  assert.equal(clearedTimer, 17);
  assert.deepEqual(documentRef.removed, documentRef.added);
  await assert.rejects(() => audio.unlock(), /disposed/);
});
