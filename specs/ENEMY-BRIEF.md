# ENEMY-BRIEF.md — Claude Code Task: Five Enemy Archetypes + SpawnSystem

> A task brief for Claude Code — build step 4.
> Read CLAUDE.md, then DESIGN-PILLARS.md, then PROTOTYPE-SCOPE.md, then
> specs/HIT-THE-BEAT-SPEC.md before starting. This brief is subordinate to all
> of them.
> This is a scope-bounded task. The "Not in this task" section is binding —
> if you find yourself reaching past it, stop and surface it in chat.

---

## Goal

Build the five enemy archetypes and `SpawnSystem`. After this task there is a
real horde: five visibly distinct enemy types with their own movement behavior,
spawning into `RunScene` over time, able to damage the hunters — and the hunters'
auto-attacks (built last task) cut them down.

This is the task that turns "two hunters and a dummy" into a game with something
to fight.

## Why this shape

The combat brief built `CombatSystem` against an inert dummy. This brief replaces
the dummy with real enemies. It is deliberately scoped to **enemies only** —
`ParrySystem`, the Hype meter, and the parry interaction are a separate later
brief. Three of the five archetypes have attacks that *will become* parryable;
this brief builds those attacks and their **body-animation tells**, but the
attacks simply resolve as ordinary dodgeable damage for now. That is not a stopgap
— it is the dodge floor, and per HIT-THE-BEAT-SPEC parry is *optional*, so the
game is fully coherent and fully playable without the parry layer.

The **Beat Ring telegraph visual is deferred** to the parry brief. The Beat Ring's
whole job is to communicate the parry *window*; building it before `ParrySystem`
exists risks building it wrong. This brief uses body-animation tells only — which
HIT-THE-BEAT-SPEC §2 says each attack keeps anyway, independent of the ring.

---

## Source of truth

`PROTOTYPE-SCOPE.md` defines the five archetypes and their telegraph/parry status.
`HIT-THE-BEAT-SPEC.md §6` gives the parryable-attack table. This brief implements
the **enemy and attack** side of those; it does not implement parry. Where this
brief and those documents differ, those documents win — surface it.

The five archetypes (from PROTOTYPE-SCOPE.md):

| Archetype     | Movement read                          | Has a telegraphed attack? |
|---------------|------------------------------------------|---------------------------|
| Fan           | Slow, direct, swarms                     | No — pure contact pressure |
| Weaver        | Fast sine-wave approach                  | No — pure contact pressure |
| Mosher        | Winds up, lunges straight                | Yes — the lunge            |
| Backup Dancer | Circles at range, lobs a slow projectile | Yes — the lob              |
| Bouncer       | Big, slow, high-HP mini-elite; one AOE slam | Yes — the slam          |

---

## In scope for this task

### 1. `src/config/enemies.ts` — populate it for real

The five archetypes live as **data** here, per CLAUDE.md content-as-data. Each
archetype entry should express, at minimum:

- Identity: id, a movement-behavior kind, body color (visually distinct from each
  other, from both hunters, and from the dummy's old color).
- Stats: HP, move speed, contact damage, body size — all values, all eventually
  in `tuning.ts` (see §2).
- Attack data, for the three that have an attack: which attack behavior, its
  windup duration, its damage, and whatever the behavior needs (lunge distance,
  projectile speed, slam radius). Marked in the data as telegraphed — so the parry
  brief can later find "which attacks are parryable" from data, not by guessing.

Per CLAUDE.md: no `if (enemy.id === 'Mosher')` in any system. Movement and attack
behavior is selected by the *kind* fields in data.

### 2. `tuning.ts` — all enemy numbers

Every number the five archetypes introduce — per-archetype HP, move speed, contact
damage, body size; windup durations; lunge distance; projectile speed; slam radius;
spawn timings (see §4) — lives in `tuning.ts`, structured so it reads as the dial
board.

- The combat brief's baseline combat numbers were marked `PROVISIONAL`. This task
  is the first time real enemy HP exists — so a **light, deliberate first balance
  pass is in scope**: set enemy HP so the three hunter weapons feel meaningfully
  different against them (a `Fan` should fall fast to anyone; a `Bouncer` should
  visibly take Bex's heavy hits better than Nim's light ones). This is a *first
  pass to make the triangle legible*, not a tuning project — do not agonize, and
  leave the `PROVISIONAL` framing in place. Real balance is still a playtest job.
- The dummy target's provisional values can be removed when the dummy is removed
  (§5), or left dead — your call, but do not leave orphaned constants silently;
  if removed, say so.

### 3. `Demon` entity + the five archetypes

The `Demon` entity (currently the minimal dummy from the combat brief) becomes the
real shape. Per CLAUDE.md ECS-flavored conventions: `Demon` is dumb data — id,
position, HP, a reference to its archetype config, current state (e.g. normal vs.
winding-up vs. staggered-later). It owns no behavior. Systems own behavior.

**Movement behaviors — five distinct reads, general implementations:**

Per CLAUDE.md, behaviors are general and selected by data — there is not one
function per archetype-by-name. The five *reads* must be distinct in play:

- **Fan** — moves slowly and directly toward its target hunter. The baseline.
- **Weaver** — moves toward its target along a sine-wave / weaving path, fast. Fast
  and unpredictable is the read.
- **Mosher** — approaches, then at a trigger range enters a windup, then lunges in
  a straight line (see attacks). Between lunges it moves like a slower approacher.
- **Backup Dancer** — does not close to contact; keeps a preferred distance from
  its target hunter, circling/strafing, and lobs from there (see attacks).
- **Bouncer** — big, slow, direct, high HP. Closes and uses its slam (see attacks).

Each enemy targets a hunter — nearest hunter by straight-line distance is the
expected rule; in co-op, different enemies may target different hunters. Keep the
targeting rule simple and in one place.

**Attack behaviors — three, for the three telegraphed archetypes:**

Each telegraphed attack has three phases per HIT-THE-BEAT-SPEC §2: **windup**
(a visible body-animation tell), **strike** (the attack resolves), **recovery**.
This brief builds all three phases — but with **no Beat Ring** and **no parry
interaction**: at the strike, the attack simply deals its damage to any hunter in
its hit area, and a hunter not in the area is unaffected (the dodge floor).

- **Mosher — lunge.** Windup: a visible crouch / pull-back body tell. Strike: a
  fast straight-line lunge in the locked-in direction; a hunter caught in its line
  takes damage. Recovery: brief, then back to approaching.
- **Backup Dancer — lob.** Windup: a visible wind-up body tell. Strike: launches a
  slow projectile toward the target's position; on arrival it damages a hunter in
  its small impact area. Uses the `Projectile` entity (made real last task) — or a
  clearly-separate enemy-projectile path if mixing them is messy; your call, keep
  it clean.
- **Bouncer — slam.** Windup: a visible raise-up body tell. Strike: an AOE — a
  hunter within the slam radius takes damage. Recovery: brief.

**Body-animation tells are required and must be legible.** A player must be able
to *see* a telegraphed attack coming and reposition out of it — that is the dodge
floor working, and it is what makes these attacks fair without parry. The tell can
be programmer-art simple (a color shift, a scale pulse, a clear pose change) but
it must be unmistakable. The parry brief will *add* the Beat Ring on top of these
tells; it will not replace them.

### 4. `SpawnSystem`

`SpawnSystem` owns getting enemies into `RunScene` over time.

- It spawns enemies over time at the arena edges (or off-screen-edge then move in)
  — not on top of the hunters.
- For this task, a **simple time-based escalation** is enough: enemies spawn at
  some interval, and the mix/rate increases over time so the arena gradually fills.
  The Bouncer — the mini-elite — should appear more rarely than the Fan.
- All spawn timings, rates, and the mix live in `tuning.ts`.
- This is **not** `RunDirector`. Do not build the intro/build/drop/headliner run
  arc, wave structure, or the run timeline — that is a separate later brief.
  `SpawnSystem` here is just "a steadily escalating trickle of enemies." Keep it
  simple and tunable; `RunDirector` will drive it properly later.
- `RunDirector` stays a stub.

### 5. Wire enemies into combat + remove the dummy

- The hunters' auto-attacks (from `CombatSystem`) now hit **enemies**. The combat
  brief was told to write targeting so "what counts as a target" was not
  hard-wired to the dummy — enemies should now be the valid targets. If a small
  change in `CombatSystem` is needed to point it at the real enemy collection,
  that is in scope; a *rewrite* of `CombatSystem` is not — surface it if it wants
  one.
- Enemies damage hunters: contact damage from any enemy touching a hunter, plus
  the three telegraphed-attack damages. This is the first time hunters can take
  damage — so **hunter HP becomes real this task**. Per HUNTER-SPEC §4, hunter HP
  is identical across the three hunters; the value lives in `tuning.ts`.
- A hunter at zero HP: for this task, handle it minimally and safely — the hunter
  is removed or disabled, no crash, no dangling references. **Do not** build a
  game-over screen, run-end flow, respawn, or death feedback — that is run-flow /
  `RunDirector` / juice territory, out of scope here. Minimal and clean is the
  whole requirement. If both hunters reaching zero needs *some* handling to avoid
  an empty broken scene, the minimal handling is fine — but no run-flow features.
- **Remove the stationary dummy target.** It was scaffolding for the combat brief;
  real enemies replace it. Remove it and its now-orphaned tuning constants
  cleanly.

### 6. Minimal enemy hit/death feedback

- Enemies use the same minimal hit feedback `CombatSystem` already established
  (the flash). Enemy death is a clean removal, as the dummy's was.
- Hunters taking damage need *some* minimal legibility too — a flash or equivalent
  — so a player can tell they were hit.
- This is still **not** the juice task. `FeedbackSystem` stays a stub. No screen
  shake, hitstop, particles, floating damage numbers, combo counter, telegraph
  rings. Just enough that hits — dealt and taken — are legible.

### 7. Banked cleanups (small, fold in)

Three small items banked from prior task reports — do each as its own commit:

- **Dead color constants.** `HUNTER.P1_COLOR` / `P2_COLOR` in `tuning.ts` went
  dead when hunter color moved to `HunterDef.bodyColor` (combat brief report).
  Remove them.
- **`.gitignore` — `*:Zone.Identifier`.** WSL attaches `:Zone.Identifier` metadata
  sidecar files; they are not ignored and a future `git add -A` would catch them
  (co-op brief report). Add the ignore line.
- **File `COOP-BRIEF.md`.** It is untracked at repo root; by analogy with the
  other briefs it belongs at `specs/COOP-BRIEF.md`, tracked (co-op brief report).
  `git mv` / add it there. (This brief, `ENEMY-BRIEF.md`, should also live in
  `specs/` — file it too if it is not already.)

---

## Not in this task — binding

Do not build any of the following. If the task seems to call for one, stop and
surface it in chat.

- **No `ParrySystem`, no parry, no Hype meter, no Beat Ring.** The three
  telegraphed attacks resolve as plain dodgeable damage. Body-animation tells
  only. `ParrySystem` stays a stub — it is the next brief.
- **No signature power implementations.** The `SIGNATURE_POWERS` registry stays at
  `status: 'stub'` (combat brief established this). `ParrySystem` flips them later.
- **No `RunDirector`, no run arc, no waves, no run timeline.** `SpawnSystem` is a
  simple escalating trickle only. `RunDirector` stays a stub.
- **No game-over / run-end / victory flow, no respawn.** A hunter at zero HP is
  handled minimally and safely — nothing more.
- **No boss / Headliner.** The Bouncer is a mini-elite, not the boss. The
  Headliner is a separate later brief. `Boss.ts` stays a stub.
- **No `FeedbackSystem` build.** Minimal hit legibility only — no shake, hitstop,
  particles, floating numbers, combo, rings.
- **No `UpgradeSystem`, no level-up, no verse picks.** Stub.
- **No `SaveSystem`, no audio, no menu/character select.** Stubs.
- **No deep balance pass.** The §2 enemy-HP pass is a light first pass to make the
  weapon triangle legible — not a balancing project. Provisional framing stays.
- **No new directories**, and no new files beyond what the five archetypes,
  `SpawnSystem`, and the real `Demon` need. Propose in chat first if the structure
  seems to need something new.
- **No automated tests.** Still human-playtest only per CLAUDE.md.

---

## Definition of done

- `npm run dev` boots to `RunScene`: two hunters, no dummy, and a steadily
  escalating trickle of enemies spawning from the edges. No console errors.
- All five archetypes are present and **visibly distinct** — distinct colors and,
  more importantly, distinct movement reads (Fan slow-direct, Weaver fast-weaving,
  Mosher approach-windup-lunge, Backup Dancer circles-and-lobs, Bouncer big-slow-
  slam).
- The three telegraphed attacks (Mosher lunge, Backup Dancer lob, Bouncer slam)
  each have a visible body-animation windup tell and resolve as dodgeable damage —
  a player can see them coming and reposition out.
- Hunters' auto-attacks kill enemies; enemies' contact and attacks damage hunters;
  hunter HP is real; a hunter at zero HP is handled minimally without crashing.
- All five archetypes live as data in `enemies.ts`; movement and attack behaviors
  are general and data-selected; no per-enemy `if`/`switch` in any system.
- Every enemy number — stats, windups, spawn timings — is in `tuning.ts`. The
  light enemy-HP pass makes the three weapons feel different against the horde.
- The dummy target and its orphaned constants are removed cleanly.
- The three banked cleanups are done, each as its own commit.
- Co-op holds: enemies target across both hunters, both hunters fight
  independently, no P1/P2 branching.
- `npm run build` succeeds.
- `npm run typecheck` passes clean — strict mode, no `any`, no `@ts-ignore`
  without a one-line reason comment.

## Commits

Follow CLAUDE.md's `<area>: <change>` format, one concern per commit. Keep
tuning-number commits separate from logic commits (CLAUDE.md). A reasonable shape
— use judgment, keep them separable:

- `chore: gitignore Zone.Identifier sidecars`
- `chore: file COOP-BRIEF and ENEMY-BRIEF in specs/`
- `chore: remove dead P1/P2 color constants`
- `content: populate enemies.ts — five archetypes`
- `tuning: enemy stats, attack, and spawn numbers`
- `enemies: five movement behaviors, data-selected`
- `enemies: telegraphed attacks — Mosher lunge, Dancer lob, Bouncer slam`
- `enemies: body-animation windup tells`
- `spawn: SpawnSystem — escalating edge spawns`
- `combat: point CombatSystem targeting at real enemies`
- `combat: enemy contact + attack damage to hunters, real hunter HP`
- `enemies: minimal hit/death feedback; remove dummy target`

`npm run typecheck` passes before every commit. Do not commit a broken build.
Local commits only — do not push.

## When done

Report back in chat: confirm the definition-of-done checklist, note anything that
fought the structure or any point where the docs were ambiguous, and flag the
in-browser check that needs Brad's eyes — the things this task is really verified
by: do the five archetypes *read* as five distinct things in motion; are the three
telegraphed attacks legible enough to dodge on sight; does the horde feel like a
horde; do the three weapons feel meaningfully different against it. Then stop. The
next task — `ParrySystem` and the parry layer per HIT-THE-BEAT-SPEC.md — will be
briefed separately.

---

<!-- ENEMY-BRIEF.md v1.0 — Claude Code task brief for Demon Hunters (working
title) Prototype #1, build step 4. Scope: the five enemy archetypes (Fan, Weaver,
Mosher, Backup Dancer, Bouncer) as data in enemies.ts, five data-selected movement
behaviors, three telegraphed attacks (Mosher lunge / Dancer lob / Bouncer slam)
with body-animation windup tells resolving as plain dodgeable damage, SpawnSystem
as a simple escalating edge-spawn trickle, real Demon entity, CombatSystem pointed
at real enemies, real hunter HP with minimal zero-HP handling, minimal hit/death
feedback, a light enemy-HP balance pass, removal of the combat-brief dummy, and
three banked cleanups (gitignore Zone.Identifier, file the briefs in specs/, remove
dead color constants). Explicitly excludes ParrySystem / parry / Hype / Beat Ring
(next brief), signature power implementations, RunDirector / run arc / waves,
game-over flow, the Headliner boss, FeedbackSystem juice, UpgradeSystem, SaveSystem,
audio, and any deep balance pass. Subordinate to CLAUDE.md, DESIGN-PILLARS.md,
PROTOTYPE-SCOPE.md, HIT-THE-BEAT-SPEC.md. Co-authored: Brad + Claude Chat. -->
