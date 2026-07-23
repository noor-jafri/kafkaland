// This mapping is derived from game-levels/README.md and each wiki page's
// Prerequisites block. Keep it explicit so progression reviews are easy.
// Flags are server-issued by the narrow transitions in progress.js.
export const WIKI_ACCESS = Object.freeze({
  '01-before-you-arrive.md': { minLevel: 1, requiredFlags: [] },
  '02-arrival-and-first-days.md': { minLevel: 1, requiredFlags: ['arrival_complete'] },
  '03-accommodation.md': { minLevel: 1, requiredFlags: ['arrival_complete'] },
  '04-city-registration-anmeldung.md': { minLevel: 1, requiredFlags: ['housing_complete'] },
  '05-bank-account.md': { minLevel: 2, requiredFlags: ['level_1_complete'] },
  '06-health-insurance.md': { minLevel: 2, requiredFlags: ['level_1_complete'] },
  '07-auslanderbehorde-residence-permit.md': { minLevel: 3, requiredFlags: ['level_2_complete'] },
  '08-integration-course.md': { minLevel: 3, requiredFlags: ['level_2_complete'] },
  '09-driving-license.md': { minLevel: 4, requiredFlags: ['level_3_complete'] },
  '10-taxes.md': { minLevel: 2, requiredFlags: ['level_1_complete'] },
  '11-car-buying-and-registration.md': { minLevel: 4, requiredFlags: ['level_3_complete', 'driving_guidance_unlocked'] },
  '12-public-transport.md': { minLevel: 4, requiredFlags: ['level_3_complete'] },
  '13-radio-tax.md': { minLevel: 4, requiredFlags: ['level_3_complete'] },
  '14-waste-sorting.md': { minLevel: 4, requiredFlags: ['level_3_complete'] },
  '15-pension-insurance.md': { minLevel: 2, requiredFlags: ['level_1_complete'] },
  '16-liability-insurance.md': { minLevel: 2, requiredFlags: ['level_1_complete'] },
  '17-sim-and-internet.md': { minLevel: 4, requiredFlags: ['level_3_complete'] },
  '18-social-integration.md': { minLevel: 4, requiredFlags: ['level_3_complete'] },
  '19-having-a-child.md': { minLevel: 5, requiredFlags: ['level_4_complete'] },
  '20-qualifications-recognition.md': { minLevel: 3, requiredFlags: ['level_2_complete'] },
  '21-job-search.md': { minLevel: 3, requiredFlags: ['level_2_complete'] },
  '22-permanent-residence-and-citizenship.md': { minLevel: 5, requiredFlags: ['level_4_complete'] },
  '23-glossary-and-resources.md': { minLevel: 0, requiredFlags: [], standingReference: true },
});

export function isPageUnlocked(metadata, progress) {
  if (metadata.standingReference) return true;
  if (progress.currentLevel < metadata.minLevel) return false;
  const flags = new Set(progress.flags);
  return metadata.requiredFlags.every((flag) => flags.has(flag));
}

export function progressionHint(metadata, progress, locale = 'en') {
  const german = locale === 'de';
  if (metadata.minLevel > progress.currentLevel) {
    if (progress.currentLevel === 1) {
      return german
        ? 'Schließe zuerst deine Anmeldung in Level 1 ab.'
        : 'Complete your Level 1 Anmeldung quest first.';
    }
    return german
      ? 'Schließe zuerst die Aufgaben deines aktuellen Levels ab.'
      : 'Complete the quests in your current level first.';
  }
  if (metadata.requiredFlags.includes('housing_complete')) {
    return german
      ? 'Finde zuerst eine Wohnung und hole die Vermieterbestätigung.'
      : 'Find a home and collect the landlord confirmation first.';
  }
  return german
    ? 'Schließe zuerst den aktuellen Quest-Schritt ab.'
    : 'Complete your current quest step first.';
}
