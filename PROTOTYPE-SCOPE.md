# PROTOTYPE-SCOPE.md — Prototype #1

> What we are building right now. The hard scope.
> Subordinate to DESIGN-PILLARS.md. If something here contradicts the pillars,
> the pillars win — surface it.
> The Out of Scope table is **exhaustive** for Prototype #1. If a feature is on it,
> the answer is no without a chat-level decision to amend this document.

---

## What Prototype #1 is

The first playable. A co-op horde-survival run with three hunters, five enemy archetypes,
one boss, and the "Hit the Beat" parry layer — enough of the full game's loop, in one
slice, to answer whether the fusion works.

This is **not** a vertical slice of content. It is a **test of the core loop.**

---

## What we are testing

Three questions. The prototype exists to answer them with the kids' hands on the keyboard,
not on paper.

1. **Is the floor fun?** Move-only survival, no advanced systems engaged — is that alone
   joyful for the kids? *(Pillar 1, Pillar 2.)*
2. **Does the ceiling add without confusing?** Does optional "Hit the Beat" parry give a
   skilled player a real power spike *without* making a kid who ignores it feel like
   they're playing wrong? *(Pillar 1, the signature verb.)*
3. **Does the song-loop pull?** Does "play three hunters, assemble the song, walk into the
   Headliner armed" create the Hades-style "one more run" pull? *(Pillar 3.)*

If the answer to all three is yes, the prototype succeeded — regardless of how rough it
looks.

---

## In scope

### Co-op & controls
- Two-player local co-op, single shared keyboard.
  - **Player 1:** WASD to move; nearby keys (Alt / Ctrl / Space) for parry and dash.
  - **Player 2:** Arrow keys to move; Numpad for parry and dash.
  - Exact key-to-verb mapping is locked in CLAUDE.md / spec. The point here: two players,
    one keyboard, no key overlap.
- A single **shared camera, fixed wide** — framed wide enough that neither player can
  scroll the other off-screen. No dynamic zoom. No split-screen.
- Movement + one parry button + dash. No aiming, no combos.
- Input read through an **abstracted input layer** — entities read from an input source,
  never from raw key state. This is what makes gamepad support a later drop-in. Building
  the abstraction is in scope; building gamepad support is not.

### Hunters
- All three hunters: **Riya** (melee / Melody), **Bex** (ranged / Rhythm),
  **Nim** (zone / Harmony).
- Each has a differentiated base feel and an **auto-attack** appropriate to it.
  Differentiation in the hands is in scope — they are not stat-reskins.
- Each has one **signature power** unleashed by a full Hype meter — which is also their
  song-line.

### Enemies — the five archetypes

| Archetype     | Movement read                         | Telegraphed?              | Parryable?                  |
|---------------|----------------------------------------|---------------------------|-----------------------------|
| Fan           | Slow, direct, swarms                   | No                        | No                          |
| Weaver        | Fast sine-wave approach                | No                        | No                          |
| Mosher        | Winds up, lunges straight              | Yes — crouch/pull-back    | Optional — the teaching parry |
| Backup Dancer | Circles at range, lobs a slow projectile | Yes — projectile marker | Yes — parry reflects it     |
| Bouncer       | Big, slow, high-HP mini-elite; one AOE slam | Yes — slam-ring tell  | Yes                         |

The telegraph ladder (none → none → one tell → ranged tell → AOE tell) is deliberate: it
teaches parry by escalating complexity, with no tutorial.

### Boss — "The Headliner"
- One boss. **Beatable by a non-parrying player** — a straightforward HP pool, chipped down
  while repositioning. Slower and tenser that way, but winnable. *(Pillar 1.)*
- Has **2–3 named, telegraphed signature attacks.** Parrying them banks large Hype and is
  the fast, triumphant path.
- The assembled song (all three lines contributed) is what makes the fight feel decisively
  winnable. An incomplete song can still attempt it.
- Graceful failure throughout — a missed parry is a hit taken like any other, never a
  binary punish.

### The parry layer — "Hit the Beat"
- One parry button per player, acting on telegraphed attacks: Mosher lunge, Backup Dancer
  projectile, Bouncer slam, Headliner signatures.
- **Hype meter** — fills on a successful parry; a full meter triggers the hunter's
  signature power.
- A mistimed parry = no Hype, no punish. *(Pillar 1; PARRY-RESEARCH P4.)*
- The difficulty selector widens/narrows the parry window — the mechanic does not otherwise
  change. *(PARRY-RESEARCH P8.)*
- **Dash** — ported from the original game — stays as the pure-safety floor option,
  cooldown-gated.

### Run structure
- Escalating waves → a mid-run **Bouncer** elite as the "chorus" pace-change → the
  **Headliner** finale.
- A 1-of-3 **verse** pick on level-up (Vampire Survivors-style). **Flat picks — no
  evolutions** in the prototype.
- One song (three lines — one per hunter).

### Run length & difficulty
- Selectable run length: a short **~3-minute iteration** length (for fast kid-feedback
  loops) and a **~5+-minute prototype** length.
- Selectable difficulty — implemented as parry-window scaling plus enemy speed/spawn
  tuning. A simple selector, not a mode system.

### Meta-progression
- A real **SaveSystem** module — versioned save schema (a basic version field, so a future
  update does not wipe the kids' progress).
- Stores a **per-hunter song-line quality**, not a boolean. Replaying a hunter improves
  their line. A longer/harder run improves it more; any completed run always improves it.
  *(Tunable.)*
- Assembling all three lines = the complete song = the Headliner-defeating power.

### Feel & tech
- The full juice stack: screen shake, hit-pause, floating damage text, hit particles,
  combo counter, milestone banners.
- The **procedural audio engine** — ported from the original game as a standalone
  `AudioSystem` module (audio is *not* handed to Phaser). Synthesized SFX plus
  intensity-scaling music.
- Placeholder / programmer art throughout.

---

## Out of scope

**Exhaustive for Prototype #1.** Anything here is "no" without a chat-level decision to
amend this document.

| Out of scope                                   | Notes / where it goes                                                              |
|------------------------------------------------|------------------------------------------------------------------------------------|
| Gamepad / PS4–PS5 controller support           | Input layer is abstracted *for* it; the support itself is post-prototype.          |
| Online / networked multiplayer                 | Local co-op only.                                                                  |
| Split-screen                                   | Single shared camera only.                                                         |
| Dynamic camera zoom                            | Fixed wide camera for the prototype. Full-game open question.                      |
| More than 3 hunters                            | Three is the prototype cast.                                                       |
| More than 1 song                               | One song, three lines.                                                             |
| A backstage / hub world                        | Meta-progression is functional but hub-less in the prototype.                      |
| Verse evolutions (paired-pick combine)         | Flat verse picks only. Full-game open question.                                    |
| Elites beyond the Bouncer                      | The Bouncer is the only mid-run elite.                                             |
| More than 1 boss                               | The Headliner only.                                                                |
| Unparryable "red-attack" boss tier             | Contradicts optional-parry for a kids-first prototype. Parked v2 idea. *(PARRY-RESEARCH R7.)* |
| Story / dialogue / cutscenes                   | No narrative layer in the prototype.                                               |
| Final art and audio assets                     | Placeholder only.                                                                  |
| Leaderboards / high-score framing              | The original had this; the fusion is run-completion, not score-chasing. Cut.       |
| Mobile / touch controls                        | Browser + keyboard (→ gamepad later).                                              |
| Settings beyond volume, difficulty, run-length | No broader options menu.                                                           |
| Difficulty *modes*                             | A selector that scales windows/tuning — not a mode system.                         |
| Save-schema migration beyond a version field   | Just enough not to wipe progress.                                                  |
| Achievements, unlockable cosmetics             | Out.                                                                               |
| Pause-menu polish, name-entry screens          | A functional pause at most.                                                        |

---

## When uncertain

Same rule as The Ninth: if you find yourself wanting to add something not in this
document — a counter, a screen, a "quick win" — **stop and surface it.** Assume
out-of-scope until a chat-level decision says otherwise. The Out of Scope table is the
contract.

---

## Success criteria

Prototype #1 is done when:

- Two players can play a full run, on one keyboard, from start to Headliner, without an
  adult explaining the controls past one sentence each.
- A player can finish a run **never parrying once** — and it feels fine.
- A player who *does* parry well feels a clear power spike, and the Headliner fight is
  visibly shorter and more triumphant for it.
- All three hunters feel different enough that two players pick different favorites.
- The save loop works: three hunter runs assemble a song, and the assembled song
  measurably changes the Headliner fight.
- It feels good with programmer art and synthesized sound. (If it is not fun ugly, it will
  not be fun pretty.)

---

## Tech stack (locked)

- **Engine:** Phaser 3
- **Language:** TypeScript, strict mode
- **Build:** Vite
- **Platform:** Web browser only (prototype)
- **Physics:** Phaser Arcade Physics — circle overlaps, sufficient for a horde game
- **Audio:** a custom Web Audio `AudioSystem` module, ported from the original game —
  *not* Phaser audio
- **Input:** an abstracted input layer (entities read an input source, not raw keys)
- **Persistence:** a real `SaveSystem` module, versioned schema

Mirrors The Ninth's stack deliberately — two projects, one stack, every lesson transfers.

---

## What comes next

- **CLAUDE.md** — the repo's standing orders and the full file structure (the repo layout
  from earlier planning lands there). Next deliverable.
- Then: the scaffold, per CLAUDE.md.

---

<!-- PROTOTYPE-SCOPE.md v1.0 — Demon Hunters (working title), Prototype #1. Defines the
hard scope: three-question core-loop test, in-scope feature list (co-op, 3 hunters, 5 enemy
archetypes, 1 boss, the "Hit the Beat" parry layer, song-based meta-progression, ported
procedural audio), an exhaustive out-of-scope table, success criteria, and the locked tech
stack (Phaser 3 / TypeScript / Vite). Subordinate to DESIGN-PILLARS.md. Next deliverable:
CLAUDE.md. Co-authored: Brad + Claude Chat. -->
