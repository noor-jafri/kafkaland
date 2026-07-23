# Level 3 — The Ausländerbehörde Gauntlet

**Wiki source:** [07-auslanderbehorde-residence-permit.md](../wiki/07-auslanderbehorde-residence-permit.md), [08-integration-course.md](../wiki/08-integration-course.md), [20-qualifications-recognition.md](../wiki/20-qualifications-recognition.md), [21-job-search.md](../wiki/21-job-search.md)

**Role:** The game's "boss level" — highest hazard density, the level the wiki itself repeatedly flags as the hardest real-world step. Should feel noticeably tougher than L1/L2.

## Setting

A dense, maze-like admin complex with **three separate office wings** (referencing the real three Ausländerbehörde locations in Nuremberg), connected by narrow dirt-path corridors full of patrolling hazards — visually the most cramped, least "village-like" level, using more `#` dirt-path corridor tiles and fewer open grass tiles than other levels to create a bureaucratic-maze feeling.

## Objective

Convert your entry visa into an actual residence permit, get through the integration course requirement, get your foreign qualifications recognized, and land a job offer.

## Documents to collect (backpack items)

| id | name | icon | wiki source |
|---|---|---|---|
| `fiktionsbescheinigung` | Fiktionsbescheinigung | ⏳ | 07 — a temporary "shield" item: while held, missing the level's soft timer doesn't fail the player |
| `eat_card` | eAT (Aufenthaltstitel) | 🪪 | 07 — the core level-clear item |
| `berechtigungsschein` | Integrationskurs-Bescheinigung | 🎓 | 08 |
| `zab_zeugnisbewertung` | ZAB-Zeugnisbewertung | 📜 | 20 (optional — see below) |
| `arbeitsvertrag` | Arbeitsvertrag (job offer) | 💼 | 21 — the level's true final prize |

## NPCs / buildings

- **Three office-wing entrances**, each gating a different document (`eat_card`, `berechtigungsschein`, and a recognition-authority stand-in for `zab_zeugnisbewertung`) — player must clear all three wings before the final "Employer" NPC becomes available.
- **Recognition Authority stand** (wiki 20) — optional wing: skipping it is allowed, but the final Employer NPC gives a noticeably better `arbeitsvertrag` (higher in-game "salary" stat, if the game tracks one) if the player has `zab_zeugnisbewertung` in hand, mirroring the real deskilling-risk stakes.
- **Employer NPC** — appears only after the eAT + Integrationskurs requirements are met; accepting their offer (with or without recognition) is the level-clear trigger.

## Hazards

- **Highest Bat density in the game** — patrol the corridors between wings, represent appointment scarcity/long waits; getting hit resets the player to the wing entrance (a real "you have to start this queue over" beat).
- **Slime enemies at wing doors** — represent "conflicting information from staff"; touching one triggers a short forced dialogue loop (comedic — the NPC contradicts itself) before letting the player pass, costing time but not health.
- **A single unique "Untätigkeit" mini-boss Slime** (larger sprite, reuse Slime art scaled up) — optional to fight/wait-out at the busiest wing; defeating/outlasting it is a nod to the wiki's Untätigkeitsklage (suing the office for inaction) content, and rewards a shortcut through that wing on repeat visits.

## Soft timer

The level's clock represents the visa-to-permit window. Holding `fiktionsbescheinigung` (picked up early from the first wing) suspends the timer — this should be taught explicitly, since it's the level's core tension-relief mechanic and mirrors the real bridging document's purpose.

## Fun & Frustration

See [fun-and-frustration-systems.md](fun-and-frustration-systems.md) for the shared systems — this level leans on them harder than any other, since it's the boss level and the Frustration meter should genuinely be climbing often here.

- **Punchable prop:** a battered filing cabinet in each wing's waiting room — thematically perfect (venting on the very furniture that's slowing you down), and it should visibly accumulate dents/stickers/graffiti the more the player punches it over the course of the level, becoming a small running visual gag by the third wing.
- **Nag Event:** Rundfunkbeitrag Man's appearances here are the funniest in the game precisely because of the setting — he shows up *inside the waiting room*, takes a numbered ticket like everyone else, and nags the player only once his number is "called," which never quite happens before he wanders off. A sight gag more than an interruption.
- **Comedic set-piece:** the "conflicting information" Slime encounter (already in Hazards) should have a genuinely funny dialogue loop — e.g. the NPC insists you need a document, the player produces it, the NPC says "not that one, the *other* one," produces a document identical in every visible way, repeat twice, then wave the player through anyway with no explanation. This is the level's signature joke and should be the thing players quote afterward.
- **Boss-fight flavor:** the "Untätigkeit" mini-boss Slime (see Hazards) should have deliberately absurd "attacks" — it doesn't hit the player, it just periodically produces a new stamp that needs to go on a new form, forcing a brief pause; "defeating" it is really just outlasting an escalating pile of increasingly ridiculous forms until it gives up.
- **Fact Cards for this level:**
  - *(entering the maze / first wing)* "This maze has three doors for a reason — Nuremberg genuinely splits its foreigners' office across three separate locations, and which one you need depends on your case."
  - *(on `fiktionsbescheinigung` pickup)* "This isn't a game invention — it's a real bridging document that keeps your stay legal (and often lets you keep working) if your permit isn't ready before your visa expires."
  - *(defeating/outlasting the Untätigkeit mini-boss)* "This is real: German courts don't accept 'we're short-staffed' as a valid excuse for an office ignoring you indefinitely. There's an actual lawsuit for forcing a decision — an Untätigkeitsklage."
  - *(on accepting `arbeitsvertrag` without `zab_zeugnisbewertung`)* "Skipping qualification recognition is a real choice people make under time pressure — and it's part of why under-30% of non-EU academics abroad end up in jobs that actually match their degree."

## Level-clear condition

Collect `eat_card` + `berechtigungsschein`, then accept the Employer NPC's `arbeitsvertrag` offer → level complete, unlocks Level 4. `zab_zeugnisbewertung` is optional but affects the offer quality.
