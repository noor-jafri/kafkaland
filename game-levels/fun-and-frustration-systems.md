# Fun & Frustration Systems (Global — every level)

The 5 levels are structurally about bureaucracy: collect the right document, avoid the right hazard, deliver it to the right NPC. Left alone, that's a checklist. This doc defines **three** systems that sit *underneath* every level: two comedic ("shughal") systems and one that makes sure all that fun is still teaching the player something real. The goal for the whole game is to be **funny, interactive, and informative at the same time** — never just one of the three. Build these once; every level doc references them rather than redefining them.

## System 1 — Nag Events (the running gags)

Nag Events are short, comedic, **non-fatal** interruptions that can fire in *any* level, independent of that level's actual wiki content. They exist purely for texture and running-gag continuity — the game world feels alive and mildly ridiculous even while the player is doing something unrelated.

### The flagship gag: Rundfunkbeitrag Man

A recurring mascot NPC — a stubby letter-carrier sprite clutching an oversized envelope — spawns unannounced, anywhere, in any level, and **speed-walks directly at the player** shouting German-bureaucrat nonsense ("EIN HAUSHALT, EIN BEITRAG!"). He's introduced properly in the wiki nowhere near where he first appears in-game — that's the joke; he's the one piece of admin nobody scheduled and everybody eventually has to deal with, same as in real life.

- **Trigger:** random timer, roughly once every 60–90 seconds of play, capped so it can't fire twice in quick succession.
- **Player options:**
  - **Outrun him** for ~10 seconds (he's slightly slower than the player) — he gives up with a grumbled "…na gut, nächstes Mal" and vanishes.
  - **Pay him on the spot** (small in-game currency cost, if the game tracks money) — he tips his hat and leaves immediately, no chase.
  - **Ignore/get caught** — no real penalty, just a comedic "backdated bill" popup with an absurdly itemized fake invoice, then he leaves anyway. This mirrors the wiki's own note that the fee is charged retroactively regardless — the joke is that avoiding him doesn't actually save you anything, which is the point.
- **Escalation gag:** the more times the player has outrun/ignored him across the whole game, the more comically over-encumbered his sprite gets on later appearances (extra envelopes, a small handcart, eventually a wheelbarrow of letters) — a visual running tally with no mechanical cost.

### Secondary nag flavors (rarer, reuse the same trigger system)

- **Spam call bubble** floats above the player's head for a few seconds (insurance upsell, "extend your Fahrschule package now!") — dismiss with a single tap; purely a UI/timing gag, no chase.
- **A GEZ-adjacent inspector** pops out from behind a tree/rock prop at random to do a fake spot-check, looks the player up and down, shrugs, and leaves — pure non-sequitur, no requirement, included because it's funny and echoes the wiki's ticket-inspector content without needing L4 specifically.

Nag Events should **never** block progress, damage the player, or gate a document. They are seasoning, not obstacles — if a level's own hazards (Bat/Slime) are the "real" friction, Nag Events are the absurd background noise of German admin life.

## System 2 — The Vent Mechanic (Frustration meter + punchable prop)

### The meter

A small **Frustration meter** (UI bar, e.g. top-left near the backpack) fills from:
- Getting touched by a Bat or Slime hazard.
- Getting caught by a Nag Event.
- A soft-timer expiring (e.g. missing the Anmeldung 14-day window in L1, or the visa window in L3).

### The release

Every level designates one (or more) **punchable prop** appropriate to its setting — a tree in the village levels, a filing cabinet in the admin maze, a wheelie bin in the utilities sandbox. Walking up to it and mashing the interact button triggers:
- An exaggerated animation: the prop visibly shakes/wobbles, oversells the impact (screen shake optional, kept small so it stays comedic not jarring).
- A silly consequence specific to the prop: the tree drops a leaf or acorn on the player's head; the filing cabinet ejects a single loose paper that flutters away; the wheelie bin lid pops open and a seagull/chicken shrieks and bolts.
- A satisfying sound cue (a cartoonish *thwack*), and the Frustration meter drops a fixed chunk per hit.

### What happens if the player never vents

If the meter maxes out, the game should **never hard-fail** — this is a comedy system, not a difficulty system. Instead: the player sprite briefly flashes red, movement gets slightly wobbly/clumsy for a few seconds (harder to control precisely, not slower), and a small thought-bubble icon appears over their head (💢). It resolves on its own after a few seconds even without venting — venting just clears it faster and feels better.

### Design intent

The Vent Mechanic is the game's pressure-release valve and its best joke: real German bureaucracy gives you nowhere to put that feeling; the game gives you a tree. It should be introduced explicitly in Level 1 (a short tutorial prompt the first time the meter fills even a little: *"Feeling anmeldung-pilled? Try the tree."*) and then left as an ambient, always-available option for the rest of the game — the player should be able to go punch a tree at literally any time, for no reason, and have it just be delightful.

## System 3 — Fact Cards (the informative layer)

This is the system that keeps the game from being funny at the expense of being useful — every joke above is *about* something real, and Fact Cards are where the real thing actually gets said in plain language.

### How it works

A small, dismissible card (think: a stamped index card or a passport-style stamp animation, matching the paper-and-bureaucracy visual language already used for the `DOCUMENTS` pickups in `src/world.js`) pops up at specific, predictable moments:
- **On picking up or delivering a key document** — one real, specific fact from the wiki page that document represents, written in the game's own voice (dry, slightly wry, never a wall of text — one or two sentences, cap it hard).
- **On a hazard/nag encounter resolving** — a fact about the *real* version of the friction the player just experienced (e.g. right after a Bat "processing delay" hit, not mid-chase — never interrupt active movement/combat).
- **Never during combat/chase resolution itself** — Fact Cards pause nothing and block nothing; they appear, can be dismissed with a single tap, and if ignored for a couple of seconds they auto-fade. They are strictly opt-in reading, not a quiz or a wall the player must clear.

### Content rules (so this stays accurate, not just funny)

- Every Fact Card must trace back to an actual line in the wiki — real numbers, real deadlines, real institution names. No invented statistics, even for comedic effect (the jokes should come from *delivery*, not from making up fake facts alongside real ones — that would undermine the "informative" half of the goal).
- Prefer the specific over the generic: "€1,000 fine for missing the 14-day deadline" beats "there might be a fine." Nuremberg-specific details (real office names, the three Ausländerbehörde locations, real Bavarian/Nuremberg fee figures where the wiki has them) should be used whenever the relevant wiki page has them.
- Where the wiki itself flags a figure as "verify current figures," the Fact Card should keep a light version of that caveat (e.g. a small "(rules change — this was true as of when we checked)" footer) rather than presenting a possibly-stale number as gospel.
- Tone: think a knowledgeable friend texting you the one thing you actually need to know, with a bit of a smirk — not a Wikipedia excerpt, not a pure gag with no content.

### Persistent payoff: the Codex

Every Fact Card seen gets logged automatically into the **Codex/Journal** (the same always-available reference menu that hosts wiki page 23's glossary — see the main [README.md](README.md)). This turns "informative" into something with lasting value instead of disposable popup text: by the end of the game the Codex is a real, browsable, funny-but-accurate mini-guide to actually moving to Nuremberg, built entirely out of things the player picked up while playing. This is the closest the game gets to directly repaying the wiki it's built from.

### Example Fact Cards (tone reference, not exhaustive)

- *(on picking up `meldebescheinigung` in L1)* "Real talk: you have 14 days to register your address in Germany or risk a fine up to €1,000. The game's been generous with you."
- *(after a Rundfunkbeitrag Man encounter, any level)* "This guy's real: it's called the Rundfunkbeitrag, it's €18.36/month per household, and yes, it gets backdated to your move-in date even if the letter takes months to arrive."
- *(on delivering `girokonto_card` in L2)* "Newcomers without a German bank account or Schufa history genuinely do get turned down more — some banks want an Anmeldung *and* a clean credit score you can't have yet. Chicken, egg, bureaucracy."
- *(after clearing the L3 gauntlet)* "Not exaggerated for the game: German courts don't accept 'we're understaffed' as an excuse for an office ignoring you forever. There's an actual lawsuit for it — an Untätigkeitsklage."
- *(on `niederlassungserlaubnis` in L5)* "Germany's citizenship rules got easier in 2024 (dual citizenship allowed, 5-year path) and then partially got walked back in 2025 (the 3-year fast track was scrapped). Even people mid-application got caught by that."

## How each level should reference this doc

Rather than re-explaining these systems, every level's `## Fun & Frustration` section should specify:
1. Which prop is punchable in that level's environment.
2. Which Nag Event flavors are tuned up/down for that level (Rundfunkbeitrag Man is universal and needs no per-level tuning; the rarer ones can lean into a level's theme).
3. Any level-specific comedic set-piece unique to that level's own wiki content (these are content jokes, not systems, and stay in the individual level docs).
4. 2–4 concrete example **Fact Cards** for that level's key documents/moments, so the informative layer is designed with the same specificity as the jokes, not left as an afterthought.
