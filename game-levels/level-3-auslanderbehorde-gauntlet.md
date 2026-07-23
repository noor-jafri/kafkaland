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

## Level-clear condition

Collect `eat_card` + `berechtigungsschein`, then accept the Employer NPC's `arbeitsvertrag` offer → level complete, unlocks Level 4. `zab_zeugnisbewertung` is optional but affects the offer quality.
