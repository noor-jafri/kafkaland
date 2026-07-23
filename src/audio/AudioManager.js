import {
  AUDIO_CHANNELS,
  AUDIO_OUTPUT_CHANNELS,
  DUCKING_PROFILES,
  channelGain,
  clamp,
  combineDucking,
  createTriggerState,
  evaluateTrigger,
  readAudioPreferences,
  sanitizeAudioPreferences,
  serializeAudioPreferences,
  writeAudioPreferences,
} from './core.js';
import {
  buildEffectEvent,
  effectTriggerLimits,
  footstepEffectId,
  getEffectRecipe,
} from './effects.js';
import { renderEffectEvent, renderTrackEvent } from './synth.js';
import { getTrackDefinition, scheduleTrackWindow } from './tracks.js';

const GLOBAL_EFFECT_LIMITS = Object.freeze({
  cooldownMs: 0,
  maxPolyphony: 24,
});

/**
 * Central dependency-free Web Audio controller.
 *
 * Construction is side-effect-light: it never creates an AudioContext or reads
 * localStorage. Call `unlock()` directly from a click/key handler, then use
 * `playTrack()` and `playEffect()`. Track sequencing runs on an internal
 * look-ahead timer; gameplay does not need to call `update()`, though tests or
 * custom loops may call it safely.
 */
export class AudioManager {
  /**
   * @param {object} [options]
   * @param {object} [options.preferences] Initial preference-shaped object.
   * @param {() => AudioContext} [options.contextFactory] Injectable for tests.
   * @param {Document|null} [options.documentRef] Visibility source, or null.
   * @param {(error: unknown) => void} [options.onError] Async scheduler handler.
   * @param {number} [options.lookAheadSeconds=0.3] Web Audio schedule horizon.
   * @param {number} [options.schedulerIntervalMs=75] Sequencer timer period.
   */
  constructor(options = {}) {
    this._preferences = sanitizeAudioPreferences(options.preferences);
    this._contextFactory = options.contextFactory || defaultContextFactory;
    this._document = options.documentRef === undefined ? globalThis.document : options.documentRef;
    this._onError = options.onError || ((error) => console.warn('Kafkaland audio:', error));
    this._lookAheadSeconds = clamp(options.lookAheadSeconds ?? 0.3, 0.08, 1);
    this._schedulerIntervalMs = clamp(options.schedulerIntervalMs ?? 75, 20, 500);
    this._setInterval = options.setIntervalFn || globalThis.setInterval.bind(globalThis);
    this._clearInterval = options.clearIntervalFn || globalThis.clearInterval.bind(globalThis);

    this._context = null;
    this._unlockTask = null;
    this._masterBus = null;
    this._channelBuses = {};
    this._unlocked = false;
    this._disposed = false;
    this._timer = null;
    this._sessions = new Set();
    this._activeSlots = new Map();
    this._ducks = new Map();
    this._effectStates = new Map();
    this._effectTriggerCounts = new Map();
    this._globalEffectState = createTriggerState();
    this._visibilityDesiredHidden = Boolean(this._document?.hidden);
    this._hiddenSuspended = false;
    this._visibilityTask = Promise.resolve();

    this._visibilityHandler = () => {
      this.handleVisibilityChange(Boolean(this._document?.hidden)).catch(this._onError);
    };
    this._document?.addEventListener?.('visibilitychange', this._visibilityHandler);
  }

  /** True only after the explicit unlock operation has succeeded. */
  get unlocked() {
    return this._unlocked;
  }

  /** Current AudioContext state, or `locked` before explicit unlock. */
  get state() {
    return this._context?.state || 'locked';
  }

  /** Return a fresh preference snapshot that callers may safely mutate. */
  getPreferences() {
    return sanitizeAudioPreferences(this._preferences);
  }

  /** Stable serialized preference payload suitable for localStorage. */
  serializePreferences() {
    return serializeAudioPreferences(this._preferences);
  }

  /** Replace state from a localStorage-compatible object and apply smooth gains. */
  restorePreferences(storage = safeLocalStorage(), { fadeSeconds = 0.08 } = {}) {
    this._preferences = readAudioPreferences(storage);
    this._refreshBusGains(fadeSeconds);
    return this.getPreferences();
  }

  /** Persist state to a localStorage-compatible object. Never throws. */
  persistPreferences(storage = safeLocalStorage()) {
    return writeAudioPreferences(storage, this._preferences);
  }

  /**
   * Create/resume Web Audio after a user gesture. No playback API implicitly
   * calls this method, which keeps autoplay behavior predictable.
   */
  async unlock() {
    this._assertUsable();
    if (this._unlockTask) return this._unlockTask;

    const operation = (async () => {
      if (!this._context) {
        this._context = await this._contextFactory();
        if (!this._context) throw new Error('Audio context factory returned no context');
        this._createBusGraph();
      }
      if (this._context.state === 'suspended') await this._context.resume();
      this._unlocked = true;
      this._refreshBusGains(0);
      this._ensureScheduler();

      if (this._visibilityDesiredHidden && this._context.state === 'running') {
        await this._context.suspend();
        this._hiddenSuspended = true;
      } else {
        this.update();
      }
      return true;
    })();
    this._unlockTask = operation;
    try {
      return await operation;
    } finally {
      if (this._unlockTask === operation) this._unlockTask = null;
    }
  }

  /** Set a master/music/ambience/effects volume in the inclusive 0..1 range. */
  setVolume(channel, value, { fadeSeconds = 0.08 } = {}) {
    this._assertChannel(channel);
    this._preferences.volumes[channel] = clamp(value);
    this._refreshBusGains(fadeSeconds);
    return this._preferences.volumes[channel];
  }

  /** Globally mute/unmute while retaining all volume sliders. */
  setMuted(muted, { fadeSeconds = 0.08 } = {}) {
    this._preferences.muted = Boolean(muted);
    this._refreshBusGains(fadeSeconds);
    return this._preferences.muted;
  }

  /** Mute one output bus. Passing `master` delegates to global mute. */
  setChannelMuted(channel, muted, { fadeSeconds = 0.08 } = {}) {
    this._assertChannel(channel);
    if (channel === 'master') return this.setMuted(muted, { fadeSeconds });
    this._preferences.channelMutes[channel] = Boolean(muted);
    this._refreshBusGains(fadeSeconds);
    return this._preferences.channelMutes[channel];
  }

  /**
   * Enable/disable a ducking reason. `profile` may be `dialogue`, `companion`,
   * or a custom factor object. Reasons compose safely using the quietest factor.
   */
  setDucking(reason, active, profile = reason, options = {}) {
    const key = String(reason || 'dialogue');
    const previous = this._ducks.get(key);
    const resolved = typeof profile === 'string' ? DUCKING_PROFILES[profile] : profile;
    if (active && !resolved) throw new RangeError(`Unknown ducking profile: ${profile}`);

    if (active) this._ducks.set(key, resolved);
    else this._ducks.delete(key);

    const automaticDuration = active
      ? resolved?.attackSeconds
      : previous?.releaseSeconds;
    const fadeSeconds = options.fadeSeconds ?? automaticDuration ?? 0.2;
    this._refreshBusGains(fadeSeconds);
    return this.getDuckingFactors();
  }

  /** Convenience hook for opening/closing game dialogue. */
  setDialogueActive(active, options) {
    return this.setDucking('dialogue', active, 'dialogue', options);
  }

  /** Convenience hook for companion listening/thinking/speaking phases. */
  setCompanionActive(active, options) {
    return this.setDucking('companion', active, 'companion', options);
  }

  /** Current composed duck factors, useful for UI/debugging. */
  getDuckingFactors() {
    return combineDucking(this._ducks);
  }

  /**
   * Start/crossfade a procedural track. Tracks only replace the active track in
   * their declared slot; `deadline-pressure` therefore layers independently.
   * @returns {{played: boolean, reason?: string, id: string, slot?: string}}
   */
  playTrack(id, { fadeSeconds = 1.2, level = 1 } = {}) {
    const definition = getTrackDefinition(id);
    if (!this._canPlay()) return { played: false, reason: 'locked', id: definition.id };

    const targetLevel = clamp(level);
    const current = this._activeSlots.get(definition.slot);
    if (current?.definition.id === definition.id && current.stopAt == null) {
      this.setTrackLevel(definition.slot, targetLevel, { fadeSeconds });
      return { played: true, reason: 'already-playing', id: definition.id, slot: definition.slot };
    }

    const now = this._context.currentTime;
    const duration = clamp(fadeSeconds, 0, 30);
    const gainNode = this._context.createGain();
    gainNode.gain.setValueAtTime(duration > 0 ? 0 : targetLevel, now);
    gainNode.connect(this._channelBuses[definition.channel]);
    const session = {
      definition,
      gainNode,
      level: targetLevel,
      originTime: now + 0.035,
      cursorSeconds: 0,
      stopAt: null,
    };
    this._sessions.add(session);
    this._activeSlots.set(definition.slot, session);

    if (current) this._beginTrackStop(current, now, duration);
    this._rampParam(gainNode.gain, targetLevel, duration);
    this.update();
    return { played: true, id: definition.id, slot: definition.slot };
  }

  /**
   * Fade a track by slot (`music-main`) or public track ID. Returns false when
   * nothing matching is active.
   */
  stopTrack(slotOrId, { fadeSeconds = 0.8 } = {}) {
    if (!this._context) return false;
    const session = this._activeSlots.get(slotOrId)
      || [...this._activeSlots.values()].find((candidate) => candidate.definition.id === slotOrId);
    if (!session) return false;
    this._beginTrackStop(session, this._context.currentTime, clamp(fadeSeconds, 0, 30));
    if (this._activeSlots.get(session.definition.slot) === session) {
      this._activeSlots.delete(session.definition.slot);
    }
    return true;
  }

  /** Fade every active procedural track. */
  stopAllTracks(options) {
    const slots = [...this._activeSlots.keys()];
    for (const slot of slots) this.stopTrack(slot, options);
  }

  /** Smoothly set one active track/slot level without restarting its loop. */
  setTrackLevel(slotOrId, level, { fadeSeconds = 0.6 } = {}) {
    if (!this._context) return false;
    const session = this._activeSlots.get(slotOrId)
      || [...this._activeSlots.values()].find((candidate) => candidate.definition.id === slotOrId);
    if (!session || session.stopAt != null) return false;
    session.level = clamp(level);
    this._rampParam(session.gainNode.gain, session.level, fadeSeconds);
    return true;
  }

  /** Public ID of the active track in a slot, or null. */
  getActiveTrack(slot) {
    return this._activeSlots.get(slot)?.definition.id || null;
  }

  /** Current target gain of an active track/slot, or null. */
  getTrackLevel(slotOrId) {
    const session = this._activeSlots.get(slotOrId)
      || [...this._activeSlots.values()].find((candidate) => candidate.definition.id === slotOrId);
    return session?.level ?? null;
  }

  /** Serializable runtime state for settings UI, browser checks, and support. */
  getDiagnostics() {
    return {
      unlocked: this.unlocked,
      state: this.state,
      preferences: this.getPreferences(),
      ducking: this.getDuckingFactors(),
      activeTracks: Object.fromEntries(
        [...this._activeSlots.entries()].map(([slot, session]) => [slot, {
          id: session.definition.id,
          level: session.level,
        }])
      ),
      activeSessionCount: this._sessions.size,
    };
  }

  /**
   * Trigger a bounded procedural effect. Calls made before unlock are ignored,
   * and cooldown/polyphony rejections return a machine-readable reason.
   */
  playEffect(id, { gain = 1, delaySeconds = 0 } = {}) {
    const effect = getEffectRecipe(id);
    if (!this._canPlay()) return { played: false, reason: 'locked', id };
    if (this._context.state !== 'running') return { played: false, reason: 'suspended', id };

    const now = this._context.currentTime;
    const nowMs = now * 1000;
    const localState = this._effectStates.get(id) || createTriggerState();
    const localDecision = evaluateTrigger(localState, effectTriggerLimits(id), nowMs);
    if (!localDecision.accepted) return { played: false, reason: localDecision.reason, id };

    const globalDecision = evaluateTrigger(this._globalEffectState, {
      ...GLOBAL_EFFECT_LIMITS,
      durationMs: effect.durationSeconds * 1000,
    }, nowMs);
    if (!globalDecision.accepted) return { played: false, reason: globalDecision.reason, id };

    this._effectStates.set(id, localDecision.state);
    this._globalEffectState = globalDecision.state;
    const triggerIndex = this._effectTriggerCounts.get(id) || 0;
    this._effectTriggerCounts.set(id, triggerIndex + 1);
    const startTime = now + clamp(delaySeconds, 0, 10);
    const event = buildEffectEvent(id, triggerIndex, startTime);
    renderEffectEvent(this._context, event, this._channelBuses[effect.channel], clamp(gain));
    return { played: true, id, durationSeconds: event.durationSeconds };
  }

  /** Surface-safe footstep helper. Unknown surfaces deliberately use grass. */
  playFootstep(surface, options) {
    return this.playEffect(footstepEffectId(surface), options);
  }

  /**
   * Schedule the current track look-ahead window. Usually called internally;
   * exposed for deterministic host loops and diagnostics.
   * @returns {number} Number of musical events sent to Web Audio.
   */
  update() {
    if (!this._canPlay() || this._context.state !== 'running') return 0;
    const now = this._context.currentTime;
    let rendered = 0;

    for (const session of [...this._sessions]) {
      if (session.stopAt != null && now >= session.stopAt) {
        this._removeSession(session);
        continue;
      }
      const horizon = Math.min(
        now + this._lookAheadSeconds,
        session.stopAt ?? Number.POSITIVE_INFINITY
      );
      const localNow = Math.max(0, now - session.originTime);
      const start = Math.max(session.cursorSeconds, localNow - 0.02);
      const end = Math.max(start, horizon - session.originTime);
      if (end <= start) continue;

      const events = scheduleTrackWindow(session.definition, start, end);
      for (const event of events) {
        renderTrackEvent(this._context, event, session.gainNode, session.originTime);
      }
      rendered += events.length;
      session.cursorSeconds = end;
    }
    return rendered;
  }

  /**
   * Suspend on hidden tabs and resume only contexts previously unlocked by the
   * player. Public for hosts without a real Document and for deterministic tests.
   */
  handleVisibilityChange(hidden = Boolean(this._document?.hidden)) {
    this._visibilityDesiredHidden = Boolean(hidden);
    this._visibilityTask = this._visibilityTask.catch(() => {}).then(async () => {
      if (!this._context || !this._unlocked) return this.state;
      if (this._visibilityDesiredHidden) {
        if (this._context.state === 'running') await this._context.suspend();
        this._hiddenSuspended = true;
      } else if (this._hiddenSuspended) {
        if (this._context.state === 'suspended') await this._context.resume();
        this._hiddenSuspended = false;
        this.update();
      }
      return this.state;
    });
    return this._visibilityTask;
  }

  /** Remove listeners/timers and close the owned AudioContext. */
  async dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._unlocked = false;
    if (this._timer != null) this._clearInterval(this._timer);
    this._timer = null;
    this._document?.removeEventListener?.('visibilitychange', this._visibilityHandler);
    for (const session of [...this._sessions]) this._removeSession(session);
    this._activeSlots.clear();
    await this._visibilityTask.catch(this._onError);
    if (this._context && this._context.state !== 'closed') await this._context.close();
  }

  _createBusGraph() {
    this._masterBus = this._context.createGain();
    this._masterBus.connect(this._context.destination);
    for (const channel of AUDIO_OUTPUT_CHANNELS) {
      const bus = this._context.createGain();
      bus.connect(this._masterBus);
      this._channelBuses[channel] = bus;
    }
  }

  _refreshBusGains(fadeSeconds) {
    if (!this._context || !this._masterBus) return;
    const duckFactors = this.getDuckingFactors();
    this._rampParam(
      this._masterBus.gain,
      channelGain(this._preferences, 'master', duckFactors),
      fadeSeconds
    );
    for (const channel of AUDIO_OUTPUT_CHANNELS) {
      this._rampParam(
        this._channelBuses[channel].gain,
        channelGain(this._preferences, channel, duckFactors),
        fadeSeconds
      );
    }
  }

  _rampParam(param, target, durationSeconds) {
    const now = this._context.currentTime;
    const duration = clamp(durationSeconds, 0, 30);
    if (typeof param.cancelAndHoldAtTime === 'function') {
      param.cancelAndHoldAtTime(now);
    } else {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
    }
    if (duration === 0) param.setValueAtTime(target, now);
    else param.linearRampToValueAtTime(target, now + duration);
  }

  _beginTrackStop(session, now, fadeSeconds) {
    if (session.stopAt != null && session.stopAt <= now + fadeSeconds) return;
    session.level = 0;
    session.stopAt = now + fadeSeconds;
    this._rampParam(session.gainNode.gain, 0, fadeSeconds);
    if (fadeSeconds === 0) this._removeSession(session);
  }

  _removeSession(session) {
    this._sessions.delete(session);
    if (this._activeSlots.get(session.definition.slot) === session) {
      this._activeSlots.delete(session.definition.slot);
    }
    session.gainNode.disconnect();
  }

  _ensureScheduler() {
    if (this._timer != null) return;
    this._timer = this._setInterval(() => {
      try {
        this.update();
      } catch (error) {
        this._onError(error);
      }
    }, this._schedulerIntervalMs);
    this._timer?.unref?.();
  }

  _canPlay() {
    return !this._disposed && this._unlocked && Boolean(this._context);
  }

  _assertUsable() {
    if (this._disposed) throw new Error('AudioManager has been disposed');
  }

  _assertChannel(channel) {
    if (!AUDIO_CHANNELS.includes(channel)) throw new RangeError(`Unknown audio channel: ${channel}`);
  }
}

function defaultContextFactory() {
  const AudioContextConstructor = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextConstructor) throw new Error('Web Audio API is unavailable in this environment');
  return new AudioContextConstructor();
}

function safeLocalStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
