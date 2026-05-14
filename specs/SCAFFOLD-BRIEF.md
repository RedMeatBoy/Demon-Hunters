# SCAFFOLD-BRIEF.md — Claude Code Task: Scaffold + One Moving Square

> A task brief for Claude Code — the first build step.
> Read CLAUDE.md, then DESIGN-PILLARS.md, then PROTOTYPE-SCOPE.md before
> starting. This brief is subordinate to all three.
> This is a scope-bounded task. The "Not in this task" section is binding —
> if you find yourself reaching past it, stop and surface it in chat.

---

## Goal

Stand up the repo skeleton from CLAUDE.md's file structure, get a Phaser 3 game
booting cleanly to `RunScene`, and prove the `InputSystem` abstraction with **one
player-controlled square** moving in that scene.

This is the project's first commit set. Its job is to prove the toolchain and the
single most load-bearing abstraction (`InputSystem`) — not to be fun, not to be a
game. One square moving is the entire gameplay target of this task.

## Why this shape

Per CLAUDE.md, raw keyboard state is read in exactly one place — `InputSystem` —
and every entity reads an *intent*, never raw keys. That abstraction is what makes
co-op and (later) gamepad support a drop-in instead of a rewrite. A scaffold that
booted to an empty scene would leave it an untested stub. One moving square forces
`InputSystem` to be real and exercised, while keeping the commit small and
reviewable. Player 2 / co-op is a deliberate, clean follow-up task — not part of
this brief.

---

## In scope for this task

### 1. Project root + toolchain
- `package.json` — with the exact script names from CLAUDE.md: `dev`, `build`,
  `typecheck`. Dependencies: Phaser 3, TypeScript, Vite. Nothing else — the
  dependency tree stays small (CLAUDE.md).
- `tsconfig.json` — TypeScript **strict mode** on.
- `vite.config.ts` — minimal, browser target.
- `index.html` — the Vite entry; a single canvas mount point.
- `README.md` — brief: what the project is (one line), the required reading order,
  and the three run commands. Point at CLAUDE.md for everything else; do not
  restate it.
- `.gitignore` — `node_modules`, Vite build output, the usual.

### 2. The file skeleton
Create the full `/src` structure from CLAUDE.md's file-structure section. Every
file from that layout exists. Files not used by this task are **minimal valid
stubs** — a typed export that compiles under strict mode, with a one-line comment
naming the file's eventual responsibility. Do not write speculative
implementation into stubs.

- `main.ts` — real: Phaser game config, registers scenes.
- `/scenes` — `BootScene`, `MenuScene`, `RunScene`, `ResultsScene` all exist.
  `BootScene` and `RunScene` are real to the extent this task needs (below);
  `MenuScene` and `ResultsScene` are stubs that compile.
- `/entities` — `Hunter`, `Demon`, `Boss`, `Projectile` all exist. `Hunter` is
  real to the minimal extent below; the rest are stubs.
- `/systems` — all nine from CLAUDE.md exist. `InputSystem` is real (below).
  All others are stubs.
- `/config` — `tuning.ts` is real (below). `hunters.ts`, `enemies.ts`, `songs.ts`,
  `upgrades.ts` exist as stubs — typed, empty-or-minimal, compiling.
- `/assets` — the `/audio` and `/sprites` directories exist (a `.gitkeep` is fine).
  No assets are created. The square is drawn as a Phaser primitive or solid-color
  rectangle, not a sprite asset.
- `/specs` and `/playtest` — `/specs` already holds the spec docs;
  `/playtest/notes.md` exists with a session-log header ready to fill.

### 3. The boot path — real
- The game boots through `BootScene` and lands in `RunScene` with no console
  errors and no uncaught exceptions.
- `RunScene` sets up the **fixed-wide shared camera** described in
  PROTOTYPE-SCOPE.md — framed wide. (Only one square exists in this task, but
  establish the camera as fixed-wide now; do not build dynamic zoom — it is out
  of scope per PROTOTYPE-SCOPE.md.)
- A plain background — flat color is fine. No art.

### 4. `InputSystem` — real, and built correctly
- `InputSystem` is the **only** place `keydown`/`keyup` or Phaser keyboard state
  is touched. This is a hard CLAUDE.md rule and the main point of this task.
- It exposes a per-player **intent** — at minimum a movement vector. Parry and
  dash intents may be defined in the intent shape now (they are read from
  `tuning.ts` bindings) but nothing consumes them yet — that is fine and expected.
- Player 1's bindings are read from `tuning.ts` (WASD per CLAUDE.md). Player 2's
  bindings can exist in `tuning.ts` already, but **no Player 2 entity is created
  in this task.**
- `preventDefault` is handled so the page does not scroll / trigger browser
  shortcuts — CLAUDE.md calls this out specifically.
- Design the intent interface so a second player, and later a gamepad source, are
  additive — but **do not build** either. The abstraction is in scope; the second
  consumer is not.

### 5. `Hunter` entity + the moving square — minimal
- `Hunter` is a dumb-data entity per CLAUDE.md's ECS-flavored convention — it does
  not read input itself and owns no movement logic.
- One `Hunter` instance exists in `RunScene`, drawn as a solid-color square
  (Phaser primitive — no sprite asset).
- A minimal movement step — read the Player 1 intent from `InputSystem`, apply
  movement — moves the square. Whether the thin movement glue lives in `RunScene`
  for now or in a minimal `CombatSystem`/movement seam is your call; keep it small,
  named, and clearly temporary, and do not fold movement logic into the `Hunter`
  entity.
- Movement speed is a value in `tuning.ts`. No inlined magic numbers — CLAUDE.md.

### 6. `tuning.ts` — real, seeded
- Exists and is the home for every number this task introduces: movement speed,
  canvas/camera dimensions, the input bindings (P1 and P2).
- Structure it so it is readable as "the dial board" — CLAUDE.md's intent is that
  Brad can find every dial in one file.

---

## Not in this task — binding

Do not build any of the following. If the task seems to call for one, stop and
surface it in chat.

- **No Player 2, no co-op.** P2 bindings may sit in `tuning.ts`; no P2 entity, no
  second square, no co-op camera logic. This is the very next task — keep it clean
  for that task to pick up.
- **No gameplay systems.** `SpawnSystem`, `CombatSystem` (beyond the minimal
  movement seam noted above), `ParrySystem`, `UpgradeSystem`, `RunDirector`,
  `SaveSystem`, `FeedbackSystem` stay as stubs.
- **No enemies, no boss, no projectiles.** Those entities exist only as stubs.
- **No parry layer.** `HIT-THE-BEAT-SPEC.md` is a future task. Parry/dash *intents*
  may exist in the input shape, unconsumed; nothing more.
- **No audio.** `AudioSystem` is a stub. The procedural-audio port is its own
  task; do not start it here.
- **No content data.** `hunters.ts`, `enemies.ts`, `songs.ts`, `upgrades.ts` are
  stubs. The one `Hunter` instance this task needs can be constructed minimally
  without a populated `hunters.ts`.
- **No menu / results flow.** `MenuScene` and `ResultsScene` are stubs; the boot
  path goes straight to `RunScene` for now.
- **No juice.** No screen shake, hitstop, particles, floating text — `FeedbackSystem`
  is a stub.
- **No art or audio assets.** Programmer-art primitives only.
- **No test framework.** Per CLAUDE.md, no automated tests yet — and `ParrySystem`'s
  timing math, the one likely early unit-test candidate, does not exist yet anyway.
- **No new directories or files** beyond CLAUDE.md's layout. If the structure seems
  to need something new, propose it in chat first.

---

## Definition of done

- `npm install` then `npm run dev` boots the game; it lands in `RunScene` with no
  console errors.
- One solid-color square is visible and moves under Player 1's WASD input.
- All keyboard reading lives in `InputSystem`; the `Hunter` entity reads an intent,
  not keys; the entity owns no movement logic.
- The full CLAUDE.md `/src` file structure exists — real files where this brief
  says real, compiling stubs everywhere else.
- Every number introduced lives in `tuning.ts`. No inlined magic numbers.
- `npm run build` succeeds.
- `npm run typecheck` passes clean — strict mode, no `any`, no `@ts-ignore`
  without a one-line reason comment.
- `/playtest/notes.md` exists with a ready-to-fill header.

## Commits

Follow CLAUDE.md's `<area>: <change>` format, one concern per commit. A reasonable
shape — use judgment, but keep them separable:

- `scaffold: project root, toolchain, npm scripts`
- `scaffold: /src file skeleton with stubs`
- `scaffold: Phaser boot to empty RunScene + fixed-wide camera`
- `input: InputSystem keyboard abstraction + P1 intent`
- `scaffold: Hunter entity + one input-driven moving square`

`npm run typecheck` passes before every commit. Do not commit a broken build.

## When done

Report back in chat: confirm the definition-of-done checklist, note anything that
fought the structure or any point where CLAUDE.md / the specs were ambiguous, and
stop. The next task — adding Player 2 and co-op — will be briefed separately. Do
not start it.

---

<!-- SCAFFOLD-BRIEF.md v1.0 — Claude Code task brief for Demon Hunters (working
title) Prototype #1, build step 1. Scope: repo skeleton from CLAUDE.md's file
structure + Phaser 3 boot to RunScene + the real InputSystem keyboard abstraction
+ one Player-1-controlled moving square. Explicitly excludes Player 2/co-op (the
next task), all gameplay systems, enemies, the parry layer, audio, content data,
juice, and assets. Subordinate to CLAUDE.md, DESIGN-PILLARS.md, PROTOTYPE-SCOPE.md.
Co-authored: Brad + Claude Chat. -->
