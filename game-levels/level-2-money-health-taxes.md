# Level 2 — Money, Health & Taxes

**Wiki source:** [05-bank-account.md](../wiki/05-bank-account.md), [06-health-insurance.md](../wiki/06-health-insurance.md), [10-taxes.md](../wiki/10-taxes.md), [15-pension-insurance.md](../wiki/15-pension-insurance.md), [16-liability-insurance.md](../wiki/16-liability-insurance.md)

**Role:** First "real" level — introduces branching choices (which bank, which insurance type) and the first meaningful hazard type.

## Setting

A financial/admin district: a bank street with two competing bank buildings (traditional vs. neobank), an insurance office row (GKV vs. PKV), a small Finanzamt building, and a mailbox prop where the Steuer-ID "arrives" a set number of in-game days after the player enters the level (referencing the real 2–4 week wait from wiki page 04/10).

## Objective

Get banked, insured, and tax-registered — the financial foundation everything else in the game depends on.

## Documents to collect (backpack items)

| id | name | icon | wiki source |
|---|---|---|---|
| `girokonto_card` | Girokonto (bank card) | 💳 | 05 |
| `krankenversicherung_card` | Gesundheitskarte | 🩺 | 06 |
| `steuer_id_letter` | Steuer-ID (letter) | 🧾 | 10 — spawns in the mailbox prop after a delay, teaching "some items arrive on their own timer, not by walking somewhere" |
| `haftpflicht_policy` | Haftpflichtversicherung | 🛡️ | 16 (optional pickup — not required to clear the level, but grants a passive perk: reduces "accident" hazard damage for the rest of the game, mirroring its real-world unlimited-liability protection) |
| `rentenversicherungsnummer` | Rentenversicherungsnummer | 🏛️ | 15 — auto-granted once the player has a job/employment flag set (if the game tracks that), otherwise a simple pickup near the bank |

## NPCs / buildings

- **Bank A (traditional, e.g. Sparkasse-style)** — requires `meldebescheinigung` from Level 1 to enter; slower dialogue, mentions in-branch appointment.
- **Bank B (neobank)** — no Anmeldung requirement joke option, but has its own "video-ident" mini-interaction (e.g. a quick QR/photo prompt) — offer the player a real choice with a flavor trade-off (Bank B is faster but a Slime enemy — "video-ident glitch" — guards its door 30% of the time).
- **Insurance row** — two doors, GKV and PKV; picking one locks out returning to the other for the rest of the game (mirrors the real PKV opt-out difficulty), telegraphed clearly so it reads as a meaningful choice, not a trap.
- **Finanzamt** — flavor-only building in this level (full mechanical role reserved for freelancer-specific content if that's ever added); mostly reinforces the mailbox/Steuer-ID beat.

## Hazards

- **Bat enemies** introduced here for the first time — represent "processing delay" — they patrol between the bank and insurance buildings and briefly stun/slow the player on contact (references the appointment-scarcity and video-ident-failure common-problems content).
- **Slime enemies** at the neobank door (see above) — represents the newcomer rejection risk documented in wiki page 05.

## Level-clear condition

Deliver `girokonto_card` + `krankenversicherung_card` + `steuer_id_letter` to a "Welcome Center" checkpoint NPC → level complete, unlocks Level 3.

`haftpflicht_policy` and `rentenversicherungsnummer` are optional/perk pickups that persist into later levels rather than being required here — this is the first level that teaches "not everything you can pick up is mandatory."
