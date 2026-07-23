import { clamp } from './core.js';

/** Convert a MIDI-style pitch number to frequency without any browser APIs. */
export function pitchToFrequency(pitch) {
  return 440 * 2 ** ((Number(pitch) - 69) / 12);
}

const tone = (beat, pitch, durationBeats, voice, velocity = 0.5, extra = {}) => ({
  kind: 'tone', beat, pitch, durationBeats, voice, velocity, ...extra,
});
const noise = (beat, durationBeats, voice, velocity = 0.25, extra = {}) => ({
  kind: 'noise', beat, durationBeats, voice, velocity, ...extra,
});
const chord = (beat, pitches, durationBeats, voice, velocity) => (
  pitches.map((pitch) => tone(beat, pitch, durationBeats, voice, velocity))
);

// These short, intentionally irregular motifs were composed for Kafkaland.
// They are data rather than melodies copied from recordings, and all timbres
// are synthesized at runtime.
const cozyEvents = [
  ...chord(0, [50, 57, 62], 3.7, 'warmPad', 0.26),
  ...chord(4, [48, 55, 59], 3.7, 'warmPad', 0.24),
  ...chord(8, [45, 52, 57], 3.7, 'warmPad', 0.25),
  ...chord(12, [47, 54, 59], 3.7, 'warmPad', 0.24),
  ...chord(16, [50, 57, 62], 3.7, 'warmPad', 0.25),
  ...chord(20, [53, 57, 60], 3.7, 'warmPad', 0.23),
  ...chord(24, [45, 52, 57], 3.7, 'warmPad', 0.24),
  ...chord(28, [47, 54, 60], 3.7, 'warmPad', 0.23),
  ...[50, 57, 64, 59, 52, 60, 55, 62, 50, 57, 65, 60, 48, 55, 62, 54]
    .map((pitch, index) => tone(index * 2 + (index % 3 === 1 ? 0.25 : 0), pitch, 0.62, 'feltPluck', 0.34)),
  ...[38, 36, 33, 35, 38, 41, 33, 35]
    .map((pitch, index) => tone(index * 4, pitch, 1.3, 'roundBass', 0.3)),
];

const officeEvents = [
  ...chord(0, [53, 57, 62], 1.4, 'officePluck', 0.26),
  ...chord(4, [52, 56, 62], 1.1, 'officePluck', 0.25),
  ...chord(8, [50, 55, 59], 1.4, 'officePluck', 0.26),
  ...chord(12, [52, 57, 60], 1.1, 'officePluck', 0.24),
  ...[65, 69, 62, 67, 64, 71, 65, 60, 69, 64, 67, 62]
    .map((pitch, index) => tone(index * 1.25 + (index % 4 === 3 ? 0.25 : 0), pitch, 0.24, 'paperPluck', 0.28)),
  ...[41, 40, 38, 40].map((pitch, index) => tone(index * 4, pitch, 0.46, 'officeBass', 0.27)),
  ...[1.75, 3.5, 5.75, 7.5, 9.75, 11.5, 13.75, 15.5]
    .map((beat, index) => noise(beat, 0.08, index % 2 ? 'deskTickSoft' : 'deskTick', 0.18)),
];

const companionEvents = [
  ...chord(0, [48, 55, 62], 7.5, 'glassPad', 0.18),
  ...chord(8, [45, 52, 60], 7.5, 'glassPad', 0.17),
  ...chord(16, [50, 57, 64], 7.5, 'glassPad', 0.18),
  ...chord(24, [47, 54, 62], 7.5, 'glassPad', 0.17),
  ...[72, 67, 69, 64].map((pitch, index) => tone(3.5 + index * 8, pitch, 1.6, 'companionGlow', 0.2)),
  noise(0, 7.8, 'airWash', 0.09),
  noise(8, 7.8, 'airWash', 0.08),
  noise(16, 7.8, 'airWash', 0.09),
  noise(24, 7.8, 'airWash', 0.08),
];

const deadlineEvents = [
  ...[33, 33, 35, 32].flatMap((pitch, bar) => [
    tone(bar * 4, pitch, 0.42, 'deadlinePulse', 0.18),
    tone(bar * 4 + 2.5, pitch, 0.3, 'deadlinePulse', 0.11),
  ]),
  noise(3.75, 0.08, 'clockBrush', 0.08),
  noise(7.75, 0.08, 'clockBrush', 0.08),
  noise(11.75, 0.08, 'clockBrush', 0.08),
  noise(15.75, 0.08, 'clockBrush', 0.08),
];

/**
 * Procedural track definitions. `slot` controls crossfading: replacing a track
 * only fades the current track in the same slot, so the pressure layer can sit
 * under a main music track.
 */
export const TRACK_DEFINITIONS = deepFreeze({
  'cozy-exploration': {
    id: 'cozy-exploration',
    label: 'Cozy exploration',
    channel: 'music',
    slot: 'music-main',
    bpm: 78,
    beatsPerBar: 4,
    loopBars: 8,
    events: cozyEvents,
  },
  'bureaucracy-office': {
    id: 'bureaucracy-office',
    label: 'Playful bureaucracy office',
    channel: 'music',
    slot: 'music-main',
    bpm: 88,
    beatsPerBar: 4,
    loopBars: 4,
    events: officeEvents,
  },
  'companion-calm': {
    id: 'companion-calm',
    label: 'Calm companion ambience',
    channel: 'ambience',
    slot: 'companion-ambience',
    bpm: 48,
    beatsPerBar: 4,
    loopBars: 8,
    events: companionEvents,
  },
  'deadline-pressure': {
    id: 'deadline-pressure',
    label: 'Restrained deadline pressure',
    channel: 'music',
    slot: 'pressure-layer',
    bpm: 72,
    beatsPerBar: 4,
    loopBars: 4,
    events: deadlineEvents,
  },
});

export const TRACK_IDS = Object.freeze(Object.keys(TRACK_DEFINITIONS));

/** Return a frozen track definition, throwing early for integration typos. */
export function getTrackDefinition(id) {
  const track = typeof id === 'string'
    ? Object.hasOwn(TRACK_DEFINITIONS, id) && TRACK_DEFINITIONS[id]
    : id;
  if (!track) throw new RangeError(`Unknown procedural track: ${id}`);
  return track;
}

/** Duration of one complete track loop in seconds. */
export function trackLoopDuration(trackOrId) {
  const track = getTrackDefinition(trackOrId);
  return track.loopBars * track.beatsPerBar * 60 / track.bpm;
}

/**
 * Deterministically schedule event starts in the half-open interval
 * [windowStartSeconds, windowEndSeconds). Returned `timeSeconds` values are
 * relative to track start; AudioManager translates them to AudioContext time.
 * Windows are capped at 60 seconds to prevent accidental unbounded work.
 */
export function scheduleTrackWindow(trackOrId, windowStartSeconds, windowEndSeconds) {
  const track = getTrackDefinition(trackOrId);
  const rawStart = Number(windowStartSeconds);
  const rawEnd = Number(windowEndSeconds);
  if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) {
    throw new RangeError('Track schedule windows must use finite seconds');
  }
  const start = Math.max(0, rawStart);
  const end = Math.max(start, rawEnd);
  if (end === start) return [];
  if (end - start > 60) throw new RangeError('Track schedule windows cannot exceed 60 seconds');

  const secondsPerBeat = 60 / track.bpm;
  const loopSeconds = trackLoopDuration(track);
  const firstLoop = Math.floor(start / loopSeconds);
  const finalLoop = Math.floor((end - Number.EPSILON) / loopSeconds);
  const scheduled = [];

  for (let loop = firstLoop; loop <= finalLoop; loop += 1) {
    const loopStart = loop * loopSeconds;
    track.events.forEach((event, eventIndex) => {
      const timeSeconds = loopStart + event.beat * secondsPerBeat;
      if (timeSeconds < start || timeSeconds >= end) return;
      const durationSeconds = Math.max(0.025, event.durationBeats * secondsPerBeat);
      scheduled.push({
        ...event,
        id: `${track.id}:${loop}:${eventIndex}`,
        trackId: track.id,
        channel: track.channel,
        loop,
        timeSeconds,
        durationSeconds,
        gain: clamp(event.velocity, 0, 0.65),
        ...(event.kind === 'tone' ? { frequency: pitchToFrequency(event.pitch) } : {}),
      });
    });
  }

  return scheduled.sort((a, b) => a.timeSeconds - b.timeSeconds || a.id.localeCompare(b.id));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}
