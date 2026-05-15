# COMBAT-BRIEF.md — Claude Code Task: CombatSystem + Dummy Target

> A task brief for Claude Code — build step 3.
> Read CLAUDE.md, then DESIGN-PILLARS.md, then PROTOTYPE-SCOPE.md, then
> specs/HUNTER-SPEC.md before starting. This brief is subordinate to all of
> them — HUNTER-SPEC.md in particular is the source of truth for what the
> three auto-attacks are.
> This is a scope-bounded task. The "Not in this task" section is binding —
> if you find yourself reaching past it, stop and surface it in chat.

---

## Goal

Build `CombatSystem`: the three hunters' auto-attacks, nearest-enemy targeting,
hit detection, and damage application — verified against **one stationary dummy
target**. After this task, the two squares can attack, a thing can be hit, and it
can take damage and react.

This is the load-bearing combat task. The five real enemy archetypes and
`SpawnSystem` are the **next** brief — deliberately split off so `CombatSystem`
can be proven in isolation against a trivial target before real enemies are built
on top of it. Same reasoning that made the scaffold "one square" before co-op.

## Why this shape

`HUNTER-SPEC.md` fully specifies *what* the three auto-attacks are — the weapon
triangle, nearest-enemy targeting, the data shape in `hunters.ts`. It explicitly
deferred *how they are built* to "the combat/enemy brief." This is that brief, for
the combat half. The enemy half is split out so a problem in the build is
obviously a combat problem or an enemy problem, never an ambiguous tangle.

The dummy target exists only to give the auto-attacks something to hit, target,
and damage. It is not an enemy archetype, has no AI, and is thrown away (or
absorbed) when the real enemy brief lands.

---

## In scope for this task

### 1. `src/config/hunters.ts` — populate it for real

`HUNTER-SPEC.md §5` defines the data shape. This task fills it in for all three
hunters:

- **Identity:** id, working name, song-line — for Riya, Bex, Nim.
- **Auto-attack:** weapon kind and the three triangle values. Per HUNTER-SPEC,
  weapon kind distinguishes melee-arc (`sword`, `staff`) from projectile
  (`stars`). The triangle values are best expressed as the relative multipliers
  from HUNTER-SPEC §2 (off Riya = 1.0 baseline) so the triangle stays readable as
  a triangle.
- **Signature:** a power *identifier* per hunter (Riya → Breakdown, Bex → Drop,
  Nim → Bridge). This task does **not** implement the powers — see "Not in this
  task" — but the identifier must exist in the data so `hunters.ts` is complete
  and the type is stable. A power that is referenced-but-not-implemented should be
  an explicit, typed "not yet implemented" state, not a silent gap.

Per CLAUDE.md content-as-data: all per-hunter difference lives here. No
`if (hunter.id === ...)` anywhere in `CombatSystem`.

### 2. `tuning.ts` — the combat baseline numbers (provisional)

`HUNTER-SPEC.md §2` left Riya's baseline *absolutes* to be set when `CombatSystem`
is built. Set them now, **provisionally**:

- Riya's baseline attack interval (ms), baseline range (px), baseline damage per
  hit — the `1.0×` anchors the triangle multipliers resolve against.
- These are **provisional** and must be clearly marked as such in `tuning.ts` —
  a comment like `// PROVISIONAL — retune against real enemy HP (enemy brief)`.
  They are being set against a placeholder dummy with placeholder HP; real
  balance is a playtest job once enemies exist. Do not agonize over them — pick
  sensible values that make the dummy take a few hits to kill, and move on.
- Bex's and Nim's effective values fall out of the multipliers — they are not
  separate hand-set numbers. Resolve `effective = baseline × multiplier` in code,
  not by hand in the table.
- The dummy target's HP and size are also `tuning.ts` values, also marked
  provisional.

### 3. `CombatSystem` — the real work

`CombatSystem` owns all auto-attack behavior. Per CLAUDE.md ECS-flavored
conventions: it is a system that operates on entities; entities stay dumb data.

**Targeting — nearest enemy (HUNTER-SPEC §2):**
- Each hunter's auto-attack targets the nearest valid target within its range, by
  straight-line distance.
- The player never aims — this is automatic. Keep the move-only promise intact.
- If no target is in range, the attack does not fire (a harmless idle flourish is
  optional and a `CombatSystem` call, not a requirement).
- Tie-breaking: any stable rule is fine; this is not balance-sensitive.
- For this task, "valid target" = the dummy target(s). Write the targeting so that
  "what counts as a target" is not hard-wired to the dummy — the enemy brief will
  add real targets and should not require rewriting targeting. But do **not** build
  speculative target-type machinery; just don't hard-code the dummy as the only
  possible target.

**The two attack behaviors — general, parameterized by data:**

There are exactly two implementations, not three. Per HUNTER-SPEC §5: one
melee-arc behavior, one projectile behavior, each parameterized by the hunter's
data.

- **Melee arc** (Riya's sword, Bex's staff): on each attack tick, a swing oriented
  toward the current nearest target. It connects with targets within the hunter's
  range in the arc's direction. Arc width, range, interval, and damage all come
  from data/tuning — Riya and Bex run the *identical* code path, differing only in
  their numbers. Whether the arc is a true wedge or a simpler range check in the
  facing direction is your implementation call — keep it simple, keep it readable,
  and keep every number in `tuning.ts`.
- **Projectile** (Nim's stars): on each attack tick, a projectile spawned toward
  the current nearest target, traveling until it hits a target or leaves the arena.
  Uses the existing `Projectile` entity (currently a stub from the scaffold —
  this task makes it real). Projectile speed, range/lifetime, interval, and damage
  come from data/tuning.

**Hit detection and damage:**
- Arcade Physics circle overlaps are the expected mechanism (CLAUDE.md tech stack)
  — a swing or projectile overlapping a target's body is a hit.
- A hit applies the hunter's damage to the target. Damage, HP, and the subtraction
  live as data/logic; no inlined numbers.
- A target at zero HP is removed cleanly (no leaks, no dangling references). For
  the dummy, "removed" can simply respawn it after a moment, or leave it removed —
  your call; the point is that the death path works and is clean.
- **Per-attack cadence:** each hunter fires on its own interval (from data). The
  attack is automatic and time-driven — not tied to frame rate. Use delta time.

**Co-op:**
- Both hunters auto-attack independently and simultaneously, each targeting its
  own nearest target, each on its own interval. No P1/P2 branching — the system
  iterates the `hunters[]` array exactly as the movement step does.

### 4. The dummy target

- **One stationary target entity**, placed in `RunScene`. A solid-color
  primitive, visually distinct from both hunter squares.
- It has HP (from `tuning.ts`, provisional). It does not move. It has no AI, no
  attacks, no telegraphs — it cannot hurt the hunters.
- It exists solely so auto-attacks have something to target, hit, and kill.
- It should take a few hits to die, so the death path and hit feedback are
  observable.
- Implement it in the existing `Demon` entity stub if that is clean, or as a
  minimal separate dummy — your call. If you use `Demon`, keep it minimal: this is
  a dummy, not the first archetype, and the enemy brief owns the real `Demon`
  shape. Do not pre-build archetype structure.
- Optionally allow a few dummies rather than one, if that makes targeting and
  co-op easier to verify — but keep it trivial.

### 5. Minimal hit feedback

Enough feedback to *see* a hit land — this task is verified by watching combat
work, so a hit must be visible.

- A hit should produce a minimal visible response: a flash, a tint, a tiny
  knockback, a hit indicator — something. Keep it minimal.
- This is **not** the juice task. `FeedbackSystem` stays a stub. Do not build
  screen shake, hitstop, particles, floating damage numbers, or the combo system —
  that is a dedicated later brief. Just make a hit legible enough to confirm the
  system works.
- If the minimal feedback naturally wants a home, a *small* start to `CombatSystem`
  emitting hit events is fine — but do not build out `FeedbackSystem`.

---

## Not in this task — binding

Do not build any of the following. If the task seems to call for one, stop and
surface it in chat.

- **No enemy archetypes.** Fan, Weaver, Mosher, Backup Dancer, Bouncer — none of
  them. The dummy target is not an archetype and must not be built like one. The
  five archetypes are the **next** brief.
- **No `SpawnSystem`.** It stays a stub. The dummy is placed directly in
  `RunScene`, as the squares were.
- **No enemy AI, movement, attacks, or telegraphs.** The dummy is inert.
- **No signature power implementations.** Riya's Breakdown, Bex's Drop, Nim's
  Bridge — the *identifiers* go in `hunters.ts` (in scope), the *behaviors* do not.
  `ParrySystem` stays a stub.
- **No parry, no Hype, no dash behavior.** Those intents still exist unconsumed.
  `ParrySystem` is a future brief (`HIT-THE-BEAT-SPEC.md`).
- **No `FeedbackSystem` build.** Minimal hit legibility only (§5) — no shake, no
  hitstop, no particles, no floating numbers, no combo.
- **No `RunDirector`, no waves, no run arc.** Stub.
- **No audio.** `AudioSystem` stays a stub.
- **No `SaveSystem`, no `UpgradeSystem`, no menu/character select.** Stubs.
- **No enemy HP balancing pass.** The provisional numbers are provisional on
  purpose. Do not tune them against anything — there is nothing real to tune
  against yet.
- **No new directories**, and no new files beyond what `CombatSystem`, the real
  `Projectile`, and the dummy strictly need. Propose in chat first if the
  structure seems to need something new.
- **No automated tests.** Still human-playtest only per CLAUDE.md.

---

## Definition of done

- `npm run dev` boots to `RunScene`: two hunter squares, one dummy target, no
  console errors.
- Both hunters auto-attack on their own intervals, automatically targeting the
  nearest target — no attack button, no aiming.
- Riya and Bex swing melee arcs; Nim throws projectiles. Riya and Bex run the same
  melee code path; the difference between them is entirely data.
- A hit is visible (minimal feedback) and applies damage; the dummy dies cleanly
  at zero HP.
- All three auto-attacks differ in feel per the weapon triangle — observably
  different interval, range, and damage — and every one of those numbers lives in
  `tuning.ts`.
- `hunters.ts` is fully populated for all three hunters (identity, auto-attack,
  signature identifier) and no system contains per-hunter `if`/`switch` logic.
- Provisional baseline combat numbers are in `tuning.ts`, clearly marked
  provisional.
- Co-op holds: both hunters attack independently and simultaneously; the system
  iterates `hunters[]` with no P1/P2 branching.
- `npm run build` succeeds.
- `npm run typecheck` passes clean — strict mode, no `any`, no `@ts-ignore`
  without a one-line reason comment.

## Commits

Follow CLAUDE.md's `<area>: <change>` format, one concern per commit. A reasonable
shape — use judgment, keep them separable. Per CLAUDE.md, keep tuning-number
commits separate from logic commits:

- `content: populate hunters.ts — three hunters, weapon triangle data`
- `tuning: provisional combat baseline numbers + dummy target values`
- `combat: nearest-enemy targeting`
- `combat: melee-arc auto-attack (Riya, Bex)`
- `combat: projectile auto-attack (Nim) + real Projectile entity`
- `combat: hit detection, damage, clean death path`
- `combat: minimal hit feedback`
- `scaffold: stationary dummy target in RunScene`

`npm run typecheck` passes before every commit. Do not commit a broken build.
Local commits only — do not push.

## When done

Report back in chat: confirm the definition-of-done checklist, note anything that
fought the structure or any point where the docs were ambiguous, and flag the
in-browser check that needs Brad's eyes — the thing this task is really verified
by: do the three auto-attacks *feel* distinct, do they target sensibly, does a
hit read clearly. Then stop. The next task — the five enemy archetypes and
`SpawnSystem` — will be briefed separately.

---

<!-- COMBAT-BRIEF.md v1.0 — Claude Code task brief for Demon Hunters (working
title) Prototype #1, build step 3. Scope: CombatSystem — populate hunters.ts with
the three-hunter weapon-triangle data, provisional baseline combat numbers in
tuning.ts, nearest-enemy auto-targeting, two parameterized attack behaviors
(melee-arc for Riya/Bex, projectile for Nim) with the Projectile entity made
real, hit detection + damage + clean death, minimal hit feedback, all verified
against one stationary inert dummy target. Explicitly excludes the five enemy
archetypes and SpawnSystem (the next brief), enemy AI, signature power
implementations, parry/Hype, FeedbackSystem juice, RunDirector, audio, and any
balance pass on the provisional numbers. Subordinate to CLAUDE.md,
DESIGN-PILLARS.md, PROTOTYPE-SCOPE.md, HUNTER-SPEC.md. Co-authored: Brad + Claude
Chat. -->
