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
    ['Nag Events', 'German admin interrupts you at random. One certain letter-carrier especially. You\'ll see.'],
    ['The Vent Mechanic', 'A Frustration meter fills as things go wrong. Real life gives you nowhere to put that feeling. This game gives you a tree.'],
    ['Fact Cards', 'Every so often the game tells you one TRUE, specific thing about moving to Nuremberg. They go in your Codex.'],
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
  // Bürgeramt lines are chosen dynamically in main.js depending on progress.
  buergeramt_incomplete: {
    speaker: 'Bürgeramt Official',
    lines: [
      "Anmeldung? Sehr gut. Show me: passport, Mietvertrag, and the Wohnungsgeberbestätigung.",
      "…You don't have all three. No documents, no registration. This is Germany. Come back when you're complete.",
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
};

// Rundfunkbeitrag Man barks (picked at random when he spawns / catches you).
export const NAG_LINES = {
  spawn: 'EIN HAUSHALT, EIN BEITRAG!',
  caught: "Backdated invoice! Itemized! Since your move-in date! Ha!",
  paid: 'Danke schön. …Bis nächstes Mal.',
  fled: '…na gut. Nächstes Mal.',
};

export const VENT_LINES = [
  '*THWACK*  …okay, that helped a little.',
  '*THWACK*  Take that, bureaucracy.',
  '*THWACK*  The tree understands.',
  '*THWACK*  A leaf falls. You feel seen.',
];
