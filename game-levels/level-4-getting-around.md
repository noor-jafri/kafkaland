# Level 4 — Getting Around & Settling In

**Wiki source:** [09-driving-license.md](../wiki/09-driving-license.md), [11-car-buying-and-registration.md](../wiki/11-car-buying-and-registration.md), [12-public-transport.md](../wiki/12-public-transport.md), [13-radio-tax.md](../wiki/13-radio-tax.md), [14-waste-sorting.md](../wiki/14-waste-sorting.md), [17-sim-and-internet.md](../wiki/17-sim-and-internet.md), [18-social-integration.md](../wiki/18-social-integration.md)

**Role:** The open "sandbox" level. Lowest linearity in the game — most of this content is genuinely optional side-quest material in the wiki, so the level should read that way: a big open map with scattered mini-objectives the player can do in any order, no boss, no maze.

## Setting

A full town map — the biggest of the five — with a transit stop, a Kfz-Zulassungsstelle (car registration office), a Führerscheinstelle (license office), a few household buildings each with their own trash bins outside, a phone/internet shop, and a VHS/community-center building. Open grass fields between buildings, low hazard density — this is the "life is stabilizing" level, and should feel calmer than Level 3.

## Objective

There is no single hard gate here (mirroring the wiki's own "no strict order — tackle as life demands" framing of its side-quest hub). The level clears once the player has completed **any 3 of the 5 available mini-quests** below — rewarding player choice rather than forcing completionism.

## Mini-quests (pick any 3+)

| Mini-quest | Document/reward | icon | wiki source |
|---|---|---|---|
| Convert or test for a driving license, then register a car | `fuehrerschein` + `kfz_kennzeichen` | 🚗 | 09, 11 |
| Get a Deutschlandticket instead | `deutschlandticket` | 🚋 | 12 (mutually flavor-exclusive with the car quest — pick a mobility style, not both required) |
| Register for the Rundfunkbeitrag proactively | `rundfunk_registered` stamp | 📺 | 13 |
| Sort a week of household trash correctly (a small drag-the-item-to-the-right-bin minigame using the four bin colors) | `awb_badge` | ♻️ | 14 |
| Get a SIM + home internet contract, and attend one VHS/Stammtisch social event | `connected_and_social` badge | 📶🗣️ | 17, 18 |

## Hazards

- Sparse. A few wandering **Bats** near the internet shop (installation-delay joke — touching one just triggers a "2–6 week wait" dialogue gag, no real penalty).
- **Waste-sorting minigame** is the closest thing to a challenge here — mis-sorting three items in a row triggers a comedic fine popup and a note taped to the player's door (referencing wiki 14's neighbor-complaint content) but does not fail the level.
- Chicken/Cow ambient animals throughout — this level should feel the most like a peaceful village sim, contrasting deliberately with Level 3's tension.

## Fun & Frustration

See [fun-and-frustration-systems.md](fun-and-frustration-systems.md) for the shared systems — L4 should feel the loosest/goofiest of all five levels, matching its sandbox role.

- **Punchable prop:** the household wheelie bins outside each building — thematically perfect since this level already has a waste-sorting minigame, and punching the *wrong* bin (comedically) can startle the chicken/cow ambient animals into a brief panicked scatter, which is funny but has zero mechanical consequence.
- **Nag Event:** this is the one level where Rundfunkbeitrag Man's chase can end in an actual physical gag — because the map is big and open, let him occasionally trip over a rock (`R` tile) mid-chase and faceplant, giving the player a free few seconds and a laugh, before he gets back up and resumes.
- **Comedic set-piece:** add a **Schwarzfahren ticket-inspector chase** as an optional micro-event on the transit-stop mini-quest — a plain-clothed inspector NPC occasionally "reveals" themselves near the transit stop with an exaggerated badge-flourish animation; if the player has a valid Deutschlandticket item, it's a non-event (inspector nods and moves on), but without one it triggers a short, silly chase around the stop (no real penalty, just a comedic near-miss animation) rather than an actual fine — keeping the level's low-stakes tone intact.
- **Fact Cards for this level:**
  - *(on `fuehrerschein` mini-quest completion, non-EU path)* "If your home country doesn't have a licensing agreement with Germany, you get 6 months from your Anmeldung before your foreign license stops being valid to drive on here."
  - *(after the Schwarzfahren near-miss, ticketless)* "Real ticket inspectors in Germany are often plain-clothed, and the fine applies even if you genuinely didn't mean to ride without a valid ticket."
  - *(on the waste-sorting minigame, after a mis-sort)* "This isn't just a minigame penalty — real fines for incorrect sorting in Germany have been reported anywhere from €10 to €1,500 depending on how bad it is."
  - *(on `rundfunk_registered` stamp pickup)* "Proactively registering like you just did actually avoids a real problem: the fee gets backdated to your move-in date whether you register early or the letter finds you first."

## Level-clear condition

Complete any 3 of the 5 mini-quests above → level complete, unlocks Level 5. Uncompleted mini-quests can optionally remain available/replayable in a "free roam" sense even after clearing, since none of them gate anything later.
