import { clamp } from './core.js';

const tone = (delaySeconds, durationSeconds, frequency, gain, options = {}) => ({
  kind: 'tone', delaySeconds, durationSeconds, frequency, gain, ...options,
});
const noise = (delaySeconds, durationSeconds, gain, options = {}) => ({
  kind: 'noise', delaySeconds, durationSeconds, gain, ...options,
});

function recipe({ channel = 'effects', cooldownMs, maxPolyphony, variations, pitchJitterCents = 0 }) {
  const durationSeconds = Math.max(...variations.flat().map(
    (layer) => layer.delaySeconds + layer.durationSeconds
  ));
  if (durationSeconds > 2.25) throw new RangeError('Procedural effects must remain short');
  return { channel, cooldownMs, maxPolyphony, durationSeconds, pitchJitterCents, variations };
}

/**
 * Short, low-gain procedural effect recipes. The keys are the public IDs used
 * by `AudioManager.playEffect(id)`. Variations rotate deterministically rather
 * than relying on runtime randomness.
 */
export const EFFECT_RECIPES = deepFreeze({
  'footstep-grass': recipe({
    cooldownMs: 90, maxPolyphony: 3, pitchJitterCents: 45,
    variations: [
      [noise(0, 0.13, 0.11, { filterType: 'lowpass', filterFrequency: 720 }), tone(0.015, 0.1, 92, 0.055, { waveform: 'sine' })],
      [noise(0, 0.15, 0.1, { filterType: 'lowpass', filterFrequency: 610 }), tone(0.02, 0.09, 84, 0.05, { waveform: 'sine' })],
    ],
  }),
  'footstep-path': recipe({
    cooldownMs: 90, maxPolyphony: 3, pitchJitterCents: 55,
    variations: [
      [noise(0, 0.09, 0.105, { filterType: 'bandpass', filterFrequency: 1450, q: 0.7 }), noise(0.055, 0.08, 0.06, { filterType: 'highpass', filterFrequency: 1900 })],
      [noise(0, 0.11, 0.1, { filterType: 'bandpass', filterFrequency: 1220, q: 0.8 }), noise(0.065, 0.07, 0.055, { filterType: 'highpass', filterFrequency: 2200 })],
    ],
  }),
  'footstep-wood': recipe({
    cooldownMs: 95, maxPolyphony: 3, pitchJitterCents: 35,
    variations: [
      [tone(0, 0.13, 148, 0.09, { waveform: 'triangle', endFrequency: 112 }), noise(0, 0.06, 0.045, { filterType: 'lowpass', filterFrequency: 1300 })],
      [tone(0, 0.14, 132, 0.085, { waveform: 'triangle', endFrequency: 101 }), noise(0, 0.055, 0.04, { filterType: 'lowpass', filterFrequency: 1150 })],
    ],
  }),
  'footstep-tile': recipe({
    cooldownMs: 95, maxPolyphony: 3, pitchJitterCents: 40,
    variations: [
      [tone(0, 0.1, 410, 0.065, { waveform: 'sine', endFrequency: 300 }), noise(0, 0.035, 0.04, { filterType: 'highpass', filterFrequency: 2200 })],
      [tone(0, 0.11, 360, 0.06, { waveform: 'sine', endFrequency: 270 }), noise(0, 0.04, 0.038, { filterType: 'highpass', filterFrequency: 2000 })],
    ],
  }),
  'paper-rustle': recipe({
    cooldownMs: 120, maxPolyphony: 2,
    variations: [
      [noise(0, 0.34, 0.09, { filterType: 'bandpass', filterFrequency: 1900, q: 0.65 }), noise(0.13, 0.25, 0.055, { filterType: 'highpass', filterFrequency: 2600 })],
      [noise(0, 0.3, 0.085, { filterType: 'bandpass', filterFrequency: 1650, q: 0.7 }), noise(0.1, 0.3, 0.05, { filterType: 'highpass', filterFrequency: 2350 })],
    ],
  }),
  'rubber-stamp': recipe({
    cooldownMs: 180, maxPolyphony: 2, pitchJitterCents: 20,
    variations: [[
      tone(0, 0.18, 105, 0.14, { waveform: 'triangle', endFrequency: 62 }),
      noise(0, 0.055, 0.08, { filterType: 'lowpass', filterFrequency: 950 }),
      tone(0.12, 0.1, 185, 0.045, { waveform: 'sine', endFrequency: 150 }),
    ]],
  }),
  'typewriter-tick': recipe({
    cooldownMs: 28, maxPolyphony: 4, pitchJitterCents: 70,
    variations: [
      [tone(0, 0.045, 980, 0.037, { waveform: 'triangle', endFrequency: 650 }), noise(0, 0.028, 0.025, { filterType: 'highpass', filterFrequency: 3000 })],
      [tone(0, 0.05, 820, 0.034, { waveform: 'triangle', endFrequency: 580 }), noise(0, 0.025, 0.023, { filterType: 'highpass', filterFrequency: 2700 })],
    ],
  }),
  interaction: recipe({
    cooldownMs: 55, maxPolyphony: 3,
    variations: [[tone(0, 0.1, 440, 0.045, { waveform: 'sine', endFrequency: 520 })]],
  }),
  'ui-move': recipe({
    cooldownMs: 35, maxPolyphony: 3,
    variations: [[tone(0, 0.055, 620, 0.028, { waveform: 'sine', endFrequency: 680 })]],
  }),
  'ui-confirm': recipe({
    cooldownMs: 80, maxPolyphony: 3,
    variations: [[tone(0, 0.13, 520, 0.045, { waveform: 'sine' }), tone(0.065, 0.14, 700, 0.04, { waveform: 'sine' })]],
  }),
  'ui-cancel': recipe({
    cooldownMs: 80, maxPolyphony: 3,
    variations: [[tone(0, 0.14, 430, 0.04, { waveform: 'triangle', endFrequency: 330 })]],
  }),
  'quest-unlock': recipe({
    cooldownMs: 500, maxPolyphony: 2,
    variations: [[
      tone(0, 0.38, 392, 0.06, { waveform: 'sine' }),
      tone(0.18, 0.42, 523.25, 0.058, { waveform: 'sine' }),
      tone(0.38, 0.52, 659.25, 0.052, { waveform: 'sine' }),
    ]],
  }),
  locked: recipe({
    cooldownMs: 180, maxPolyphony: 2,
    variations: [[tone(0, 0.14, 185, 0.07, { waveform: 'triangle', endFrequency: 155 }), tone(0.14, 0.13, 165, 0.055, { waveform: 'triangle' })]],
  }),
  'missing-document': recipe({
    cooldownMs: 300, maxPolyphony: 2,
    variations: [[
      noise(0, 0.24, 0.045, { filterType: 'bandpass', filterFrequency: 1450, q: 0.8 }),
      tone(0.04, 0.22, 330, 0.055, { waveform: 'sine', endFrequency: 260 }),
      tone(0.22, 0.24, 247, 0.05, { waveform: 'sine', endFrequency: 210 }),
    ]],
  }),
  'door-open': recipe({
    cooldownMs: 350, maxPolyphony: 2, pitchJitterCents: 18,
    variations: [[
      noise(0, 0.52, 0.052, { filterType: 'bandpass', filterFrequency: 780, q: 1.2 }),
      tone(0.05, 0.56, 126, 0.052, { waveform: 'triangle', endFrequency: 205 }),
    ]],
  }),
  'door-close': recipe({
    cooldownMs: 260, maxPolyphony: 2, pitchJitterCents: 18,
    variations: [[
      noise(0, 0.12, 0.075, { filterType: 'lowpass', filterFrequency: 1100 }),
      tone(0, 0.3, 112, 0.09, { waveform: 'triangle', endFrequency: 70 }),
    ]],
  }),
  mailbox: recipe({
    cooldownMs: 260, maxPolyphony: 2, pitchJitterCents: 35,
    variations: [[
      tone(0, 0.18, 360, 0.055, { waveform: 'triangle', endFrequency: 290 }),
      noise(0.02, 0.1, 0.06, { filterType: 'highpass', filterFrequency: 1800 }),
      tone(0.19, 0.17, 520, 0.035, { waveform: 'sine', endFrequency: 440 }),
    ]],
  }),
  slime: recipe({
    cooldownMs: 130, maxPolyphony: 3, pitchJitterCents: 75,
    variations: [
      [tone(0, 0.25, 145, 0.075, { waveform: 'sine', endFrequency: 235 }), noise(0, 0.1, 0.035, { filterType: 'lowpass', filterFrequency: 650 })],
      [tone(0, 0.27, 132, 0.07, { waveform: 'sine', endFrequency: 215 }), noise(0, 0.11, 0.032, { filterType: 'lowpass', filterFrequency: 590 })],
    ],
  }),
  frustration: recipe({
    cooldownMs: 450, maxPolyphony: 1,
    variations: [[
      tone(0, 0.48, 92, 0.065, { waveform: 'sawtooth', endFrequency: 72 }),
      noise(0.04, 0.42, 0.04, { filterType: 'lowpass', filterFrequency: 520 }),
    ]],
  }),
  'tree-vent': recipe({
    cooldownMs: 900, maxPolyphony: 1,
    variations: [[
      noise(0, 1.25, 0.055, { filterType: 'bandpass', filterFrequency: 880, endFilterFrequency: 360, q: 0.55 }),
      tone(0.12, 0.9, 180, 0.04, { waveform: 'sine', endFrequency: 110 }),
    ]],
  }),
  'companion-activation': recipe({
    cooldownMs: 500, maxPolyphony: 1,
    variations: [[
      tone(0, 0.42, 330, 0.05, { waveform: 'sine', endFrequency: 440 }),
      tone(0.18, 0.46, 495, 0.045, { waveform: 'sine', endFrequency: 660 }),
      noise(0, 0.56, 0.025, { filterType: 'highpass', filterFrequency: 3200 }),
    ]],
  }),
  'companion-thinking': recipe({
    cooldownMs: 260, maxPolyphony: 2,
    variations: [
      [tone(0, 0.2, 587.33, 0.032, { waveform: 'sine' }), tone(0.15, 0.18, 698.46, 0.025, { waveform: 'sine' })],
      [tone(0, 0.2, 523.25, 0.03, { waveform: 'sine' }), tone(0.15, 0.18, 659.25, 0.025, { waveform: 'sine' })],
    ],
  }),
  'companion-answer': recipe({
    cooldownMs: 260, maxPolyphony: 2,
    variations: [[
      tone(0, 0.3, 440, 0.04, { waveform: 'sine' }),
      tone(0.16, 0.38, 554.37, 0.042, { waveform: 'sine' }),
      tone(0.3, 0.32, 659.25, 0.035, { waveform: 'sine' }),
    ]],
  }),
  'companion-error': recipe({
    cooldownMs: 350, maxPolyphony: 1,
    variations: [[
      tone(0, 0.18, 310, 0.045, { waveform: 'triangle', endFrequency: 280 }),
      tone(0.19, 0.2, 233, 0.04, { waveform: 'triangle', endFrequency: 210 }),
    ]],
  }),
  'environment-breeze': recipe({
    channel: 'ambience', cooldownMs: 1500, maxPolyphony: 1,
    variations: [[noise(0, 1.8, 0.025, { filterType: 'bandpass', filterFrequency: 520, endFilterFrequency: 760, q: 0.45 })]],
  }),
  'environment-bird': recipe({
    channel: 'ambience', cooldownMs: 1800, maxPolyphony: 1, pitchJitterCents: 60,
    variations: [
      [tone(0, 0.16, 1250, 0.018, { waveform: 'sine', endFrequency: 1520 }), tone(0.17, 0.2, 1390, 0.015, { waveform: 'sine', endFrequency: 1160 })],
      [tone(0, 0.18, 1120, 0.016, { waveform: 'sine', endFrequency: 1360 }), tone(0.2, 0.17, 1280, 0.014, { waveform: 'sine', endFrequency: 1040 })],
    ],
  }),
  'environment-room': recipe({
    channel: 'ambience', cooldownMs: 1300, maxPolyphony: 1,
    variations: [[
      noise(0, 1.5, 0.018, { filterType: 'lowpass', filterFrequency: 300 }),
      tone(0, 1.5, 58, 0.012, { waveform: 'sine' }),
    ]],
  }),
});

export const EFFECT_IDS = Object.freeze(Object.keys(EFFECT_RECIPES));
export const FOOTSTEP_SURFACES = Object.freeze(['grass', 'path', 'wood', 'tile']);

/** Map a world surface to a public footstep effect ID, defaulting to grass. */
export function footstepEffectId(surface) {
  const normalized = String(surface || '').toLowerCase();
  return `footstep-${FOOTSTEP_SURFACES.includes(normalized) ? normalized : 'grass'}`;
}

/** Return a frozen effect recipe, throwing early for integration typos. */
export function getEffectRecipe(id) {
  const effect = Object.hasOwn(EFFECT_RECIPES, id) && EFFECT_RECIPES[id];
  if (!effect) throw new RangeError(`Unknown procedural effect: ${id}`);
  return effect;
}

/** Cooldown/polyphony limits in the format consumed by evaluateTrigger. */
export function effectTriggerLimits(id) {
  const recipe = getEffectRecipe(id);
  return {
    cooldownMs: recipe.cooldownMs,
    maxPolyphony: recipe.maxPolyphony,
    durationMs: recipe.durationSeconds * 1000,
  };
}

/**
 * Build one deterministic effect event. `triggerIndex` rotates variations and
 * stable micro-pitch changes, while `startTimeSeconds` is supplied by the audio
 * clock. This function creates no audio nodes.
 */
export function buildEffectEvent(id, triggerIndex = 0, startTimeSeconds = 0) {
  const effect = getEffectRecipe(id);
  const numericIndex = Number(triggerIndex);
  const index = Number.isFinite(numericIndex) ? Math.max(0, Math.floor(numericIndex)) : 0;
  const variationIndex = index % effect.variations.length;
  const pitchScale = 2 ** (
    (stableSignedUnit(`${id}:${index}`) * effect.pitchJitterCents) / 1200
  );
  const numericStart = Number(startTimeSeconds);
  const start = Number.isFinite(numericStart) ? Math.max(0, numericStart) : 0;
  const layers = effect.variations[variationIndex].map((layer, layerIndex) => ({
    ...layer,
    id: `${id}:${index}:${layerIndex}`,
    startTime: start + layer.delaySeconds,
    gain: clamp(layer.gain, 0, 0.2),
    ...(layer.frequency ? { frequency: layer.frequency * pitchScale } : {}),
    ...(layer.endFrequency ? { endFrequency: layer.endFrequency * pitchScale } : {}),
  }));

  return {
    id,
    channel: effect.channel,
    triggerIndex: index,
    variationIndex,
    startTime: start,
    durationSeconds: effect.durationSeconds,
    layers,
  };
}

function stableSignedUnit(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) / 0xffffffff) * 2 - 1;
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
