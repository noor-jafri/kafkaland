/**
 * Kafkaland procedural audio public API.
 *
 * Integration outline:
 * 1. Construct one AudioManager (optionally restoring preferences explicitly).
 * 2. Call `await audio.unlock()` from the title/start user gesture.
 * 3. Select tracks by state with `playTrack()`/`stopTrack()`.
 * 4. Call short effects by ID, and toggle dialogue/companion ducking while their
 *    overlays or speech are active.
 * 5. Persist preferences after settings changes, then `dispose()` on teardown.
 *
 * No module in this directory imports game state, so this foundation remains
 * independently testable and can be wired after parallel feature work lands.
 */

export { AudioManager } from './AudioManager.js';
export {
  AUDIO_CHANNELS,
  AUDIO_OUTPUT_CHANNELS,
  AUDIO_PREFERENCE_KEY,
  AUDIO_PREFERENCE_VERSION,
  DEFAULT_AUDIO_PREFERENCES,
  DUCKING_PROFILES,
  channelGain,
  clamp,
  combineDucking,
  createGainTransition,
  createTriggerState,
  crossfadeGains,
  evaluateTrigger,
  parseAudioPreferences,
  readAudioPreferences,
  sampleGainTransition,
  sanitizeAudioPreferences,
  serializeAudioPreferences,
  writeAudioPreferences,
} from './core.js';
export {
  EFFECT_IDS,
  EFFECT_RECIPES,
  FOOTSTEP_SURFACES,
  buildEffectEvent,
  effectTriggerLimits,
  footstepEffectId,
  getEffectRecipe,
} from './effects.js';
export {
  TRACK_DEFINITIONS,
  TRACK_IDS,
  getTrackDefinition,
  pitchToFrequency,
  scheduleTrackWindow,
  trackLoopDuration,
} from './tracks.js';
