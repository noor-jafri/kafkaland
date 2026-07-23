// Level 2 — "MONEY, HEALTH, TAXES": with your Anmeldung in hand, unlock the
// rest of adult life in Germany. Bank → Krankenkasse → Finanzamt, in order.
//
//   .  grass   #  dirt   T/P trees (punchable)   R rock
//   @  start   1  Kontoantrag (hidden)   2  Passfoto (optional, hidden)
//   B  Bank    K  Krankenkasse   F  Finanzamt (goal)
//   s  slime   b  bat ("Processing Delay")
export const MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T......................................T',
  'T.TTTT.......T.........................T',
  'T..1.T.B.....T......T..................T',
  'T....T.......T..b..............F.......T',
  'T............T.........................T',
  'T...TTTTTTTTT..PPPPPPPPPP..TTTTTTTTT...T',
  'T......................................T',
  'T.......R....s......K.......P..........T',
  'T.@.K............P.....................T',
  'T............................b.........T',
  'T...PPPPPPP..TTTTTTTTTT...PPPPPPPPPP...T',
  'T........T....................T........T',
  'T........T................s...T..TTTT..T',
  'T........TT.............R.....T..T..T..T',
  'T........T....................T..T.2T..T',
  'T.............................T..T.....T',
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
    dialogue: 'bank',
    prompt: 'Enter the Bank',
    requires: ['antrag'],
    gateDialogue: 'bank_needs_antrag',
    claimOnce: true,
    claimedToast: '🏦 Your account is open. Next: health insurance (Krankenkasse).',
    nextObjective: '🎯 Take your IBAN to the Krankenkasse (K) to get insured.',
  },
  K: {
    id: 'krankenkasse',
    dialogue: 'krankenkasse',
    prompt: 'Enter the Krankenkasse',
    requires: ['iban'],
    gateDialogue: 'krankenkasse_needs_iban',
    claimOnce: true,
    claimedToast: '💳 You are insured. Last stop: the Finanzamt (F).',
    nextObjective: '🎯 Bring your IBAN + Versichertenkarte to the Finanzamt (F).',
  },
  F: {
    id: 'finanzamt',
    goal: true,
    prompt: 'Enter the Finanzamt',
    completeDialogue: 'finanzamt_complete',
    incompleteDialogue: 'finanzamt_incomplete',
  },
};

// Delivered at the Finanzamt to clear the level.
export const REQUIRED = ['iban', 'versichertenkarte'];

export const COMPANIONS = {
  K: { id: 'companion', name: 'Marlene, Amts-Eule', prompt: 'Ask Marlene, the Amts-Eule' },
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
  startObjective: '🎯 Set up your life: open a bank account (needs a Kontoantrag — it is hidden), then get insured, then register for tax.',
  startToast: '📄 Meldebescheinigung in hand, you set out again. → Bank first.',
  passportObjective: '🎯 You have the Kontoantrag. Open your account at the Bank (B).',
  passportItem: 'antrag', // which pickup advances the objective
  win: {
    title: '✅ LEVEL 2 COMPLETE',
    sub: 'Bank account, health insurance, and a tax ID — you exist to the system now.',
    body: "IBAN, Versichertenkarte, Steuer-ID. The holy trinity of German adulthood. Next comes the final boss: the Ausländerbehörde.",
    nextLabel: '▶ Continue to Level 3: The Ausländerbehörde (coming soon)',
    hasNext: false,
  },
};

export default LEVEL2;
