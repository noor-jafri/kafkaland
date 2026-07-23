# Procedural audio

## Provenance

All audio is original procedural Web Audio synthesis in `src/audio/`. It uses oscillators and deterministic noise buffers at runtime. There are no recordings, downloaded audio assets, music-generation prompts, external audio APIs, paid services, subscriptions, or third-party melodies. As a result, there are no audio asset licenses or attribution obligations. The source direction was the task brief: cozy and hopeful pixel folk, gentle bureaucratic comedy, restrained repetition, and no vocals or artist imitation.

## Inventory

Four looping recipes live in `src/audio/tracks.js`:

- `cozy-exploration`: original seamless 90 BPM soft guitar, clarinet, marimba, warm synth bass, and light brush/tap percussion.
- `bureaucracy-office`: pizzicato, muted woodwind, subtle clock ticks, and intentionally uneven entrances.
- `companion-calm`: soft pads, bells, air, and a warm four-note motif.
- `deadline-pressure`: a restrained independent low pulse layered over exploration at a day-driven gain.

The compact effect catalog in `src/audio/effects.js` covers grass/path/wood/tile steps; paper pickup/rustle; physical and official stamps; typewriter dialogue; interaction; UI open/close/select/confirm/back; quest unlock/success/failure; locked and missing-document feedback; doors; mail; slime movement/collision; frustration; tree venting; companion activation/thinking/answer/error; and restrained breeze, bird, bicycle, traffic, tram, and room accents. Related semantic events intentionally reuse recipes where a distinct sound would be a near-duplicate.

## Implementation

- `AudioManager` owns the Web Audio graph, master/music/ambience/effects buses, smooth gain changes, bounded effects, track slots, ducking, persistence, and hidden-tab suspension.
- `GameAudio` is the single gameplay coordinator. It maps semantic game and companion events, handles gesture-only unlock, score transitions, pressure intensity, footsteps, ambience cadence, and paused gameplay.
- Dialogue lowers music by about 6.9 dB. Companion activity lowers it by about 8 dB.
- The keyboard-accessible pixel settings panel supports persisted volume and mute controls at desktop and narrow widths. Press `M` to open or close it.
- The standalone sound desk is built at `/src/audio/audition.html` and is also included in production output.

## Validation commands

```sh
npm test
npm run build
```
