# Level 1 — Arrival & The First Address

**Wiki source:** [01-before-you-arrive.md](../wiki/01-before-you-arrive.md), [02-arrival-and-first-days.md](../wiki/02-arrival-and-first-days.md), [03-accommodation.md](../wiki/03-accommodation.md), [04-city-registration-anmeldung.md](../wiki/04-city-registration-anmeldung.md)

**Role:** Tutorial level. Teaches movement, pickup, delivery, and the "one gate unlocks everything" structure the whole game runs on.

## Opening Beat (the first ~20 seconds of control)

Hands off directly from the intro/instructions flow in [00-title-and-intro.md](00-title-and-intro.md) — the train the Bunny boarded at the end of the Intro pulls into Nuremberg Hauptbahnhof, and control is handed to the player as the Bunny steps off onto the platform (this is the `@` spawn tile).

1. **The train doors close behind you** and the camera settles on the Bunny at the far edge of the map. A single soft in-world prompt appears near the player — *not* a menu, just a nudge: *"→ Move. Nuremberg's that way."* It fades once the player takes a few steps, so movement is learned by doing, not by reading.
2. **First pickup within a few steps:** the `passport` (🛂) sits glinting just ahead on the platform — impossible to miss, and the game's first "walk over it / press interact to collect" moment. Picking it up plays the backpack-slot-fill animation, teaching the inventory before anything is at stake.
3. **First Fact Card fires immediately on that pickup** — delivering on the promise the Intro made 20 seconds earlier that the game is funny *and* real:
   > *"Your Reisepass is the one thing you truly cannot lose here — every single office in this game will ask for it. Guard it like the last Brötchen on a Sunday (nothing's open on Sundays — you'll learn)."*

   This is the moment the three-pillar loop clicks for the player: they did a thing (interactive), got a joke (funny), and learned something true (informative) — all in the first few seconds of real play.
4. From here the level opens up and the player is free to explore toward the hostel and apartments (see Setting below). The Vent Mechanic tutorial prompt (*"Feeling anmeldung-pilled? Try the tree."*) is held back until the Frustration meter first ticks up — see the Fun & Frustration section.

## Setting

A small arrival district: train station tile at map edge (player spawn, `@`), a row of temporary lodging (hostel), a couple of "for rent" apartment buildings, and the Bürgeramt (registration office) at the far end — visually the goal building the player is walking toward the whole level, so it should be visible/lit-up from a distance.

This is close to the **existing prototype map already in `src/map.js`** — it already has a passport (1), Anmeldung (2), and Mietvertrag/contract (3) as pickups. Level 1 should keep that exact shape and extend it slightly rather than replace it.

## Objective

Land, find a place to live, and register your address (Anmeldung) before the level clock/soft-deadline runs out.

## Documents to collect (backpack items)

| id | name | icon | wiki source |
|---|---|---|---|
| `passport` | Reisepass / Visum | 🛂 | 01 |
| `sim_or_esim` | Prepaid-SIM | 📶 | 02 (grabbed at the station kiosk, teaches "some items are optional but helpful") |
| `mietvertrag` | Mietvertrag (signed lease) | 📑 | 03 |
| `wohnungsgeberbestaetigung` | Wohnungsgeberbestätigung | 🏠 | 04 |
| `meldebescheinigung` | Meldebescheinigung | 📄 | 04 — awarded automatically on delivering the above at the Bürgeramt, not picked up on the map |

## NPCs / buildings (map tiles `A` / `B`)

- **Hostel/temp lodging** — no requirement, just a safe respawn point; flavor dialogue about "first days" (culture shock, Sunday closures).
- **2–3 apartment buildings** — walking up to one without a `mietvertrag` yet triggers a short Schufa/competition joke dialogue (from 03's "Massenbesichtigung" content) then hands over the lease once the player "wins" a trivial approach (e.g. just walking in — keep L1 friction low).
- **Bürgeramt (final building)** — accepts `mietvertrag` + `wohnungsgeberbestaetigung` + `passport`, hands back `meldebescheinigung`, and this is the level-clear trigger.

## Hazards

- Minimal. One or two **Slime** enemies near the apartment buildings representing "slow landlord response" — touching one just adds a short delay/stumble (no health loss), not a real threat. This is the tutorial; keep stakes low.
- No **Bat** enemies yet — introduce those in Level 2+.

## Soft timer

A visible day-counter UI ("Day 1 of 14") referencing the real 14-day Anmeldung legal deadline from wiki page 04. Missing it in L1 should not fail the level (per the wiki's own note that authorities are usually lenient with newcomers genuinely trying) — instead it triggers a one-time flavor penalty (a small fine popup) and continues, teaching the player that timers matter without punishing them hard this early.

## Fun & Frustration

See [fun-and-frustration-systems.md](fun-and-frustration-systems.md) for the full Nag Event / Vent Mechanic rules — this section is just the L1-specific tuning.

- **Punchable prop:** the big `T` trees scattered around the map. This is the level where the Vent Mechanic gets taught — the first time the Frustration meter fills even slightly (e.g. after a Slime "slow landlord" delay), a one-line prompt appears: *"Feeling anmeldung-pilled? Try the tree."* First punch should feel great: exaggerated wobble, a startled bird flies out, a satisfying thwack.
- **Nag Event:** Rundfunkbeitrag Man can make his very first appearance here, ironically before the player has even registered an address — a small absurdist joke (he's nagging you about a household you don't technically have yet), and a good early signal that this NPC doesn't care about the game's own internal logic.
- **Comedic set-piece:** the apartment-viewing beat (wiki's "Massenbesichtigung" content) plays as a slapstick crowd scene — 4–5 comically identical NPC-applicants all sprint to the same door the moment the player approaches, jostle for a second, then all get turned away except the player, who "wins" simply by being the protagonist. Played for laughs, not difficulty.
- **Fact Cards for this level:**
  - *(on `mietvertrag` pickup)* "That crowd of applicants wasn't exaggerated much — popular listings in Nuremberg routinely draw 20-40+ people to a single viewing."
  - *(on `wohnungsgeberbestaetigung` pickup)* "Your landlord is legally required to give you this (§19 Bundesmeldegesetz) — if they're slow about it, that's not normal, that's them missing a legal obligation."
  - *(on delivering to the Bürgeramt / receiving `meldebescheinigung`)* "14 days. That's the real legal window to register your address in Germany, fine up to €1,000 if you blow it — though Nuremberg tends to go easy on newcomers who were clearly trying."

## Level-clear condition

Deliver `passport` + `mietvertrag` + `wohnungsgeberbestaetigung` to the Bürgeramt NPC → receive `meldebescheinigung` → level complete, unlocks Level 2.

## Ambient life

Use the **Chicken/Cow** animal sprites sparingly around the temp-lodging area for a "just landed, everything is a bit foreign and slow-paced" tone — purely decorative, no interaction needed.
