// Level 1 — "ARRIVE": get registered (Anmeldung) at the Bürgeramt.
// One character = one 16px tile. See src/world.js for how this is built.
//
//   .  grass                     #  dirt path (cosmetic, the intended route)
//   T  big tree   (blocks, PUNCHABLE for venting)
//   P  pine tree  (blocks, punchable)      R  rock (blocks)
//   @  player start (train platform)
//   1  passport pickup (hidden)   2  SIM pickup (optional, hidden)
//   H  hostel (flavor)   M  apartment (grants flat docs)   G  Bürgeramt (goal)
//   s  slime spawn (bureaucratic friction)
//
// The map is a winding little town: the direct line from the platform to the
// offices is blocked, and the passport is tucked in a dead-end pocket so you
// have to actually explore for it. Reachability is regression-checked.
export const MAP = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T......................................T',
  'T..........TP..........................T',
  'T.....H....P............T..............T',
  'T....................M.................T',
  'T......................................T',
  'T.TTT............T............PT.......T',
  'T.T1..............P...........P........T',
  'T......................................T',
  'T.@...........s...................R....T',
  'T......................................T',
  'T.......T........................G.....T',
  'T........P.............................T',
  'T...................R............TTT...T',
  'T.........................PT.....T.2...T',
  'T.............T........................T',
  'T......................................T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
];

// Pickable documents, keyed by their map digit.
export const DOCUMENTS = {
  1: { id: 'passport', name: 'Reisepass', icon: '🛂', fact: 'passport' },
  2: { id: 'sim', name: 'Prepaid-SIM', icon: '📶', fact: 'sim', optional: true },
};

// Items handed over by NPCs (not found on the map).
export const GRANTED = {
  mietvertrag: { id: 'mietvertrag', name: 'Mietvertrag', icon: '📑', fact: 'mietvertrag' },
  wohnungsgeberbestaetigung: { id: 'wohnungsgeberbestaetigung', name: 'Wohnungsgeberbestätigung', icon: '🏠', fact: 'wohnungsgeberbestaetigung' },
  meldebescheinigung: { id: 'meldebescheinigung', name: 'Meldebescheinigung', icon: '📄', fact: 'meldebescheinigung' },
};

// Building roles, keyed by map letter.
//   requires / gateDialogue : hard-gate — refuse (show gateDialogue) until the
//     player holds every `requires` item.
//   claimOnce / claimedToast : one-shot NPCs (the flat is only rented once).
//   nextObjective : objective text set after a successful interaction.
//   goal + completeDialogue/incompleteDialogue : the level's delivery point.
export const BUILDINGS = {
  H: { id: 'hostel', label: 'Hostel', dialogue: 'hostel', prompt: 'Talk to the hostel clerk' },
  M: {
    id: 'apartment',
    label: 'Apartment',
    dialogue: 'apartment',
    prompt: 'Ask the Landlord about the flat',
    requires: ['passport'],
    gateDialogue: 'apartment_needs_passport',
    claimOnce: true,
    claimedToast: '🏠 The flat is already yours. Off to the Bürgeramt!',
    nextObjective: '🎯 Bring your passport + Mietvertrag + Wohnungsgeberbestätigung to the Bürgeramt.',
  },
  G: {
    id: 'buergeramt',
    label: 'Bürgeramt',
    goal: true,
    prompt: 'Enter the Bürgeramt',
    completeDialogue: 'buergeramt_complete',
    incompleteDialogue: 'buergeramt_incomplete',
  },
};

// Documents required (delivered at the goal) to clear the level.
export const REQUIRED = ['passport', 'mietvertrag', 'wohnungsgeberbestaetigung'];

export const LEVEL1 = {
  id: 1,
  name: 'LEVEL 1',
  map: MAP,
  documents: DOCUMENTS,
  granted: GRANTED,
  buildings: BUILDINGS,
  required: REQUIRED,
  mission: {
    tag: 'LEVEL 1 · ARRIVE',
    aim: 'Register your address (Anmeldung) at the Bürgeramt.',
    steps: [
      'Find your Reisepass — a short walk off the main path.',
      'Rent a flat from the Landlord (he needs your passport).',
      'Deliver passport + Mietvertrag + Wohnungsgeberbestätigung to the Bürgeramt.',
    ],
  },
  checklist: [
    { id: 'passport', name: 'Reisepass' },
    { id: 'mietvertrag', name: 'Mietvertrag' },
    { id: 'wohnungsgeberbestaetigung', name: 'Wohnungsgeberbestätigung' },
    { id: 'sim', name: 'Prepaid-SIM', optional: true },
  ],
  startObjective: '🎯 Find your Reisepass (it is hidden nearby).',
  startToast: '🚆 You step off the train in Nuremberg. → Move with WASD.',
  passportObjective: '🎯 You have your passport. Now rent a flat — talk to the Landlord (M).',
  win: {
    title: '✅ LEVEL 1 COMPLETE',
    sub: 'You are officially registered in Nuremberg.',
    body: "The Meldebescheinigung is yours. It unlocks everything that comes next: a bank account, health insurance, your tax ID, your residence permit.",
    nextLabel: '▶ Continue to Level 2: Money, Health, Taxes',
    hasNext: true,
  },
};

export default LEVEL1;
