/**
 * Pure state and scheduling primitives for Kafkaland audio.
 *
 * This module deliberately has no browser globals. It is safe to import from
 * Node tests, workers, and future non-Web-Audio integrations.
 */

export const AUDIO_PREFERENCE_VERSION = 1;
export const AUDIO_PREFERENCE_KEY = 'kafkaland.audio.v1';
export const AUDIO_CHANNELS = Object.freeze(['master', 'music', 'ambience', 'effects']);
export const AUDIO_OUTPUT_CHANNELS = Object.freeze(['music', 'ambience', 'effects']);

export const DEFAULT_AUDIO_PREFERENCES = deepFreeze({
  version: AUDIO_PREFERENCE_VERSION,
  muted: false,
  volumes: {
    master: 0.8,
    music: 0.65,
    ambience: 0.55,
    effects: 0.8,
  },
  channelMutes: {
    music: false,
    ambience: false,
    effects: false,
  },
});

/**
 * Conservative ducking presets. A reason can also supply the same shape as a
 * custom profile. Multiple active profiles use the lowest factor per channel.
 */
export const DUCKING_PROFILES = deepFreeze({
  dialogue: {
    // 0.45 is about -6.9 dB, leaving speech clear without making the world vanish.
    music: 0.45,
    ambience: 0.66,
    effects: 0.82,
    attackSeconds: 0.12,
    releaseSeconds: 0.45,
  },
  companion: {
    // 0.4 is about -8 dB for the wider response/listening pocket.
    music: 0.4,
    ambience: 0.56,
    effects: 0.76,
    attackSeconds: 0.1,
    releaseSeconds: 0.55,
  },
});

/** Clamp a finite number, using min when the input is not finite. */
export function clamp(value, min = 0, max = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

/** Return a fresh, validated preference object. Unknown fields are discarded. */
export function sanitizeAudioPreferences(value, fallback = DEFAULT_AUDIO_PREFERENCES) {
  const source = value && typeof value === 'object' ? value : {};
  const sourceVolumes = source.volumes && typeof source.volumes === 'object' ? source.volumes : {};
  const sourceMutes = source.channelMutes && typeof source.channelMutes === 'object'
    ? source.channelMutes
    : {};
  const fallbackVolumes = fallback.volumes || DEFAULT_AUDIO_PREFERENCES.volumes;
  const fallbackMutes = fallback.channelMutes || DEFAULT_AUDIO_PREFERENCES.channelMutes;

  const volumes = {};
  for (const channel of AUDIO_CHANNELS) {
    const candidate = sourceVolumes[channel];
    volumes[channel] = typeof candidate === 'number' && Number.isFinite(candidate)
      ? clamp(candidate)
      : clamp(fallbackVolumes[channel]);
  }

  const channelMutes = {};
  for (const channel of AUDIO_OUTPUT_CHANNELS) {
    channelMutes[channel] = typeof sourceMutes[channel] === 'boolean'
      ? sourceMutes[channel]
      : Boolean(fallbackMutes[channel]);
  }

  return {
    version: AUDIO_PREFERENCE_VERSION,
    muted: typeof source.muted === 'boolean' ? source.muted : Boolean(fallback.muted),
    volumes,
    channelMutes,
  };
}

/** Parse serialized preferences, returning a fresh fallback on malformed input. */
export function parseAudioPreferences(serialized, fallback = DEFAULT_AUDIO_PREFERENCES) {
  if (typeof serialized !== 'string' || serialized.trim() === '') {
    return sanitizeAudioPreferences(fallback);
  }

  try {
    const parsed = JSON.parse(serialized);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return sanitizeAudioPreferences(fallback);
    }
    return sanitizeAudioPreferences(parsed, fallback);
  } catch {
    return sanitizeAudioPreferences(fallback);
  }
}

/** Serialize only the stable, validated preference schema. */
export function serializeAudioPreferences(preferences) {
  return JSON.stringify(sanitizeAudioPreferences(preferences));
}

/**
 * Read preferences from a localStorage-compatible object without allowing
 * privacy/security storage errors to interrupt the game.
 */
export function readAudioPreferences(storage, key = AUDIO_PREFERENCE_KEY) {
  try {
    return parseAudioPreferences(storage?.getItem?.(key));
  } catch {
    return sanitizeAudioPreferences(DEFAULT_AUDIO_PREFERENCES);
  }
}

/**
 * Write preferences to a localStorage-compatible object. Returns false when
 * storage is unavailable or rejects the write.
 */
export function writeAudioPreferences(storage, preferences, key = AUDIO_PREFERENCE_KEY) {
  try {
    if (!storage?.setItem) return false;
    storage.setItem(key, serializeAudioPreferences(preferences));
    return true;
  } catch {
    return false;
  }
}

/** Resolve named/custom active duck profiles to one factor per output channel. */
export function combineDucking(activeProfiles = []) {
  const factors = { music: 1, ambience: 1, effects: 1 };
  const profiles = activeProfiles instanceof Map
    ? activeProfiles.values()
    : Array.isArray(activeProfiles)
      ? activeProfiles
      : Object.values(activeProfiles || {});

  for (const requested of profiles) {
    const profile = typeof requested === 'string' ? DUCKING_PROFILES[requested] : requested;
    if (!profile || typeof profile !== 'object') continue;
    for (const channel of AUDIO_OUTPUT_CHANNELS) {
      const candidate = Number(profile[channel]);
      if (Number.isFinite(candidate)) factors[channel] = Math.min(factors[channel], clamp(candidate));
    }
  }
  return factors;
}

/** Calculate the audible gain for one bus from preferences and duck factors. */
export function channelGain(preferences, channel, duckFactors = {}) {
  const safe = sanitizeAudioPreferences(preferences);
  if (!AUDIO_CHANNELS.includes(channel)) throw new RangeError(`Unknown audio channel: ${channel}`);
  if (safe.muted) return 0;
  if (channel === 'master') return safe.volumes.master;
  if (safe.channelMutes[channel]) return 0;
  return safe.volumes[channel] * clamp(duckFactors[channel] ?? 1);
}

/** Build a serializable smoothstep gain transition. */
export function createGainTransition(from, to, startSeconds, durationSeconds) {
  return {
    from: clamp(from),
    to: clamp(to),
    startSeconds: Math.max(0, Number(startSeconds) || 0),
    durationSeconds: Math.max(0, Number(durationSeconds) || 0),
  };
}

/** Sample a gain transition. Smoothstep avoids abrupt slope changes at its ends. */
export function sampleGainTransition(transition, atSeconds) {
  if (transition.durationSeconds === 0) return transition.to;
  const progress = clamp(
    (Number(atSeconds) - transition.startSeconds) / transition.durationSeconds
  );
  const smooth = progress * progress * (3 - 2 * progress);
  return transition.from + (transition.to - transition.from) * smooth;
}

/** Equal-power gains for a crossfade position in the inclusive range 0..1. */
export function crossfadeGains(position) {
  const angle = clamp(position) * Math.PI / 2;
  return {
    outgoing: Math.cos(angle),
    incoming: Math.sin(angle),
  };
}

/** Create empty immutable-by-convention state for evaluateTrigger. */
export function createTriggerState() {
  return { lastTriggeredAtMs: Number.NEGATIVE_INFINITY, activeUntilMs: [] };
}

/**
 * Pure cooldown/polyphony decision. Times and limits are milliseconds.
 * The returned state is always a new object, so callers may safely retain the
 * previous state for replay, tests, or deterministic simulation.
 */
export function evaluateTrigger(state, limits, nowMs) {
  const safeState = state || createTriggerState();
  const time = Number.isFinite(Number(nowMs)) ? Number(nowMs) : 0;
  const cooldownMs = Math.max(0, Number(limits?.cooldownMs) || 0);
  const durationMs = Math.max(0, Number(limits?.durationMs) || 0);
  const maxPolyphony = Math.max(1, Math.floor(Number(limits?.maxPolyphony) || 1));
  const numericLastTrigger = Number(safeState.lastTriggeredAtMs);
  const lastTriggeredAtMs = Number.isFinite(numericLastTrigger)
    ? numericLastTrigger
    : Number.NEGATIVE_INFINITY;
  const activeUntilMs = (Array.isArray(safeState.activeUntilMs) ? safeState.activeUntilMs : [])
    .map(Number)
    .filter((end) => Number.isFinite(end) && end > time);
  const nextBase = { lastTriggeredAtMs, activeUntilMs };

  if (time - lastTriggeredAtMs < cooldownMs) {
    return { accepted: false, reason: 'cooldown', state: nextBase };
  }
  if (activeUntilMs.length >= maxPolyphony) {
    return { accepted: false, reason: 'polyphony', state: nextBase };
  }

  return {
    accepted: true,
    reason: null,
    state: {
      lastTriggeredAtMs: time,
      activeUntilMs: [...activeUntilMs, time + durationMs].sort((a, b) => a - b),
    },
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
