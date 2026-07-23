# Level 5 — Family & Forever

**Wiki source:** [19-having-a-child.md](../wiki/19-having-a-child.md), [22-permanent-residence-and-citizenship.md](../wiki/22-permanent-residence-and-citizenship.md)

**Role:** Epilogue/endgame level. No combat, no hazards, slower pace — a montage-style closer rather than a challenge, reflecting that both of these wiki topics are multi-year, low-friction, high-stakes-in-a-quiet-way milestones rather than appointment gauntlets.

## Setting

A calmer, more "grown up" version of the Level 1 town — same visual language (grass, dirt paths, a couple of shop-style buildings) but with a hospital/Standesamt building, a Familienkasse/ZBFS building, and — at the very end of the map — a naturalisation office whose exterior visibly changes (flag, lighting) as the player approaches, signaling this is the last stop in the game.

This level can optionally be entirely skippable/branching: since having a child is life-circumstance-dependent in real life, consider gating it behind a player choice ("start a family?") rather than forcing it, with a shorter direct path to the citizenship content for players who decline.

## Objective

Optionally register a birth and claim family benefits, then pursue the long-term goal of permanent residence and/or citizenship — the game's final milestone.

## Documents to collect (backpack items)

| id | name | icon | wiki source |
|---|---|---|---|
| `geburtsurkunde` | Geburtsurkunde | 👶 | 19 (only spawns/relevant if the player opts into the family branch) |
| `kindergeld_bescheid` | Kindergeld-Bescheid | 👨‍👩‍👧 | 19 |
| `elterngeld_bescheid` | Elterngeld-Bescheid | 🍼 | 19 |
| `niederlassungserlaubnis` | Niederlassungserlaubnis | 🏆 | 22 — the main required end-state item regardless of the family branch |
| `einbuergerungsurkunde` | Einbürgerungsurkunde (citizenship certificate) | 🇩🇪 | 22 — the true ending item; getting this triggers the game's final cutscene/credits |

## NPCs / buildings

- **Standesamt** — only active if the player opted into the family branch; hands over `geburtsurkunde` immediately (no real friction — mirrors the wiki's brief, low-friction registration process), then flags the Familienkasse/ZBFS building as available.
- **Familienkasse/ZBFS building** — hands over `kindergeld_bescheid` and `elterngeld_bescheid`; can include a short "which Elterngeld variant" flavor choice (Basis / Plus / Partnerschaftsbonus) with no mechanical effect beyond dialogue flavor.
- **Naturalisation office (final building)** — requires `niederlassungserlaubnis` first; a time-skip/montage effect (in-game calendar visibly advancing years) plays while the player "waits," then delivers `einbuergerungsurkonde` on interacting again.

## Hazards

None by design. If the game wants a tiny nod to wiki 22's "rules can change mid-application" content, a single one-time scripted event (not a recurring hazard) where the naturalisation office briefly closes/changes its sign before reopening is enough — a narrative beat, not a gameplay obstacle.

## Level-clear / game-clear condition

Collect `niederlassungserlaubnis`, then deliver it at the naturalisation office to receive `einbuergerungsurkunde` → **game complete**. If the player took the family branch, `geburtsurkunde` + `kindergeld_bescheid` + `elterngeld_bescheid` are shown in an end-of-game summary/backpack recap alongside every other document collected across all 5 levels, since this is the natural place for a "here's everything you achieved" final screen.
