# Level 1 — Arrival & The First Address

**Wiki source:** [01-before-you-arrive.md](../wiki/01-before-you-arrive.md), [02-arrival-and-first-days.md](../wiki/02-arrival-and-first-days.md), [03-accommodation.md](../wiki/03-accommodation.md), [04-city-registration-anmeldung.md](../wiki/04-city-registration-anmeldung.md)

**Role:** Tutorial level. Teaches movement, pickup, delivery, and the "one gate unlocks everything" structure the whole game runs on.

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

## Level-clear condition

Deliver `passport` + `mietvertrag` + `wohnungsgeberbestaetigung` to the Bürgeramt NPC → receive `meldebescheinigung` → level complete, unlocks Level 2.

## Ambient life

Use the **Chicken/Cow** animal sprites sparingly around the temp-lodging area for a "just landed, everything is a bit foreign and slow-paced" tone — purely decorative, no interaction needed.
