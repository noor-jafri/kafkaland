/**
 * Small Web Audio renderers. Scheduling choices live in tracks.js/effects.js;
 * this module only translates already-decided events into short-lived nodes.
 */

const VOICES = Object.freeze({
  warmPad: { waveform: 'triangle', attackSeconds: 0.16, releaseSeconds: 0.7, filterFrequency: 1250 },
  feltPluck: { waveform: 'triangle', attackSeconds: 0.008, releaseSeconds: 0.42, filterFrequency: 1850 },
  roundBass: { waveform: 'sine', attackSeconds: 0.018, releaseSeconds: 0.35, filterFrequency: 700 },
  officePluck: { waveform: 'triangle', attackSeconds: 0.006, releaseSeconds: 0.36, filterFrequency: 1550 },
  paperPluck: { waveform: 'square', attackSeconds: 0.004, releaseSeconds: 0.18, filterFrequency: 1100, gainScale: 0.6 },
  officeBass: { waveform: 'sine', attackSeconds: 0.01, releaseSeconds: 0.24, filterFrequency: 650 },
  deskTick: { filterType: 'bandpass', filterFrequency: 2100, q: 1.1, attackSeconds: 0.002, releaseSeconds: 0.04 },
  deskTickSoft: { filterType: 'bandpass', filterFrequency: 1550, q: 0.9, attackSeconds: 0.002, releaseSeconds: 0.04 },
  glassPad: { waveform: 'sine', attackSeconds: 0.45, releaseSeconds: 1.2, filterFrequency: 1800 },
  companionGlow: { waveform: 'sine', attackSeconds: 0.08, releaseSeconds: 0.75, filterFrequency: 2400 },
  airWash: { filterType: 'bandpass', filterFrequency: 720, q: 0.45, attackSeconds: 0.5, releaseSeconds: 1.1, gainScale: 0.7 },
  deadlinePulse: { waveform: 'sine', attackSeconds: 0.012, releaseSeconds: 0.28, filterFrequency: 420 },
  clockBrush: { filterType: 'highpass', filterFrequency: 2400, attackSeconds: 0.002, releaseSeconds: 0.035, gainScale: 0.65 },
});

/** Render one event returned by scheduleTrackWindow. */
export function renderTrackEvent(context, event, destination, trackStartTime) {
  const voice = VOICES[event.voice] || {};
  const layer = {
    ...voice,
    ...event,
    id: event.id,
    startTime: trackStartTime + event.timeSeconds,
    gain: event.gain * (voice.gainScale ?? 1),
  };
  return layer.kind === 'noise'
    ? renderNoise(context, layer, destination)
    : renderTone(context, layer, destination);
}

/** Render one event returned by buildEffectEvent. */
export function renderEffectEvent(context, effectEvent, destination, gainScale = 1) {
  return effectEvent.layers.map((layer) => {
    const scaled = { ...layer, gain: layer.gain * Math.max(0, Math.min(1, gainScale)) };
    return scaled.kind === 'noise'
      ? renderNoise(context, scaled, destination)
      : renderTone(context, scaled, destination);
  });
}

function renderTone(context, layer, destination) {
  const startTime = Math.max(context.currentTime, layer.startTime);
  const duration = Math.max(0.025, layer.durationSeconds);
  const endTime = startTime + duration;
  const oscillator = context.createOscillator();
  oscillator.type = layer.waveform || 'sine';
  oscillator.frequency.setValueAtTime(Math.max(20, layer.frequency), startTime);
  if (layer.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, layer.endFrequency), endTime);
  }

  const envelope = context.createGain();
  applyEnvelope(envelope.gain, layer, startTime, endTime);
  const filter = createFilter(context, layer, startTime, endTime);
  connectSource(oscillator, filter, envelope, destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.025);
  return { source: oscillator, envelope, filter, endTime };
}

function renderNoise(context, layer, destination) {
  const startTime = Math.max(context.currentTime, layer.startTime);
  const duration = Math.max(0.025, layer.durationSeconds);
  const endTime = startTime + duration;
  // Long ambience washes loop a compact deterministic buffer instead of
  // allocating several seconds of one-use noise on every phrase.
  const bufferDuration = Math.min(duration, 2);
  const frameCount = Math.max(1, Math.ceil(context.sampleRate * bufferDuration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const samples = buffer.getChannelData(0);
  fillDeterministicNoise(samples, hashText(layer.id || 'kafkaland-noise'));

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = duration > bufferDuration;
  if (source.loop) source.loopEnd = bufferDuration;
  const envelope = context.createGain();
  applyEnvelope(envelope.gain, layer, startTime, endTime);
  const filter = createFilter(context, layer, startTime, endTime);
  connectSource(source, filter, envelope, destination);
  source.start(startTime);
  source.stop(endTime + 0.025);
  return { source, envelope, filter, endTime };
}

function applyEnvelope(param, layer, startTime, endTime) {
  const duration = endTime - startTime;
  const attack = Math.min(duration * 0.45, Math.max(0.002, layer.attackSeconds ?? 0.01));
  const release = Math.min(duration * 0.7, Math.max(0.01, layer.releaseSeconds ?? duration * 0.7));
  const peak = Math.max(0.0001, Math.min(0.7, layer.gain || 0));
  const releaseStart = Math.max(startTime + attack, endTime - release);
  param.setValueAtTime(0.0001, startTime);
  param.linearRampToValueAtTime(peak, startTime + attack);
  param.setValueAtTime(peak, releaseStart);
  param.exponentialRampToValueAtTime(0.0001, endTime);
}

function createFilter(context, layer, startTime, endTime) {
  if (!layer.filterFrequency) return null;
  const filter = context.createBiquadFilter();
  filter.type = layer.filterType || 'lowpass';
  filter.frequency.setValueAtTime(Math.max(20, layer.filterFrequency), startTime);
  if (layer.endFilterFrequency) {
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, layer.endFilterFrequency),
      endTime
    );
  }
  if (Number.isFinite(layer.q)) filter.Q.setValueAtTime(Math.max(0.0001, layer.q), startTime);
  return filter;
}

function connectSource(source, filter, envelope, destination) {
  if (filter) {
    source.connect(filter);
    filter.connect(envelope);
  } else {
    source.connect(envelope);
  }
  envelope.connect(destination);
}

function fillDeterministicNoise(samples, initialSeed) {
  let seed = initialSeed || 0x9e3779b9;
  for (let index = 0; index < samples.length; index += 1) {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    samples[index] = ((seed >>> 0) / 0x7fffffff) - 1;
  }
}

function hashText(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
