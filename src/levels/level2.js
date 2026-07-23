// Level 2 — "MONEY, HEALTH, TAXES": with your Anmeldung in hand, unlock the
// rest of adult life in Germany. Bank → Krankenkasse → Finanzamt, in order.
//
//   .  grass   #  dirt   T/P trees (punchable)   R rock
//   @  start   1  Kontoantrag (hidden)   2  Passfoto (optional, hidden)
//   B  Bank    K  Krankenkasse   F  Finanzamt (goal)   Q  Marlene
//   s  slime   b  bat ("Processing Delay")
export const MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T......................................T',
  'T.TTT..................................T',
  'T..1T.R.............TP.................T',
  'T......B.......................F.......T',
  'T......................................T',
  'T.........PPPPPP........TTTTTT.........T',
  'T......................................T',
  'T.........................b......R.....T',
  'T.@.Q...P....s...T.K...................T',
  'T......................................T',
  'T......................................T',
  'T...........TTTTTT.....PPPPPP..........T',
  'T.................................TTT..T',
  'T.........P...................TP..T2...T',
  'T......................................T',
  'T......................................T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

export const DOCUMENTS = {
  1: { id: 'antrag', name: 'Kontoantrag', icon: '📋', fact: 'antrag' },
  2: { id: 'passfoto', name: 'Passfoto', icon: '📷', fact: 'passfoto', optional: true },
};

export const GRANTED = {
  iban: { id: 'iban', name: 'Girokonto (IBAN)', icon: '🏦', fact: 'iban' },
  versichertenkarte: { id: 'versichertenkarte', name: 'Versichertenkarte', icon: '💳', fact: 'versichertenkarte' },
  steuerid: { id: 'steuerid', name: 'Steuer-ID', icon: '🧾', fact: 'steuerid' },
};

export const BUILDINGS = {
  B: {
    id: 'bank',
    label: 'Bank',
    dialogue: 'bank',
    prompt: 'Enter the Bank',
    requires: ['antrag'],
    gateDialogue: 'bank_needs_antrag',
    claimOnce: true,
    nextObjective: '🎯 Take your IBAN to the Krankenkasse (K) to get insured.',
  },
  K: {
    id: 'krankenkasse',
    label: 'Krankenkasse',
    dialogue: 'krankenkasse',
    prompt: 'Enter the Krankenkasse',
    requires: ['iban'],
    gateDialogue: 'krankenkasse_needs_iban',
    claimOnce: true,
    nextObjective: '🎯 Bring your IBAN + Versichertenkarte to the Finanzamt (F).',
  },
  F: {
    id: 'finanzamt',
    label: 'Finanzamt',
    goal: true,
    prompt: 'Enter the Finanzamt',
    completeDialogue: 'finanzamt_complete',
    incompleteDialogue: 'finanzamt_incomplete',
  },
};

// Delivered at the Finanzamt to clear the level.
export const REQUIRED = ['iban', 'versichertenkarte'];

export const COMPANIONS = {
  Q: { id: 'companion', name: 'Marlene, Amts-Eule', prompt: 'Ask Marlene, the Amts-Eule' },
};

export const LEVEL2 = {
  id: 2,
  name: 'LEVEL 2',
  map: MAP,
  documents: DOCUMENTS,
  granted: GRANTED,
  buildings: BUILDINGS,
  companions: COMPANIONS,
  required: REQUIRED,
  mission: {
    tag: 'LEVEL 2 · MONEY, HEALTH, TAXES',
    aim: 'Get banked, insured, and tax-registered.',
    steps: [
      'Grab the Kontoantrag (hidden), then open a Bank account.',
      'Get insured at the Krankenkasse (needs your IBAN).',
      'Register for tax at the Finanzamt (needs IBAN + Versichertenkarte).',
    ],
  },
  checklist: [
    { id: 'antrag', name: 'Kontoantrag' },
    { id: 'iban', name: 'Girokonto (IBAN)' },
    { id: 'versichertenkarte', name: 'Versichertenkarte' },
    { id: 'steuerid', name: 'Steuer-ID' },
    { id: 'passfoto', name: 'Passfoto', optional: true },
  ],
  startObjective: '🎯 Find the Kontoantrag (hidden), then open a Bank account.',
  passportObjective: '🎯 You have the Kontoantrag. Open your account at the Bank (B).',
  passportItem: 'antrag', // which pickup advances the objective
  win: {
    title: '✅ LEVEL 2 COMPLETE',
    sub: 'Bank account, health insurance, and a tax ID — you exist to the system now.',
    body: "IBAN, Versichertenkarte, Steuer-ID. The holy trinity of German adulthood. Next comes the final boss: the Ausländerbehörde.",
    nextLabel: '▶ Continue to Level 3: The Ausländerbehörde Gauntlet',
    hasNext: true,
  },
};

export default LEVEL2;
