# The Front Door — Title Screen, Intro & Instructions

Everything that happens between launching the game and the player gaining control at the start of [Level 1](level-1-arrival.md). This is the game's first impression, so it has to land all three of the game's pillars — **funny, interactive, informative** — before the player has even moved. See [fun-and-frustration-systems.md](fun-and-frustration-systems.md) for the three global systems this screen introduces.

---

## 1. Title Screen

### Visual
- The **"KAFKALAND"** wordmark in chunky pixel-art lettering, with a small subtitle underneath: *"a survival guide to moving to Nuremberg."*
- The **Bunny** (the existing player character sheet, `assets/Sprites/Characters/Bunny/`) stands idle in the foreground, doing its idle-breathing animation, a small cardboard suitcase beside it.
- Behind it, a village silhouette assembled from the existing tilesets (`assets/Tileset/` — grass, nature trees/pines, and the house/shop fronts) with a couple of ambient Chicken/Cow sprites wandering the background — establishing the art language immediately.
- Soft, looping chiptune "village" theme. Deliberately cheerful, to contrast with the bureaucratic pain the game is actually about (the joke starts before the player presses a button).

### Menu options
- **Start** — begins the Intro (section 2).
- **How to Play** — opens the Instructions screen (section 3); also reachable any time from the pause menu.
- **Codex** — grayed out initially with the label *"unlocks as you play"*; becomes selectable the moment the player has logged their first Fact Card (see the Codex in [fun-and-frustration-systems.md](fun-and-frustration-systems.md)). This is the browsable, always-available reference that also hosts wiki page 23's glossary.
- **Credits** — short; credits the asset pack (`assets/LICENSE.txt`) and the wiki this game is built from.

---

## 2. Intro

A handful of short narrative panels — **not** a full cutscene engine. Reuse the paper-document / stamped-card visual language already established for the `DOCUMENTS` pickups (see `makeDocumentMesh` in `src/world.js`): each panel reads like a page in a little travel dossier, advanced with the interact key. Keep each panel to one or two lines. Target ~5 panels so it never overstays.

The premise is deliberately **generic across all visa routes** (the wiki covers EU citizens, workers, students, family, freelancers — the intro must not pin the player to one, or it'll contradict later content). The player is simply "someone who decided to move to Nuremberg." Why is left to the player's imagination.

**Suggested panel beats (tone reference, adjust wording freely):**

1. *"You did it. You got the visa / the offer / the nerve. You're moving to Germany."* — warm, aspirational open.
2. *"Specifically: Nuremberg. Bavaria. Bratwurst, castles, and — you'll find out — an astonishing amount of paperwork."* — the first joke.
3. **The tone-setter (funny → true, in one beat):** *"How hard can settling in be? …In a 2025 expat survey, internationals ranked Germany dead last, 46th of 46, for 'ease of settling in.' You're going to be fine. Probably."* — a real stat from the wiki (InterNations Expat Insider, cited on [07-auslanderbehorde-residence-permit.md](../wiki/07-auslanderbehorde-residence-permit.md)), delivered with a smirk. This panel is the whole game's thesis: it's going to be funny AND real. It doubles as the player's very first taste of the Fact Card voice.
4. *"Rule one: register your address within 14 days of moving in. Miss it and it's a fine up to €1,000. Write that down."* — plants the Level 1 objective before the player is even in Level 1, so arriving with a goal already in mind feels earned.
5. *"Okay. Deep breath. Here comes the train."* — the Bunny walks right, boards a pixel train that pulls off-screen; hard-cut / fade into the How to Play screen, then Level 1's Opening Beat. This physically matches Level 1's spawn (arriving at the station), so the intro and the level are one continuous motion.

> Design note: the Intro should be **skippable** on replays (a "hold to skip" prompt), but never skippable-by-default on a first run — the stat in panel 3 is load-bearing for the game's tone.

---

## 3. How to Play / Instructions

A single, scannable screen (or 2–3 small tabbed cards) shown once automatically after the first Intro, and revisitable any time via **How to Play** on the title/pause menu. It teaches four things:

### A. Controls
| Action | What it does |
|---|---|
| **Move** (arrow keys / WASD / d-pad) | Walk the Bunny around the map (4-directional, top-down — matches the existing `src/input.js` + `src/player.js` movement). |
| **Interact** (e.g. Space / A) | Talk to NPCs, open office doors, pick up documents, advance dialogue, dismiss a Fact Card. |
| **Backpack** (e.g. Tab / Y) | Open your inventory of collected documents (the existing 5-slot backpack, `BACKPACK_SLOTS` in `src/map.js`). |
| **Vent / Punch** (e.g. F / X) | The frustration-release action — whack a nearby punchable prop (see the Vent Mechanic). Works any time, on any tree/prop, for no reason at all. |
| **Dismiss** (Interact or move away) | Clear a Nag Event prompt or a Fact Card — nothing ever hard-blocks you. |

### B. The creatures you'll meet (hazard legend)
So the visual vocabulary is learned once, up front, and never needs re-explaining:
- 🦇 **Bat = "Processing Delay."** It'll stun/slow you briefly. Annoying, not dangerous.
- 🟢 **Slime = "Bureaucratic Friction."** Conflicting information, red tape, forms that beget forms. Gets in your way; won't kill you.
- 🐔🐄 **Chickens & Cows = just vibes.** Ambient village life. Harmless. Occasionally startled.

### C. The three things that make this game *this* game
One line each — enough to recognize them on sight in Level 1, not enough to spoil the jokes:
- **Nag Events** — German admin will interrupt you at random, forever. One certain letter-carrier in particular. You'll see.
- **The Vent Mechanic** — a Frustration meter fills as things go wrong. Real life gives you nowhere to put that feeling. This game gives you a tree. Use it.
- **Fact Cards** — every so often the game tells you one *true, specific* thing about actually moving to Nuremberg. They're real. They go in your Codex. By the end you'll have accidentally read a guide.

### D. The journey ahead (roadmap)
A small 5-stop map graphic — adapt the dependency-map style already in the root [README.md](../README.md) — so the player sees the whole shape at a glance:

```
①  ARRIVE          →  ②  MONEY,        →  ③  THE            →  ④  GETTING     →  ⑤  FAMILY
   & register          HEALTH,             AUSLÄNDER-           AROUND &          & FOREVER
   your address        TAXES               BEHÖRDE (boss!)      settling in       (the long game)
```

Exit button: **"Got it →"** — hands off directly into Level 1's **Opening Beat** (see [level-1-arrival.md](level-1-arrival.md)).

---

## Flow summary

```
Launch ─▶ Title Screen ─▶ [Start] ─▶ Intro (5 panels, train departs)
                                          │
                                          ▼
                              How to Play screen ─▶ [Got it]
                                          │
                                          ▼
                              LEVEL 1 — Opening Beat (player gains control)
```
