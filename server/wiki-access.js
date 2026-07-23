import { WIKI_MIN_LEVEL } from './level-taxonomy.js';

// Level ownership comes from game-levels/README.md. Collection flags still drive
// gameplay, but companion retrieval is intentionally level-wide.
export const WIKI_ACCESS = Object.freeze(Object.fromEntries(
  Object.entries(WIKI_MIN_LEVEL).map(([filename, minLevel]) => [filename, Object.freeze({
    minLevel,
    standingReference: minLevel === 0,
  })]),
));

export function isPageUnlocked(metadata, progress) {
  return Boolean(metadata.standingReference) || progress.currentLevel >= metadata.minLevel;
}

export function progressionHint(metadata, progress, locale = 'en') {
  const level = Math.max(progress.currentLevel + 1, metadata.minLevel);
  return locale === 'de'
    ? `Schalte zuerst Level ${level} frei.`
    : `Unlock Level ${level} first.`;
}
