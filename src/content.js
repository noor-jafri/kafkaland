// All player-facing writing lives here, so the tone stays in one place.
// Voice: funny, but every fact is real (see game-levels/fun-and-frustration-systems.md).

export const INTRO_PANELS = [
  "You did it. You got the visa / the offer / the nerve.\nYou're moving to Germany.",
  "Specifically: Nuremberg. Bavaria. Bratwurst, castles, and —\nyou'll find out — an astonishing amount of paperwork.",
  "How hard can settling in be?\n\n…In a 2025 expat survey, internationals ranked Germany DEAD LAST —\n46th of 46 — for 'ease of settling in.' You're going to be fine. Probably.",
  "Rule one: register your address within 14 days of moving in.\nMiss it and it's a fine up to €1,000. Write that down.",
  "Okay. Deep breath.\nHere comes the train.",
];

export const HOWTO = {
  controls: [
    ['Move', 'WASD / Arrow keys'],
    ['Interact', 'E — talk, enter doors, pick up documents'],
    ['Vent (punch a tree)', 'F — when standing near any tree'],
    ['Codex (your notes)', 'C — every Fact Card you\'ve seen'],
    ['Advance / dismiss', 'E or Space'],
  ],
  creatures: [
    ['🟢 Slime', '"Bureaucratic Friction" — red tape and conflicting info. Bumps you, won\'t kill you.'],
    ['🦇 Bat', '"Processing Delay" — shows up in later levels. Annoying, not dangerous.'],
    ['🐔 🐄 Chickens & Cows', 'Just vibes. Ambient village life. Harmless.'],
  ],
  systems: [
    ['The Collector', 'A tall man in a black coat hunts you for the Rundfunkbeitrag (broadcast fee). He follows your TRAIL, not a straight line — double back, break line of sight, or pay him to be rid of him. He always returns.'],
    ['The Vent Mechanic', 'A Frustration meter fills as things go wrong. Real life gives you nowhere to put that feeling. This game gives you a tree — stand near one and press F.'],
    ['Fact Cards', 'Every so often the game tells you one TRUE, specific thing about moving to Nuremberg. They go in your Codex.'],
  ],
  // The intended order for Level 1. Documents don't just lie in the open — and
  // each office refuses you until you hold what it asks for.
  steps: [
    ['1. Find your Reisepass', 'It is NOT out in the open. Explore the dead-ends — check behind the trees.'],
    ['2. Rent a flat (Landlord, M)', 'He won\'t even talk to you without a passport. With it, he hands over the Mietvertrag + Wohnungsgeberbestätigung.'],
    ['3. Register (Bürgeramt, G)', 'Bring passport + both flat documents. Missing one? They\'ll tell you exactly which — and send you away.'],
  ],
  roadmap: '①  ARRIVE  →  ②  MONEY, HEALTH, TAXES  →  ③  THE AUSLÄNDERBEHÖRDE (boss!)  →  ④  GETTING AROUND  →  ⑤  FAMILY & FOREVER',
};

// Fact Cards — keyed id → { title, body }. Every body is a real fact from the wiki.
export const FACT_CARDS = {
  passport: {
    title: 'Reisepass',
    body: "Your passport is the one thing you truly cannot lose here — every single office in this game will ask for it. Guard it like the last Brötchen on a Sunday. (Nothing's open on Sundays. You'll learn.)",
  },
  sim: {
    title: 'Prepaid SIM',
    body: "A prepaid SIM needs no Schufa and no bank account — that's why it's the smart first buy. A proper contract (Vertrag) needs both, which you don't have yet. Chicken, meet egg.",
  },
  mietvertrag: {
    title: 'Mietvertrag',
    body: "That crowd of applicants wasn't exaggerated much — popular flats in Nuremberg routinely draw 20–40+ people to a single viewing (a 'Massenbesichtigung'). You basically won a lottery.",
  },
  wohnungsgeberbestaetigung: {
    title: 'Wohnungsgeberbestätigung',
    body: "Your landlord is legally required to give you this (§19 Bundesmeldegesetz). If they're slow about it, that's not normal — that's them dodging a legal obligation. Chase them.",
  },
  meldebescheinigung: {
    title: 'Meldebescheinigung',
    body: "14 days. That's the real legal window to register your address in Germany — a fine up to €1,000 if you blow it. Nuremberg tends to go easy on newcomers who were clearly trying, though.",
  },
  rundfunk: {
    title: 'Rundfunkbeitrag',
    body: "That guy's real. It's the Rundfunkbeitrag — €18.36/month per household — and yes, it gets backdated to your move-in date even if the letter takes months to find you. Running doesn't save you a cent.",
  },
  // --- Level 2: Money, Health, Taxes ---
  antrag: {
    title: 'Kontoantrag',
    body: "German banks still love paper. Many want a signed account application (Kontoantrag) plus your Meldebescheinigung and passport before they'll open a Girokonto. Neobanks skip the branch, but the paperwork is the same idea.",
  },
  passfoto: {
    title: 'Passfoto',
    body: "Biometric passport photos (35×45mm, neutral face, no smiling) are demanded by half the offices here. There's a photo booth in every train station for exactly this reason. Buy a strip; you'll need them again.",
  },
  iban: {
    title: 'Girokonto (IBAN)',
    body: "Almost nothing works without a German IBAN: rent, salary, insurance, the tax office. It's the financial address that says you're really here. Direct debit (Lastschrift) runs the whole country.",
  },
  versichertenkarte: {
    title: 'Versichertenkarte',
    body: "Health insurance isn't optional in Germany — it's legally mandatory (§193 VVG). Public (gesetzlich) insurers must accept you; your Versichertenkarte is what every doctor scans before they'll see you.",
  },
  steuerid: {
    title: 'Steuer-ID',
    body: "Your Steuer-Identifikationsnummer is 11 digits, assigned for life, and arrives by post a few weeks after you register. Your employer needs it or you get taxed at the brutal emergency rate. Guard the letter.",
  },
  // --- Level 3: The Ausländerbehörde Gauntlet ---
  fiktionsbescheinigung: {
    title: 'Fiktionsbescheinigung',
    body: "A real bridging document: if your residence permit isn't ready before your visa expires, this keeps your stay legal — and often lets you keep working — in the meantime. It's the reason a backlog doesn't automatically make you illegal.",
  },
  eat_card: {
    title: 'eAT (Aufenthaltstitel)',
    body: "The electronic residence permit card. In Nuremberg, converting a visa into this card has been reported to take well over a year in some cases — the office blames staff shortages of around 15% of positions. Appointments are online-only via 'Mein Nürnberg'; walk-ins are turned away.",
  },
  berechtigungsschein: {
    title: 'Integrationskurs',
    body: "Integration courses (language + a 'Leben in Deutschland' orientation module) are often not just an offer but an obligation attached to your permit. Finishing one can even shorten the years-to-citizenship clock.",
  },
  zab_zeugnisbewertung: {
    title: 'ZAB-Zeugnisbewertung',
    body: "Getting your foreign degree formally recognised (via the ZAB) is optional but powerful — skip it and you risk 'deskilling'. Under 30% of non-EU academics abroad end up in jobs that actually match their qualifications.",
  },
  arbeitsvertrag: {
    title: 'Arbeitsvertrag',
    body: "The job contract — the true prize. With recognised qualifications it's worth more; without them, people still sign under time pressure. Either way, a signed Arbeitsvertrag is what turns 'surviving the paperwork' into 'living here'.",
  },
  untaetigkeit: {
    title: 'Untätigkeitsklage',
    body: "This is real: German courts don't accept 'we're short-staffed' as a valid excuse for an office ignoring you indefinitely. There's an actual lawsuit — the Untätigkeitsklage — to force a decision when an authority stalls.",
  },
};

// NPC building dialogues. Each is a list of lines; some grant items when finished.
export const DIALOGUES = {
  hostel: {
    speaker: 'Hostel Clerk',
    lines: [
      "Willkommen! First days in Germany, ja? A tip, since you look lost:",
      "The shops all close on Sundays. ALL of them. Buy your groceries on Saturday or go hungry and thoughtful.",
      "Your bed's upstairs. Come back any time you need to catch your breath.",
    ],
  },
  apartment: {
    speaker: 'Landlord',
    lines: [
      "You and forty other people want this flat. Let me guess — no Schufa score yet?",
      "…But I like you. You've got protagonist energy. The flat is yours.",
      "Here's your Mietvertrag. And — because the law says I must — your Wohnungsgeberbestätigung. Don't lose either.",
    ],
    grants: ['mietvertrag', 'wohnungsgeberbestaetigung'],
  },
  // Gate: shown when you try to rent without a passport.
  apartment_needs_passport: {
    speaker: 'Landlord',
    lines: [
      "Whoa. No passport, no conversation. How do I even know you exist?",
      "Go find your Reisepass first. Then we talk about the flat.",
    ],
  },
  // The Bürgeramt's refusal: main.js appends a dynamic line naming what's missing.
  buergeramt_incomplete: {
    speaker: 'Bürgeramt Official',
    lines: [
      "Anmeldung? Sehr gut. I require: passport, Mietvertrag, and the Wohnungsgeberbestätigung.",
    ],
  },
  buergeramt_complete: {
    speaker: 'Bürgeramt Official',
    lines: [
      "Passport… Mietvertrag… Wohnungsgeberbestätigung. All in order. Astonishing.",
      "Stamp. Stamp. And… stamp. Here is your Meldebescheinigung.",
      "This little paper unlocks everything: bank account, health insurance, tax ID, your residence permit. Guard it. Willkommen in Nürnberg!",
    ],
    grants: ['meldebescheinigung'],
  },

  // --- Level 2: Money, Health, Taxes ---
  bank: {
    speaker: 'Bank Advisor',
    lines: [
      "Meldebescheinigung, passport, and — ah, the signed Kontoantrag. Wunderbar.",
      "Your Girokonto is open. Here is your IBAN. Rent, salary, insurance — everything flows through this now.",
    ],
    grants: ['iban'],
  },
  bank_needs_antrag: {
    speaker: 'Bank Advisor',
    lines: [
      "You want an account, but where is your Kontoantrag? The signed application form?",
      "No form, no Konto. Find one, sign it, come back.",
    ],
  },
  krankenkasse: {
    speaker: 'Krankenkasse Agent',
    lines: [
      "Health insurance — mandatory, by the way, not a choice. You have an IBAN? Good, we bill by Lastschrift.",
      "Welcome to the gesetzliche Krankenversicherung. Here is your Versichertenkarte. Don't get sick before it arrives — but if you do, you're covered.",
    ],
    grants: ['versichertenkarte'],
  },
  krankenkasse_needs_iban: {
    speaker: 'Krankenkasse Agent',
    lines: [
      "We can insure you, but we bill monthly by direct debit. No German IBAN, no policy.",
      "Open a bank account first. Then come back.",
    ],
  },
  // Finanzamt's refusal: main.js appends a dynamic line naming what's missing.
  finanzamt_incomplete: {
    speaker: 'Finanzamt Clerk',
    lines: [
      "Steuer-ID registration. I need proof you're banked and insured: your IBAN and your Versichertenkarte.",
    ],
  },
  finanzamt_complete: {
    speaker: 'Finanzamt Clerk',
    lines: [
      "IBAN… Versichertenkarte… all in order. Efficient. I almost don't know what to do with that.",
      "Your Steuer-Identifikationsnummer is registered. Eleven digits, yours for life.",
      "Bank, health, taxes — you are a full citizen of the paperwork now. The Ausländerbehörde awaits, but that… is another day.",
    ],
    grants: ['steuerid'],
  },

  // --- Level 3: The Ausländerbehörde Gauntlet ---
  auslaenderbehoerde: {
    speaker: 'Ausländerbehörde Officer',
    lines: [
      "Residence permit conversion. You have the Fiktionsbescheinigung? Good — it's why we haven't declared you illegal while you waited.",
      "Biometrics… photo… fee… Your eAT (Aufenthaltstitel) is approved. The card that says: you may stay.",
    ],
    grants: ['eat_card'],
  },
  auslaenderbehoerde_needs_fiktion: {
    speaker: 'Ausländerbehörde Officer',
    lines: [
      "Your visa is expiring and your permit isn't ready. Without a Fiktionsbescheinigung you have no legal standing here.",
      "Pick one up at the front wing first. Then we can talk about your eAT.",
    ],
  },
  integrationskurs: {
    speaker: 'VHS Course Office',
    lines: [
      "You hold your eAT? Then you're eligible — and, honestly, likely obliged — to take the Integrationskurs.",
      "Language plus 'Leben in Deutschland'. Here's your Bescheinigung. It even shaves time off your citizenship clock.",
    ],
    grants: ['berechtigungsschein'],
  },
  integrationskurs_needs_eat: {
    speaker: 'VHS Course Office',
    lines: [
      "Enrolment requires a valid residence permit. Get your eAT from the Ausländerbehörde first.",
    ],
  },
  recognition: {
    speaker: 'Recognition Authority (ZAB)',
    lines: [
      "You want your foreign degree recognised? Wise — it's optional, but skipping it is how good people end up underemployed.",
      "Evaluation complete. Here is your ZAB-Zeugnisbewertung. Your qualifications now officially count.",
    ],
    grants: ['zab_zeugnisbewertung'],
  },
  recognition_needs_eat: {
    speaker: 'Recognition Authority (ZAB)',
    lines: [
      "We only process residents. Come back once you hold your eAT.",
    ],
  },
  employer_incomplete: {
    speaker: 'Employer',
    lines: [
      "I'd love to sign you. HR just needs to see that you're actually allowed to work and settled in.",
    ],
  },
  employer_complete: {
    speaker: 'Employer',
    lines: [
      "eAT — you can work. Integrationskurs — you're settling in. That's everything HR wanted.",
      "Here's your Arbeitsvertrag. Welcome aboard. You didn't just survive the system — you're living here now.",
    ],
    grants: ['arbeitsvertrag'],
  },
};

// Signature gag: the "conflicting information" official at a wing door.
export const CONFLICT_LINES = {
  speaker: 'Confused Official',
  lines: [
    "Halt. You need Form A to pass here.",
    "…You have Form A? Ah. No, no — not that one. The OTHER one.",
    "…This one is identical to the first in every visible way. But it is the wrong one. Obviously.",
    "…Ach. You know what? Go through. NEXT!",
  ],
};

// Signature gag: the Untätigkeit mini-boss. One line per interaction; after the
// last, it gives up and hands over the Untätigkeitsklage fact.
export const UNTAETIGKEIT = {
  speaker: 'Case-worker',
  steps: [
    "Ah, a new applicant. First, this stamp goes on a fresh form.",
    "That form now requires a counter-stamp. Please wait. Indefinitely.",
    "The counter-stamp needs a cover sheet. And a copy. In triplicate.",
    "…You're STILL here? Most people have given up by now. Concerning.",
  ],
  giveUp: "Fine. FINE. Processed. Take it and go — before I locate another form.",
};

// The Collector barks (picked when he spawns / catches you). Menacing, but dry.
export const NAG_LINES = {
  spawn: 'EIN HAUSHALT… EIN BEITRAG. I can see your trail.',
  caught: "Backdated. Itemized. Since your move-in date. There is no escape from the fee.",
  paid: 'Danke schön. …I always come back.',
  fled: 'You cannot outrun a public institution forever. …Bis bald.',
};

export const VENT_LINES = [
  '*THWACK*  …okay, that helped a little.',
  '*THWACK*  Take that, bureaucracy.',
  '*THWACK*  The tree understands.',
  '*THWACK*  A leaf falls. You feel seen.',
];
