// Level 3 — "THE AUSLÄNDERBEHÖRDE GAUNTLET": the boss level. Convert your visa
// into a residence permit, clear the integration course, (optionally) get your
// degree recognised, then land a job. Denser, maze-ier, higher hazard density.
//
//   .  grass   T/P trees (punchable)   R rock
//   @  start   1  Fiktionsbescheinigung (hidden bridging doc)
//   A  Ausländerbehörde (eAT)   V  Integrationskurs   Z  Recognition (optional)
//   J  Employer (goal)
//   s  slime   b  bat   c  conflicting-information official   U  Untätigkeit boss
export const MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T.......T......T.......P.......T.......T',
  'T.......T......T.......P.......T.......T',
  'T...AR..T..1...T.......P.V.....T.......T',
  'T.......T......T.......P.R.....T.......T',
  'T.......T......T.....c.P.......T.......T',
  'T.......T.P......s.....P......bT.......T',
  'T......................P...............T',
  'T.............b..................TTTTT.T',
  'T.@......s..................U..........T',
  'T..................T..b................T',
  'T.PPPPP.....P......T.......T........J..T',
  'T...........P......T.......T.....b.....T',
  'T...........PR.....T.......T.s.....P...T',
  'T...Z.......P......T.T.....T...........T',
  'T...........P......T.......T...........T',
  'T...........P......T.......T...........T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

export const DOCUMENTS = {
  1: { id: 'fiktionsbescheinigung', name: 'Fiktionsbescheinigung', icon: '⏳', fact: 'fiktionsbescheinigung' },
};

export const GRANTED = {
  eat_card: { id: 'eat_card', name: 'eAT (Aufenthaltstitel)', icon: '🪪', fact: 'eat_card' },
  berechtigungsschein: { id: 'berechtigungsschein', name: 'Integrationskurs', icon: '🎓', fact: 'berechtigungsschein' },
  zab_zeugnisbewertung: { id: 'zab_zeugnisbewertung', name: 'ZAB-Zeugnisbewertung', icon: '📜', fact: 'zab_zeugnisbewertung' },
  arbeitsvertrag: { id: 'arbeitsvertrag', name: 'Arbeitsvertrag', icon: '💼', fact: 'arbeitsvertrag' },
};

export const BUILDINGS = {
  A: {
    id: 'auslaenderbehoerde',
    label: 'Ausländerbehörde',
    dialogue: 'auslaenderbehoerde',
    prompt: 'Enter the Ausländerbehörde',
    requires: ['fiktionsbescheinigung'],
    gateDialogue: 'auslaenderbehoerde_needs_fiktion',
    claimOnce: true,
    claimedToast: '🪪 You have your eAT. Now the Integrationskurs (V).',
    nextObjective: '🎯 Enrol in the Integrationskurs (V) — needs your eAT.',
  },
  V: {
    id: 'integrationskurs',
    label: 'Integrationskurs',
    dialogue: 'integrationskurs',
    prompt: 'Enter the Integrationskurs office',
    requires: ['eat_card'],
    gateDialogue: 'integrationskurs_needs_eat',
    claimOnce: true,
    claimedToast: '🎓 Course secured. Optionally get recognised (Z), then see the Employer (J).',
    nextObjective: '🎯 See the Employer (J). Tip: recognise your degree at ZAB (Z) first for a better offer.',
  },
  Z: {
    id: 'recognition',
    label: 'ZAB (optional)',
    dialogue: 'recognition',
    prompt: 'Enter the Recognition Authority',
    requires: ['eat_card'],
    gateDialogue: 'recognition_needs_eat',
    claimOnce: true,
    claimedToast: '📜 Degree recognised. The Employer will value that.',
  },
  J: {
    id: 'employer',
    label: 'Employer',
    goal: true,
    prompt: 'Meet the Employer',
    completeDialogue: 'employer_complete',
    incompleteDialogue: 'employer_incomplete',
  },
};

// Deliver these to the Employer to clear the level (recognition is optional).
export const REQUIRED = ['eat_card', 'berechtigungsschein'];

export const LEVEL3 = {
  id: 3,
  name: 'LEVEL 3',
  map: MAP,
  documents: DOCUMENTS,
  granted: GRANTED,
  buildings: BUILDINGS,
  required: REQUIRED,
  passportItem: 'fiktionsbescheinigung',
  mission: {
    tag: 'LEVEL 3 · THE AUSLÄNDERBEHÖRDE GAUNTLET',
    aim: 'Turn your visa into a residence permit — and land a job.',
    steps: [
      'Grab the Fiktionsbescheinigung (hidden) — it keeps you legal while you wait.',
      'Get your eAT at the Ausländerbehörde, then your Integrationskurs place.',
      '(Optional) recognise your degree at the ZAB, then sign with the Employer.',
    ],
  },
  checklist: [
    { id: 'fiktionsbescheinigung', name: 'Fiktionsbescheinigung' },
    { id: 'eat_card', name: 'eAT (permit)' },
    { id: 'berechtigungsschein', name: 'Integrationskurs' },
    { id: 'zab_zeugnisbewertung', name: 'ZAB recognition', optional: true },
    { id: 'arbeitsvertrag', name: 'Arbeitsvertrag' },
  ],
  startObjective: '🎯 Find the Fiktionsbescheinigung (hidden) before anything else.',
  startToast: '🏢 The Ausländerbehörde. Three wings, endless queues. Deep breath.',
  passportObjective: '🎯 You are legal to wait now. Get your eAT at the Ausländerbehörde (A).',
  win: {
    title: '✅ LEVEL 3 COMPLETE',
    sub: 'Residence permit in hand, job signed. You beat the boss level.',
    body: "eAT, Integrationskurs, and a real Arbeitsvertrag. You didn't just survive German bureaucracy — you live here now. The rest is (relatively) downhill.",
    nextLabel: '▶ Continue to Level 4: Getting Around (coming soon)',
    hasNext: false,
  },
};

export default LEVEL3;
