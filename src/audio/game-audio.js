import { AudioManager } from './AudioManager.js';
import { clamp } from './core.js';

const EXPLORATION_AMBIENCE = Object.freeze([
  'environment-bird',
  'environment-breeze',
  'environment-bicycle',
  'environment-traffic',
  'environment-tram',
]);
const AMBIENCE_GAPS_SECONDS = Object.freeze([11, 14, 18, 12, 20]);

/**
 * Semantic game events mapped to the smallest reusable procedural recipes.
 * Several related UI events deliberately share one recipe to avoid near-duplicates.
 */
export const GAME_AUDIO_EVENT_EFFECTS = Object.freeze({
  'ui-open': 'interaction',
  'ui-close': 'ui-cancel',
  'ui-select': 'ui-move',
  'ui-confirm': 'ui-confirm',
  'ui-back': 'ui-cancel',
  'npc-interaction': 'interaction',
  'document-pickup': 'paper-rustle',
  'paper-rustle': 'paper-rustle',
  'rubber-stamp': 'rubber-stamp',
  'official-stamp': 'official-stamp',
  'dialogue-line': 'typewriter-tick',
  'quest-unlock': 'quest-unlock',
  'quest-success': 'quest-success',
  'quest-failure': 'quest-failure',
  'locked-feedback': 'locked',
  'missing-document': 'missing-document',
  'door-open': 'door-open',
  'door-close': 'door-close',
  'mail-delivery': 'mailbox',
  'slime-move': 'slime',
  'slime-collision': 'slime',
  'frustration-increase': 'frustration',
  'tree-vent': 'tree-vent',
  'companion-activation': 'companion-activation',
  'companion-thinking': 'companion-thinking',
  'companion-answer': 'companion-answer',
  'companion-error': 'companion-error',
});

/**
 * The only gameplay-facing audio coordinator. It owns exactly one AudioManager,
 * translates semantic events, and keeps score, ambience, ducking, cooldowns,
 * preference persistence, and autoplay unlock behavior in one place.
 */
export class GameAudio {
  constructor(options = {}) {
    this.manager = options.manager || new AudioManager({
      documentRef: options.documentRef,
      onError: (error) => this.#handleError(error),
    });
    this.document = options.documentRef === undefined ? globalThis.document : options.documentRef;
    this.storage = options.storage === undefined ? safeLocalStorage() : options.storage;
    this.scene = 'title';
    this.started = false;
    this.paused = true;
    this.deadlineLevel = 0;
    this.stepTimer = 0;
    this.slimeTimer = 0.5;
    this.ambienceTimer = 7;
    this.ambienceIndex = 0;
    this.lastError = null;
    this.listeners = new Set();
    this.unlockTask = null;
    this.gestureInstalled = false;

    this.manager.restorePreferences?.(this.storage);
    this.gestureHandler = (event) => {
      if (event.type === 'keydown' && (event.repeat || event.metaKey || event.ctrlKey || event.altKey)) return;
      this.unlockFromGesture();
    };
  }

  /** Install passive capture listeners. The AudioContext is still not created. */
  installGestureUnlock() {
    if (this.gestureInstalled || !this.document?.addEventListener) return;
    this.gestureInstalled = true;
    this.document.addEventListener('pointerdown', this.gestureHandler, { capture: true });
    this.document.addEventListener('keydown', this.gestureHandler, { capture: true });
    this.#notify();
  }

  /** Must be reached from a pointer/key event to satisfy browser autoplay policy. */
  unlockFromGesture() {
    if (this.manager.unlocked && this.manager.state === 'running') return Promise.resolve(true);
    if (this.unlockTask) return this.unlockTask;
    const task = Promise.resolve(this.manager.unlock())
      .then(() => {
        this.lastError = null;
        this.#applyScene();
        this.#notify();
        return true;
      })
      .catch((error) => {
        this.#handleError(error);
        return false;
      })
      .finally(() => {
        if (this.unlockTask === task) this.unlockTask = null;
      });
    this.unlockTask = task;
    return task;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getDiagnostics());
    return () => this.listeners.delete(listener);
  }

  getPreferences() {
    return this.manager.getPreferences();
  }

  setVolume(channel, value) {
    const result = this.manager.setVolume(channel, value);
    this.manager.persistPreferences?.(this.storage);
    this.#notify();
    return result;
  }

  setChannelMuted(channel, muted) {
    const result = this.manager.setChannelMuted(channel, muted);
    this.manager.persistPreferences?.(this.storage);
    this.#notify();
    return result;
  }

  setMuted(muted) {
    const result = this.manager.setMuted(muted);
    this.manager.persistPreferences?.(this.storage);
    this.#notify();
    return result;
  }

  startGame() {
    this.started = true;
    this.paused = false;
    this.setScene('exploration');
  }

  setScene(scene) {
    if (!['title', 'exploration', 'office', 'companion', 'completion'].includes(scene)) {
      throw new RangeError(`Unknown audio scene: ${scene}`);
    }
    this.scene = scene;
    this.#applyScene();
    this.#notify();
  }

  setDeadlineProgress(day, deadline) {
    const ratio = Math.max(0, Number(day) || 0) / Math.max(1, Number(deadline) || 1);
    const threshold = 0.58;
    this.deadlineLevel = ratio < threshold
      ? 0
      : clamp(0.08 + ((ratio - threshold) / 0.52) * 0.34, 0, 0.42);
    this.#syncDeadlineLayer();
    this.#notify();
    return this.deadlineLevel;
  }

  /**
   * Stop movement and environmental accents while gameplay is blocked. The
   * score continues smoothly; dialogue/companion events apply their own ducks.
   */
  update(deltaSeconds, state = {}) {
    const delta = clamp(deltaSeconds, 0, 0.25);
    this.paused = state.active === false;
    if (!this.started || this.paused || this.scene !== 'exploration') return;

    if (state.moving) {
      this.stepTimer -= delta;
      if (this.stepTimer <= 0) {
        this.manager.playFootstep(state.surface || 'grass', { gain: 0.72 });
        this.stepTimer = 0.31;
      }
    } else {
      this.stepTimer = Math.min(this.stepTimer, 0.06);
    }

    this.slimeTimer -= delta;
    if (state.slimeNearby && this.slimeTimer <= 0) {
      this.emit('slime-move', { gain: 0.34 });
      this.slimeTimer = 1.35;
    }

    this.ambienceTimer -= delta;
    if (this.ambienceTimer <= 0) {
      const effect = EXPLORATION_AMBIENCE[this.ambienceIndex % EXPLORATION_AMBIENCE.length];
      this.manager.playEffect(effect, { gain: 0.62 });
      this.ambienceTimer = AMBIENCE_GAPS_SECONDS[this.ambienceIndex % AMBIENCE_GAPS_SECONDS.length];
      this.ambienceIndex += 1;
    }
  }

  /** Handle one semantic event without exposing raw effect IDs to game modules. */
  emit(name, detail = {}) {
    switch (name) {
      case 'building-enter':
        this.setScene('office');
        this.#effect('door-open', detail);
        this.manager.playEffect('environment-room', { gain: 0.58 });
        return this.#effect('npc-interaction', { gain: 0.65 });
      case 'dialogue-open':
        this.manager.setDialogueActive(true);
        return this.#effect('dialogue-line', { gain: 0.72 });
      case 'dialogue-line':
        this.#effect('ui-confirm', { gain: 0.45 });
        return this.#effect('dialogue-line', { gain: 0.72 });
      case 'dialogue-close':
        this.manager.setDialogueActive(false);
        this.#effect('door-close', { gain: 0.6 });
        if (this.started) this.setScene('exploration');
        return this.#effect('ui-close', { gain: 0.45 });
      case 'fact-open':
        this.manager.setDialogueActive(true);
        return this.#effect(detail.firstTime === false ? 'paper-rustle' : 'official-stamp');
      case 'fact-close':
        this.manager.setDialogueActive(false);
        return this.#effect('ui-close', { gain: 0.45 });
      case 'companion-open':
        this.manager.setCompanionActive(true);
        this.setScene('companion');
        return this.#effect('companion-activation');
      case 'companion-close':
        this.manager.setCompanionActive(false);
        if (this.started) this.setScene('exploration');
        return this.#effect('ui-close', { gain: 0.5 });
      case 'companion-locked':
        return this.#effect('locked-feedback');
      case 'settings-open':
        this.manager.setDucking('settings', true, { music: 0.58, ambience: 0.7, effects: 0.86, attackSeconds: 0.08, releaseSeconds: 0.3 });
        return this.#effect('ui-open', { gain: 0.5 });
      case 'settings-close':
        this.manager.setDucking('settings', false);
        return this.#effect('ui-close', { gain: 0.45 });
      case 'completion':
        this.manager.setDialogueActive(false);
        this.manager.setCompanionActive(false);
        this.setScene('completion');
        return this.#effect('quest-success');
      default:
        return this.#effect(name, detail);
    }
  }

  getDiagnostics() {
    return {
      ...this.manager.getDiagnostics(),
      scene: this.scene,
      started: this.started,
      paused: this.paused,
      deadlineLevel: this.deadlineLevel,
      lastError: this.lastError,
    };
  }

  async dispose() {
    if (this.gestureInstalled) {
      this.document?.removeEventListener?.('pointerdown', this.gestureHandler, { capture: true });
      this.document?.removeEventListener?.('keydown', this.gestureHandler, { capture: true });
      this.gestureInstalled = false;
    }
    await this.manager.dispose();
  }

  #effect(name, detail = {}) {
    const id = GAME_AUDIO_EVENT_EFFECTS[name];
    if (!id) throw new RangeError(`Unknown game audio event: ${name}`);
    return this.manager.playEffect(id, {
      gain: detail.gain ?? 1,
      delaySeconds: detail.delaySeconds ?? 0,
    });
  }

  #applyScene() {
    if (!this.manager.unlocked) return;
    if (this.scene === 'title') {
      this.manager.stopAllTracks({ fadeSeconds: 0.8 });
      return;
    }
    if (this.scene === 'exploration') {
      this.manager.stopTrack('companion-ambience', { fadeSeconds: 1.25 });
      this.manager.playTrack('cozy-exploration', { fadeSeconds: 1.4, level: 0.9 });
      this.#syncDeadlineLayer();
      return;
    }
    if (this.scene === 'office') {
      this.manager.stopTrack('companion-ambience', { fadeSeconds: 1.1 });
      this.manager.stopTrack('pressure-layer', { fadeSeconds: 0.8 });
      this.manager.playTrack('bureaucracy-office', { fadeSeconds: 1.35, level: 0.84 });
      return;
    }
    if (this.scene === 'companion') {
      this.manager.stopTrack('music-main', { fadeSeconds: 1.35 });
      this.manager.stopTrack('pressure-layer', { fadeSeconds: 0.8 });
      this.manager.playTrack('companion-calm', { fadeSeconds: 1.4, level: 0.82 });
      return;
    }
    this.manager.stopAllTracks({ fadeSeconds: 1.6 });
  }

  #syncDeadlineLayer() {
    if (!this.manager.unlocked) return;
    if (this.scene !== 'exploration' || this.deadlineLevel === 0) {
      this.manager.stopTrack('pressure-layer', { fadeSeconds: 0.9 });
      return;
    }
    this.manager.playTrack('deadline-pressure', {
      fadeSeconds: 1.2,
      level: this.deadlineLevel,
    });
  }

  #handleError(error) {
    this.lastError = error?.message || String(error);
    console.warn('Kafkaland audio:', error);
    this.#notify();
  }

  #notify() {
    const snapshot = this.getDiagnostics();
    for (const listener of this.listeners) listener(snapshot);
  }
}

function safeLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
