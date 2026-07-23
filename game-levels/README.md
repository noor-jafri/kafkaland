# Kafkaland — Level Design (5 Levels)

This folder translates the 23-page [wiki](../wiki/) into **5 playable levels** for the pixel-art top-down game already scaffolded in `src/` (Three.js, 16px tiles, ASCII `MAP` in `src/map.js`, a Bunny player, shop buildings, tree/rock obstacles, and a document-pickup + backpack loop — see `src/world.js` and `src/map.js` for the existing mechanics this design builds on).

## The core loop (already built, reused every level)

Every level is the same verbs, new content:
1. Walk around a small village/district map (`MAP` ASCII grid, same format as the current prototype).
2. Visit **NPC buildings** (shop tiles `A`/`B` — Bürgeramt, bank, Ausländerbehörde, etc.) to trigger a checklist/dialogue.
3. **Collect documents** scattered on the map (same `DOCUMENTS` dict pattern: `{ id, name, icon }`) — these are your inventory proof-of-completion items, capped by the existing 5-slot backpack.
4. Avoid/survive **hazards** — reuse the existing `BAT` and `SLIME` enemy sprites as personifications of bureaucratic friction (delays, conflicting information, scams), and the `CHICKEN`/`COW` animal sprites as harmless ambient life for village levels.
5. Deliver the full document set to the level's final NPC to clear the level and unlock the next.

## Level → wiki mapping

| Level | Theme | Wiki pages covered |
|---|---|---|
| 1 | Arrival & The First Address | 01, 02, 03, 04 |
| 2 | Money, Health & Taxes | 05, 06, 10, 15, 16 |
| 3 | The Ausländerbehörde Gauntlet | 07, 08, 20, 21 |
| 4 | Getting Around & Settling In | 09, 11, 12, 13, 14, 17, 18 |
| 5 | Family & Forever | 19, 22 |

**Wiki page 23 (Glossary & Resources) is not a level** — implement it as an always-available in-game **Codex/Journal** menu (a UI overlay, not a map), since it's a reference the player should be able to open at any point, matching how the wiki itself treats it as a non-quest reference page.

## Difficulty curve

- **L1** is the tutorial: low hazard density, generous space, teaches movement/pickup/delivery.
- **L2–L3** raise hazard density (more Bat/Slime spawns representing delays and appointment scarcity) and introduce timers (e.g. the 14-day Anmeldung clock, the 6-month driving-license clock) as a soft-fail mechanic — miss the timer, take a penalty (a fine, a re-queue) rather than a hard game over, mirroring the wiki's "Nuremberg tends to be lenient with newcomers clearly trying" tone.
- **L4** is the open "sandbox" level — side-quest energy, less linear, more optional pickups.
- **L5** is the epilogue/endgame level — slower pace, no combat, framed as a long-haul montage (years passing) rather than a real-time challenge.

## Files

- [level-1-arrival.md](level-1-arrival.md)
- [level-2-money-health-taxes.md](level-2-money-health-taxes.md)
- [level-3-auslanderbehorde-gauntlet.md](level-3-auslanderbehorde-gauntlet.md)
- [level-4-getting-around.md](level-4-getting-around.md)
- [level-5-family-and-forever.md](level-5-family-and-forever.md)
