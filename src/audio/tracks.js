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
  // Soft guitar leaves regular breathing room instead of filling every beat.
  ...[50, 57, 62, 57, 48, 55, 59, 55, 45, 52, 57, 52, 47, 54, 59, 54]
    .map((pitch, index) => tone(index * 2 + (index % 4 === 1 ? 0.12 : 0), pitch, 0.72, 'softGuitar', 0.31)),
  // A small hopeful clarinet answer appears once per two-bar phrase.
  ...[
    [2.5, 66, 1.35], [6.75, 64, 0.9], [10.5, 62, 1.35], [14.75, 64, 0.9],
    [18.5, 66, 1.35], [22.75, 69, 0.9], [26.5, 64, 1.35], [30.5, 62, 0.9],
  ].map(([beat, pitch, duration]) => tone(beat, pitch, duration, 'clarinet', 0.19)),
  // Marimba answers the guitar with a quiet, uneven two-note pattern.
  ...[
    [1, 69], [3.25, 66], [5, 67], [7.5, 64], [9, 64], [11.25, 69], [13, 66], [15.5, 62],
    [17, 69], [19.25, 66], [21, 72], [23.5, 69], [25, 64], [27.25, 67], [29, 66], [31.25, 62],
  ].map(([beat, pitch]) => tone(beat, pitch, 0.38, 'marimba', 0.2)),
  ...[38, 36, 33, 35, 38, 41, 33, 35]
    .map((pitch, index) => tone(index * 4, pitch, 1.35, 'roundBass', 0.26)),
  ...Array.from({ length: 16 }, (_, index) => noise(index * 2 + 1.5, 0.1, 'folkBrush', index % 4 === 3 ? 0.12 : 0.075)),
  ...[7.75, 15.75, 23.75, 31.75].map((beat) => noise(beat, 0.08, 'woodTap', 0.09)),
];

const officeEvents = [
  ...chord(0, [53, 57, 62], 0.52, 'pizzicato', 0.25),
  ...chord(4.25, [52, 56, 62], 0.48, 'pizzicato', 0.24),
  ...chord(8, [50, 55, 59], 0.52, 'pizzicato', 0.25),
  ...chord(12.5, [52, 57, 60], 0.48, 'pizzicato', 0.23),
  ...[
    [1.25, 65], [2.75, 69], [5.5, 62], [6.75, 67],
    [9.25, 64], [10.75, 71], [13.5, 65], [14.85, 60],
  ].map(([beat, pitch], index) => tone(beat, pitch, index % 3 === 1 ? 0.52 : 0.36, 'mutedWoodwind', 0.18)),
  ...[41, 40, 38, 40].map((pitch, index) => tone(index * 4 + (index === 3 ? 0.25 : 0), pitch, 0.46, 'officeBass', 0.24)),
  ...[1.75, 3.5, 5.75, 7.5, 9.75, 11.5, 13.75, 15.5]
    .map((beat, index) => noise(beat, 0.08, index % 2 ? 'deskTickSoft' : 'deskTick', 0.15)),
];

const companionEvents = [
  ...chord(0, [48, 55, 62], 7.5, 'glassPad', 0.18),
  ...chord(8, [45, 52, 60], 7.5, 'glassPad', 0.17),
  ...chord(16, [50, 57, 64], 7.5, 'glassPad', 0.18),
  ...chord(24, [47, 54, 62], 7.5, 'glassPad', 0.17),
  ...[72, 67, 69, 64].map((pitch, index) => tone(3.5 + index * 8, pitch, 1.6, 'softBell', 0.18)),
  ...[60, 62, 67, 64].map((pitch, index) => tone(1.5 + index * 8, pitch, 2.2, 'companionGlow', 0.11)),
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
    bpm: 90,
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
