# CLAUDE.md — Demon Hunters (working title)

> Standing orders for any Claude Code session in this repo.
> Read this file first. Then read DESIGN-PILLARS.md and PROTOTYPE-SCOPE.md
> before writing any code.

---

## What this project is

Demon Hunters (working title) is a co-op horde-survival roguelike. Vampire Survivors' loop
meets Hades' character-driven runs and meta-progression, dressed in a
K-Pop-Demon-Hunters-flavored idol-shaman fantasy. Move-only controls, an optional
timing-based parry ("Hit the Beat") as the skill ceiling, and a meta-progression where
three hunters each lay down a line of the song that brings the boss down.

We are currently building **Prototype #1**: a co-op run with three hunters, five enemy
archetypes, one boss, and the parry layer — enough of the loop, in one slice, to test
whether the fusion works. Nothing else.

This is a from-scratch rebuild. An earlier single-file version exists — `demon-hunters.html`
— and is a **reference artifact only** (see Required reading). We are not extending it; we
are replacing it.

## Required reading order

1. `DESIGN-PILLARS.md` — what the full game is. Source of truth. Non-negotiable.
2. `PROTOTYPE-SCOPE.md` — what we're building right now. The hard scope, with an
   exhaustive out-of-scope table.
3. This file — how we work in this repo.

If anything below contradicts those documents, those documents win.

**Reference artifact:** the original `demon-hunters.html`, kept at repo root. It is a
~4,000-line single-file prototype. Consult it for exactly two things: (a) **the procedural
audio engine** — the synthesized SFX and intensity-scaling music are good and are being
*ported*, not rewritten; (b) **the feel of the juice** — screen shake, hit-pause, floating
text, particles. Do **not** treat its structure as a model. Its global-variable,
draw-logic-tangled-with-game-logic shape is precisely what this rebuild exists to fix.

## Tech stack (locked)

- **Engine:** Phaser 3
- **Language:** TypeScript, strict mode (no `any`, no `@ts-ignore` without a one-line
  comment explaining why)
- **Build:** Vite
- **Platform:** Web browser only (prototype)
- **Physics:** Phaser Arcade Physics — circle overlaps, sufficient for a horde game
- **Audio:** a custom Web Audio `AudioSystem` module, ported from the original game. Audio
  is **not** handed to Phaser.
- **Input:** an abstracted input layer — see Coding conventions.
- **Persistence:** a real `SaveSystem` module, versioned schema.

Do **not** propose Unity, Unreal, Godot, Bevy, custom engines, or alternate languages. The
stack deliberately mirrors the sibling project (The Ninth) — two projects, one stack, every
lesson transfers.

## File structure

```
/demon-hunters/
├── CLAUDE.md
├── DESIGN-PILLARS.md
├── PROTOTYPE-SCOPE.md
├── README.md
├── demon-hunters.html          ← reference artifact only — do not extend
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── /src
│   ├── main.ts                 ← Phaser game config + scene registration
│   ├── /scenes
│   │   ├── BootScene.ts        ← load, init, hand off
│   │   ├── MenuScene.ts        ← hunter / song-line / difficulty / run-length select
│   │   ├── RunScene.ts         ← the horde run itself
│   │   └── ResultsScene.ts     ← end-of-run; shows the song-line improvement
│   ├── /entities
│   │   ├── Hunter.ts           ← player entity (dumb data)
│   │   ├── Demon.ts            ← enemy entity; the 5 archetypes are data-driven
│   │   ├── Boss.ts             ← the Headliner
│   │   └── Projectile.ts       ← rockets, lobs, reflected projectiles
│   ├── /systems
│   │   ├── InputSystem.ts      ← the ONLY place raw keyboard is read
│   │   ├── SpawnSystem.ts      ← waves, escalation, the elite beat
│   │   ├── EnemySystem.ts      ← enemy movement, state machines, attack triggers
│   │   ├── CombatSystem.ts     ← auto-attack, hit detection
│   │   ├── ParrySystem.ts      ← "Hit the Beat": timing windows, Hype meter, signature powers
│   │   ├── UpgradeSystem.ts    ← the 1-of-3 verse picks
│   │   ├── RunDirector.ts      ← the run arc: intro → build → drop → headliner
│   │   ├── AudioSystem.ts      ← ported procedural synth + music
│   │   ├── FeedbackSystem.ts   ← shake, hit-pause, particles, floating text, combo
│   │   └── SaveSystem.ts       ← versioned persistence; per-hunter song-line quality
│   ├── /config
│   │   ├── tuning.ts           ← ALL magic numbers + input bindings
│   │   ├── hunters.ts          ← the 3 hunters as data
│   │   ├── enemies.ts          ← the 5 archetypes + the Headliner as data
│   │   ├── songs.ts            ← the song + its 3 lines
│   │   └── upgrades.ts         ← the verse pool
│   └── /assets
│       ├── /audio              ← placeholder SFX if any (most audio is synthesized)
│       └── /sprites            ← programmer art (rectangles, circles)
├── /specs                      ← per-system specs, created in Chat as needed
└── /playtest
    └── notes.md                ← session log, filled after each playtest
```

Do not invent new top-level directories or `/src` subdirectories without proposing them in
chat first. Per-feature specs — the parry layer and the Headliner are the likely first two
— live in `/specs` and are written in Chat, not by Claude Code.

## Coding conventions

- **TypeScript strict.** No `any`. No `@ts-ignore` without a one-line comment explaining why.
- **ECS-flavored.** Entities (`Hunter`, `Demon`, `Boss`, `Projectile`) are dumb data.
  Systems own behavior. Don't fold game logic into Phaser GameObjects, and don't fold it
  into the entities either.
- **Simulation is separate from rendering.** Systems simulate; rendering reads from state.
  The original game tangled draw calls into game logic — do not reproduce that.
- **Content is data, not code.** The 3 hunters, the 5 enemy archetypes, the boss, the song,
  and the verse pool live as data in `/config`. Adding or changing content means editing a
  data file — never surgery inside a system. This is the single most important lesson
  carried over from the original's ~4,000-line god-file. If you find yourself writing a
  `switch` on hunter type or enemy type inside a system, stop — that data belongs in
  `/config`.
- **All magic numbers live in `/src/config/tuning.ts`.** Never inline. If a number feels
  "too small to deserve a constant," put it in tuning.ts anyway — Brad needs every dial in
  one file. Input bindings live here too.
- **Input is abstracted.** Raw keyboard state is read in exactly one place: `InputSystem`.
  Entities and other systems read an *input source* — an intent: move vector, parry
  pressed, dash pressed — never `keys[...]` directly. This is what makes gamepad support a
  later drop-in instead of a rewrite. Building the abstraction is in scope; building
  gamepad support is not.
- **Event-driven coupling** between systems where reasonable. Phaser's emitter is fine —
  don't bring in a separate event lib.
- Comments explain *why*, not *what*. The code says what.
- Functions: small, named, single responsibility. Past ~40 lines, a function probably
  wants splitting.
- Avoid premature abstraction. Two callsites isn't enough to extract; three is.

## Controls (Prototype #1)

Two players, one shared keyboard. Each player needs: move + parry + dash. Bindings live in
`tuning.ts`; the locked mapping is:

|              | Move        | Parry ("Hit the Beat") | Dash         |
|--------------|-------------|------------------------|--------------|
| **Player 1** | W A S D     | Space                  | Left Ctrl    |
| **Player 2** | Arrow keys  | Numpad 0               | Numpad Enter |

Notes:
- Input handling must `preventDefault` — Space scrolls the page, Ctrl-combos can hit
  browser shortcuts. The original handled this; carry it over.
- If a browser/OS key conflict surfaces in playtest, the *binding* changes — it's one line
  in `tuning.ts`. The abstraction does not change.
- Assumes a keyboard with a numpad. If the kids' hardware lacks one, surface it — the
  Player 2 binding is the thing that moves.
- A third action key per player is reserved (Left Alt / Numpad Decimal) but unused in
  Prototype #1. Do not wire it to anything without a chat-level decision.

## Scope discipline

- **Build only what's in PROTOTYPE-SCOPE.md.** If you find yourself wanting to add
  something not in scope — a counter, a screen, a "quick pause feature," a second elite —
  stop. Surface it to Brad in chat. Get an explicit green-light.
- The **Out of Scope table in PROTOTYPE-SCOPE.md is exhaustive** for Prototype #1. If a
  feature is on that table, the answer is no without a chat-level decision to amend the
  document.
- When uncertain whether something is in scope: assume no, and ask.
- **The kids-first pillar is a scope constraint, not just a vibe.** A change that makes the
  *floor* — move-and-survive — harder, scarier, or more punishing contradicts
  DESIGN-PILLARS Pillar 1. Treat it as out of scope even if it looks like a small
  improvement. Depth goes in the ceiling, never the floor.

## How to run / test

```
npm install
npm run dev         # Vite dev server, localhost
npm run build       # production build
npm run typecheck   # tsc --noEmit, run before any commit
```

Match these script names when you create `package.json`.

## Testing approach

- No automated test framework for Prototype #1. The test is human playtesting — and there
  are **two playtesters**, with different skill levels and reach.
- Console-log-driven debugging is fine. Remove logs before considering a session "done."
- If a system gets complex enough that a unit test would genuinely help — `ParrySystem`'s
  timing-window math is the obvious candidate — write one. Use Vitest. Don't go
  test-framework-heavy.

## Commit conventions

- One concern per commit. Tuning changes are their own commits, with the before/after
  numbers in the message.
- Commit message format: `<area>: <change>`
  - `scaffold: first boot of empty RunScene`
  - `parry: widen Rookie window from 200ms to 240ms`
  - `enemies: add Bouncer slam telegraph`
  - `audio: port sword SFX from original`
  - `save: version the song-line schema`
- Don't commit broken builds. `npm run typecheck` passes before commit.
- Don't change tuning numbers and gameplay logic in the same commit — separate them so
  Brad can revert tuning without losing logic.

## Playtest discipline

- After a playtest, Brad updates `/playtest/notes.md`.
- Read the latest playtest notes before proposing tuning changes.
- Propose tuning from playtest evidence, not from your own intuition.
- There are two playtesters. **Their feedback may conflict — that is signal, not noise.**
  A mechanic one finds "fun" while the other finds "tense" is the design working as
  intended (DESIGN-PILLARS Pillar 1; the same-mechanic-two-profiles target). Don't average
  conflicting feedback into mush — surface the split.

## What you (Claude Code) should NOT do

- Don't add features not in PROTOTYPE-SCOPE.md without chat-level approval.
- Don't add libraries without proposing in chat first. The dependency tree stays small.
- Don't restructure the file layout without proposing.
- Don't inline content data into systems. Hunters, enemies, the boss, songs, and verses
  stay in `/config`.
- Don't read raw keyboard state anywhere except `InputSystem`.
- Don't change tuning numbers and gameplay logic in the same commit.
- Don't write extensive tests, type infrastructure, or "future-proofing" that Prototype #1
  doesn't need. Gamepad support is the standing example: build the input *abstraction*; do
  not build gamepad handling.
- Don't compose new music or generate art assets. The `AudioSystem` is a **port** of the
  original's existing procedural engine — that is the task; writing new music is not. Art
  is programmer art.
- Don't push commits without `npm run typecheck` passing.

## Workflow note

This is a **Chat-then-Code** project, like the sibling project (The Ninth): Claude Chat is
the architect — design forks, system design, specs — and Claude Code is the executor. The
two design documents and this file were produced in Chat before any code.

It runs **lighter ceremony than The Ninth.** The distinction matters:

- **Mandatory — these are disciplines, not ceremony:** design-doc-first; the `tuning.ts`
  rule; scope discipline against PROTOTYPE-SCOPE.md; content-as-data in `/config`; the
  input abstraction.
- **Lighter — the process ceremony relaxes:** we are *not* front-loading an exhaustive
  sub-spec for every feature before it can be built. Specs get written in Chat for the
  genuinely complex systems (the parry layer and the Headliner are the likely first two);
  simpler features can go straight from PROTOTYPE-SCOPE.md to code.
- **Weighted by phase:** Chat is heavy *now*, during planning and scaffolding. Once the
  scaffold exists and specs are in place, Claude Code can run more autonomously *within*
  PROTOTYPE-SCOPE.md — reserve Chat for new forks, blocked problems, and anything that
  touches the out-of-scope table.

We are running **one Claude Code session in one repo.** We will add a second seat only when
edit contention is observed in practice. Do not propose splitting into multiple repos or
worktrees during Prototype #1.

---

<!-- CLAUDE.md v1.1 — Demon Hunters (working title). Repo standing orders for Claude Code:
project summary, required reading order (DESIGN-PILLARS.md → PROTOTYPE-SCOPE.md → this
file), locked tech stack (Phaser 3 / TypeScript / Vite), full file structure, coding
conventions (ECS-flavored, content-as-data, abstracted input, tuning.ts discipline), the
locked two-player co-op control mapping, scope/commit/playtest discipline, and the
lighter-ceremony Chat-then-Code workflow note. The original demon-hunters.html is retained
as a reference artifact for the audio port and juice feel only. v1.1 amendment: added
EnemySystem.ts to the file structure (enemy movement, state machines, attack triggers) —
introduced during the enemy archetypes build (step 4) and ratified in chat, as the enemy
behavior code belongs neither in SpawnSystem nor CombatSystem. Co-authored: Brad + Claude
Chat. -->
