# Procedural audio and integration record

## Integration heads

This integration started at `origin/main` `8f587bf2f0f60fc3422b583cb31ab933f2ddc6e4` and merged the complete heads below without changing or closing either source PR:

- PR 2: https://github.com/noor-jafri/kafkaland/pull/2 at `b0f9febdcc0b47cb174c8c15c42c7ca34e70d6c0`
- PR 3: https://github.com/noor-jafri/kafkaland/pull/3 at `33e0f01787c1e869d169971a3ed62b015e17355c`

Both commits are ancestors of the integration branch. Every path changed by either PR relative to its recorded base remains present in the integration tree. PR 2's direct Markdown retrieval, signed progression filtering, companion/letter UI, and Craftpix trees remain present. PR 3's procedural modules, tests, and audition page remain present. Unrelated files removed by the latest `main` remain removed.

## Provenance

All audio is original procedural Web Audio synthesis in `src/audio/`. It uses oscillators and deterministic noise buffers at runtime. There are no recordings, downloaded audio assets, music-generation prompts, external audio APIs, paid services, subscriptions, or third-party melodies. As a result, there are no audio asset licenses or attribution obligations. The source direction was the task brief: cozy and hopeful pixel folk, gentle bureaucratic comedy, restrained repetition, and no vocals or artist imitation.

The separately licensed Craftpix visual assets and exact supplied license evidence remain documented under `assets/Craftpix/`.

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
git merge-base --is-ancestor b0f9febdcc0b47cb174c8c15c42c7ca34e70d6c0 HEAD
git merge-base --is-ancestor 33e0f01787c1e869d169971a3ed62b015e17355c HEAD
```
