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

## Fun & Frustration

See [fun-and-frustration-systems.md](fun-and-frustration-systems.md) for the shared systems — dial both way down here on purpose. This level's comedy should be warm and nostalgic, not chaotic, matching its epilogue role.

- **Punchable prop:** still present (consistency matters — the player should always be able to go punch something), but re-skinned as a soft, low-stakes gag — a single wobbly garden tree outside the Standesamt that drops a flower instead of a leaf/acorn. The Frustration meter itself should barely ever fill in this level, since hazards are absent; the prop exists mostly for players who just want to do it for fun one last time.
- **Nag Event:** Rundfunkbeitrag Man gets exactly one final, deliberately bittersweet cameo — he shows up near the end, looking older/more tired (a small sprite variant), nags out of pure habit, and if the player pays him this last time he says something like "…danke. Also, congratulations" before wandering off for good — a small send-off for the game's longest-running joke rather than another annoyance.
- **Comedic set-piece:** the naturalisation office's brief "sign changes/closes then reopens" beat (already in Hazards) should play as a gentle bureaucratic-absurdity gag — a clerk taping a hand-written "back in 5 Minuten" sign over the official one, visibly re-taping it twice before finally opening the door — warm comedy about the system's quirks, not frustration.
- **Fact Cards for this level:**
  - *(on `kindergeld_bescheid` pickup)* "The real Kindergeld is about €259/month as of early 2026, and it can be backdated up to 6 months if you're late applying — worth knowing before you assume you missed out."
  - *(on `elterngeld_bescheid` pickup)* "Real Elterngeld pays a percentage of your prior income for 12-14 months total between both parents — with a bonus stretch if you split the leave. It genuinely rewards sharing it."
  - *(on `niederlassungserlaubnis` pickup)* "In real life this took anywhere from 21 months (Blue Card + B1 German) to 5 years (standard route), depending entirely on which path you were on."
  - *(on `einbuergerungsurkunde`, ending the game)* "One true thing to leave you with: Germany's citizenship rules got friendlier in 2024 (dual citizenship allowed, 5-year path) — then partly rolled back in 2025 (the 3-year fast track got scrapped, even for some people already mid-application). The rules can move under you. Always check current ones."

## Level-clear / game-clear condition

Collect `niederlassungserlaubnis`, then deliver it at the naturalisation office to receive `einbuergerungsurkunde` → **game complete**. If the player took the family branch, `geburtsurkunde` + `kindergeld_bescheid` + `elterngeld_bescheid` are shown in an end-of-game summary/backpack recap alongside every other document collected across all 5 levels, since this is the natural place for a "here's everything you achieved" final screen.
