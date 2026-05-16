# PARRY-V2-BRIEF.md — Claude Code Task: Rework Parry to v2.0 Hold-and-Release

> A task brief for Claude Code — build step 6.
> Read CLAUDE.md, then DESIGN-PILLARS.md, then PROTOTYPE-SCOPE.md, then
> **specs/HIT-THE-BEAT-SPEC.md (v2.0)** cover to cover, then HUNTER-SPEC.md
> (v1.1), then this brief. The v2.0 spec is the bible for this task; this brief
> tells you what to *do* about it.
> Where this brief and the spec disagree, the spec wins; surface it.
> This is a scope-bounded task. The "Not in this task" section is binding —
> if you find yourself reaching past it, stop and surface it in chat.

---

## Goal

Rework the parry layer from v1.0 (press-on-beat) to v2.0 (hold-and-release).
After this task: holding the parry button pauses the hunter's auto-attack and
charges a per-character AOE; releasing fires it; releasing inside a Beat Ring
layers a parry on top with reflect/negate+stagger and Hype banking; releasing at
full Hype fires the signature instead of the normal charge.

This is the **first task that reworks working code rather than building new
code.** Most of v1.0's parry implementation survives — see HIT-THE-BEAT-SPEC
v2.0 §12 for the salvage map. The brief leans on that map; do not duplicate it
here.

## Workflow note: branch first

**Before starting any code work**, create a new branch from current `rebuild`:

```
git checkout rebuild
git pull
git checkout -b parry-v2
```

All commits for this task land on `parry-v2`. **Do not merge to `rebuild`** —
that is Brad's call after playtest confirms v2.0 plays better than v1.0. If
playtest reveals v2.0 also has a fundamental problem, `rebuild` still has the
working v1.0 implementation as a fallback.

Local commits only. Push the branch to `origin/parry-v2` when done — that lets
Brad pull it to playtest. **Do not push to `rebuild`.**

## Why this shape

The v1.0 → v2.0 design change was driven by playtest finding that v1.0 parry
didn't function in an auto-attack horde survivor: hunters killed telegraphed
enemies before windups could be read, and parry had no offensive choice frame
to interrogate. v2.0 solves both by making the player's *own* DPS the cost of
parrying — holding the button pauses auto-attack, restoring player agency over
offense.

The implementation cost of this design shift turns out to be much smaller than
the design shift sounds, because the Beat Ring grammar, the window math, the
precision-graded Hype, the three outcome resolutions (reflect / negate+stagger /
miss), the stagger state on `Demon`, the Hype HUD, and the signature trigger
wiring are all reusable. What changes is **the gesture that initiates the
verb** (press → hold-and-release) and **the signature trigger condition**
(auto-fire at full → player-fired charged release at full). v2.0 §12 maps each
existing piece to "salvageable as-is," "replaced," or "reworked."

---

## In scope for this task

The work breaks into seven concerns. Each maps to a separable commit (or a
small group). Build in roughly this order — the order matches the dependency
chain.

### 1. `InputSystem`: `parryPressed` → `parryHeld`

- Remove the edge-triggered `parryPressed` from the intent type and from
  `InputSystem`'s read path.
- Add `parryHeld` — a per-player boolean, true while the player's parry key is
  down, false otherwise. Per CLAUDE.md, all raw key reading still lives only
  in `InputSystem`.
- Add a release-event signal — either an edge-triggered `parryReleased`
  boolean that fires for one frame on the rising→falling transition, or a
  release callback / event, whichever is cleaner. The system that consumes it
  (`ParrySystem`) needs to know "the player let go *this frame*," not just
  "the player is currently not holding."
- The dash intent is untouched. Keep it as it is.
- The `endFrame` self-cleaning via `POST_UPDATE` is unchanged in pattern — the
  release-event clears itself the same way `parryPressed` did.

### 2. `CombatSystem`: suspend auto-attack while held

- For each hunter, before firing its auto-attack tick, check the hunter's
  `parryHeld` state via `InputSystem.getIntent`. If true, **skip** the
  auto-attack tick for that hunter this frame — no cooldown decrement (so the
  attack is ready to fire immediately on release), no target acquisition, no
  projectile spawn.
- Per-hunter and per-frame, fully independent — P1 holding does not affect
  P2's auto-attack. No P1/P2 branching anywhere; iterate `hunters[]` as
  established.
- This is a small change to `tickHunter` or equivalent. Do not refactor the
  combat loop more than this requires.

### 3. `Demon` / charged-AOE behavior in `CombatSystem` (or shared)

The charged AOE is a *new* attack behavior, parameterized by `hunters.ts`
data. Per HIT-THE-BEAT-SPEC v2.0 §6:

- Three shape kinds: `wedge` (Riya — forward arc), `radial` (Bex — full circle
  around her), `line` (Nim — forward piercing line).
- Each fires as a single-burst hit on all enemies in the AOE.
- Damage = hunter's normal hit damage × charged multiplier (in `hunters.ts`).
  Start with ~1.5–2× as the multiplier; provisional.
- The implementation is **one general behavior per shape kind, parameterized
  by data** — exactly as the auto-attack is general (one melee-arc impl, one
  projectile impl, parameterized by weapon kind). Do not write three named
  functions like `fireRiyaCharge()`. If you find yourself writing `if
  (hunter.id === 'Riya')`, stop — the difference is data.
- Add the shape kind, shape parameters (radius, angle, length — whichever
  apply per shape), and damage multiplier to `hunters.ts` for all three
  hunters. Per HUNTER-SPEC v1.1 §5.
- Where the charged-AOE code lives is your call — likely a sibling of the
  existing melee-arc and projectile fire paths in `CombatSystem`, called by
  `ParrySystem` on release. If a small `chargedAttack.ts` helper module helps
  keep the logic tidy, that is fine; do not introduce a *new system* without
  surfacing in chat.
- Visual: programmer-art simple. A wedge, a circle, a line — each animated
  enough to read as a discrete attack moment. Tile colors and values into
  `tuning.ts`.
- Targeting/facing for non-radial shapes: per the spec, no aiming. Riya's
  wedge faces her current movement direction *or* her nearest-enemy auto-target
  direction at release moment — pick the simpler, keep it consistent. Nim's
  line uses movement direction; if she isn't moving, default to last facing.
  Bex's radial is omnidirectional, no facing needed.

### 4. `ParrySystem`: the gesture state machine — the heart of v2.0

This is the biggest single piece of work and the part where v2.0 most differs
from v1.0.

Per HIT-THE-BEAT-SPEC v2.0 §3 and §4:

- Per-player state, replacing v1.0's edge-triggered press handling.
- On `parryHeld` rising edge (player started holding): record `holdStartMs`.
  Set the hunter's charged-stance visual (§6 below).
- While held: nothing fires. Auto-attack is suspended by `CombatSystem` (§2).
  Do not fire a charged attack mid-hold; the release is the resolution.
- On `parryHeld` falling edge (release detected):
  1. **Compute hold duration** = now − `holdStartMs`.
  2. If hold < `MINIMUM_HOLD_MS` (~500ms): **cancel**. Exit the charged stance
     visual, no attack fires, no penalty, no cooldown, no lockout. Auto-attack
     resumes on the next `CombatSystem` tick automatically.
  3. If hold ≥ minimum hold: this is a charged release. Resolve outcome:
     - Detect if any parryable attack is in its strike window at this moment
       — same window math as v1.0 §3, same `EnemySystem` coordination as
       v1.0. **Salvage v1.0's window-detection code wholesale.**
     - Detect if this hunter's Hype meter is at capacity.
     - Resolve per HIT-THE-BEAT-SPEC v2.0 §4 outcome matrix:
       - **Outcome A** (no window, no full Hype): fire the plain charged AOE.
       - **Outcome B** (in window, no full Hype): fire the charged AOE *and*
         apply parry effects (reflect on Dancer lob, negate+stagger on
         Mosher/Bouncer). Bank Hype scaled to precision (v1.0 grading math —
         salvageable wholesale).
       - **Outcome C** (no window, full Hype): fire the *signature* (emit
         the existing signature-triggered event with the hunter's signatureId
         — v1.0 wiring salvages). The plain charged AOE does **not** also
         fire — signature replaces it. Reset Hype to zero.
       - **Outcome C + B** (in window, full Hype): fire the signature *and*
         apply parry effects *and* bank Hype toward the next signature. The
         signature still replaces the plain charged AOE; parry effects still
         layer on. (Read v2.0 §4 carefully — this is the peak moment.)
- The v1.0 post-press lockout is **removed**. The minimum-hold cancel is the
  new anti-spam invariant; a separate lockout is redundant and would
  interact badly with hold-and-release.
- Precision grading, Hype banking, the Hype HUD's visible jump scaled to
  precision: all **unchanged** from v1.0. Salvage.
- Stagger state on `Demon`, stagger duration, stagger visuals: **unchanged**
  from v1.0. Salvage.
- Reflect path for Dancer projectiles via
  `CombatSystem.spawnHunterProjectile`: **unchanged** from v1.0. Salvage.

### 5. Signature trigger: auto-fire → player-fired

- The v1.0 implementation auto-fired the signature when Hype hit capacity.
  Find that auto-fire path and **remove it**. The Hype meter filling no longer
  triggers anything by itself — it only flags "this hunter is at capacity."
- Hype-at-capacity becomes a *condition* the gesture state machine (§4) reads
  on release.
- The `SIGNATURE_POWERS` registry stays `status: 'stub'`. The placeholder
  visible event (burst + name label "BREAKDOWN!" / "DROP!" / "BRIDGE!") that
  v1.0 fired on auto-trigger now fires on player-fired Outcome C release.
  Move the visual; do not redesign it. The real signature effects remain the
  next dedicated brief.

### 6. The charged stance visual

Required, not optional (HIT-THE-BEAT-SPEC v2.0 §3, §8). While `parryHeld` is
true, the hunter must visibly read as "I am charging, not attacking." A player
must be able to tell at a glance, and a co-op partner must be able to tell
about the other player.

- Programmer-art simple — a posture tint, a color shift, a small ground-circle
  indicator, an outline pulse, whatever reads unmistakably.
- Visually distinguishable from the staggered enemy state (which is its own
  visual on `Demon`) — these should not be confusable.
- Per-player. Two hunters in their charged stance simultaneously is
  expected and must be legible.
- When released (cancel or charged release), the stance exits cleanly.

### 7. The Hype HUD: the "ready" state

The Hype HUD itself is salvageable. The one small change:

- When a hunter's Hype is full, the HUD's visual must distinctly read as
  "next release fires the signature" — not just "meter full." A different
  fill color, a steady pulse, an icon — anything unmistakable. The player
  must never *forget* their Hype is full and waste it on a routine charge.
- Position, sizes, colors in `tuning.ts`. Keep it minimal — this is one
  state visual, not a full HUD redesign.

---

## Salvage map (quick reference — defer to HIT-THE-BEAT-SPEC v2.0 §12 for the canonical version)

**Keep as-is, do not rewrite:**
- Beat Ring telegraph rendering and pool.
- Parry window timing math, precision grading, all three window tiers in `tuning.ts`.
- Outcome resolutions: reflect (Dancer), negate+stagger (Mosher, Bouncer).
- `Demon.staggered` state machine.
- `CombatSystem.spawnHunterProjectile`.
- Hype meter state, accumulation, capacity check.
- Hype HUD position/render (extend the full-state visual; don't rebuild).
- Signature trigger event emission and signatureId lookup.
- The placeholder signature visual (burst + name label).

**Rework:**
- `InputSystem`: `parryPressed` → `parryHeld` + release event.
- `CombatSystem`: auto-attack suspend while held; charged-AOE behaviors.
- `ParrySystem`: gesture state machine (hold tracking, minimum-hold cancel,
  release outcome matrix).
- Signature trigger: auto-fire condition removed; fires on Outcome C release.

**Remove:**
- v1.0 post-press lockout. The 500ms minimum hold replaces it.
- v1.0 windup-extension hack (extending windup by half the parry window for
  centered placement). Centered placement now resolves naturally — the
  release event is read at the moment of release, and the window check uses
  the existing window math against the attack's *un-extended* windup. Verify
  this is correct; if removing the extension breaks something subtle, surface
  it before forcing it.

---

## Not in this task — binding

Do not build any of the following. If the task seems to call for one, stop
and surface it in chat.

- **No signature effect implementations.** Riya's Breakdown, Bex's Drop, Nim's
  Bridge — the trigger fires and the v1.0 placeholder shows; the *effects*
  remain a dedicated next brief. `SIGNATURE_POWERS` stays `status: 'stub'`.
- **No difficulty selector / menu.** All three window widths stay in
  `tuning.ts`; the widest stays hardcoded active. Selector is a later brief.
- **No charge-time damage scaling.** Binary release: hold ≥ 500ms = full
  charged AOE. Variable-charge is parked per v2.0 §11.
- **No new input button.** v1.0 reserved a third action key per player. Still
  unused. Do not wire it.
- **No cross-player parry synergy.** Each player's parry is their own.
- **No `FeedbackSystem` build beyond what the charged stance and outcome
  visuals require.** No hitstop, no screen shake, no particle storms beyond
  the existing v1.0 flash, no floating damage numbers, no combo. Stays a
  stub structurally. The expected v1.0 finding — "parry feels visually thin"
  — still applies and is still the audio + juice brief's job to fix.
- **No `AudioSystem` build.** Parry still has no sound. The "every parry is a
  note" requirement from the spec is still deferred to the audio port.
- **No `SaveSystem` touch.** Per-run Hype only.
- **No `RunDirector`, no run arc, no wave structure changes.** `SpawnSystem`
  continues its escalating trickle.
- **No tutorial / on-screen prompt** for the hold-and-release gesture.
  Tutorialization is its own future question, surfaced last session, not in
  this brief.
- **No new directories.** No new top-level systems without surfacing in chat.
  A small helper module (e.g. `chargedAttack.ts`) is fine if it keeps logic
  tidy.
- **No automated tests.** Per CLAUDE.md, still human-playtest only.

### Hard invariants to preserve

**Parry must remain optional.** A player who never holds the charge button
must be able to play the prototype exactly as they could after the enemy
brief. Verify with a session where you never press parry: it must feel
identical to that build. *(DESIGN-PILLARS Pillar 1.)*

**A missed parry must never be worse than no parry attempt.** Releasing at
the wrong moment in a windup produces Outcome A (plain charged AOE) — the
same outcome as releasing with no windup active. The damage you take (or
don't take) depends only on the enemy attack and your position, never on
whether you attempted a parry. *(HIT-THE-BEAT-SPEC v2.0 §1.5 / P4.)*

**Holding pauses your auto-attack — that is the cost of the verb.** Do not
quietly "soften" this by letting auto-attack fire during a hold, by giving
the hunter free damage while charging, or by making the cost negligible.
The verb's design hinges on this opportunity cost being real. *(v2.0 §1.3 —
v2.0's central design fix.)*

---

## Definition of done

- The game boots and runs. Two hunters, a five-archetype horde, fixed-wide
  camera, no console errors.
- **Pressing-and-holding the parry button** for P1 (Space) or P2 (Numpad 0):
  - Visibly pauses that hunter's auto-attack.
  - Visibly enters a charged stance (unmistakable).
  - Does not affect the other hunter.
- **Releasing the button**:
  - Before ~500ms: cancels silently. Auto-attack resumes. No charged attack.
  - At or after ~500ms with no parry window active and Hype not full: fires
    the hunter's character-shaped charged AOE (Riya wedge / Bex radial / Nim
    line). Visibly hits enemies in the AOE; deals charged damage.
  - At or after ~500ms with a parryable attack in its strike window: fires
    the charged AOE *and* resolves the parry — reflect (Dancer), or
    negate+stagger (Mosher / Bouncer). Hype banked, scaled to precision.
  - At or after ~500ms with Hype at capacity: fires the signature placeholder
    (existing v1.0 burst + name label) *instead* of the charged AOE. Hype
    resets to zero.
  - At or after ~500ms with both a parry window *and* full Hype: signature
    fires, parry resolves, Hype banks toward next signature.
- **A missed parry** (release at wrong moment in a windup, or release with no
  windup active) is indistinguishable from "no parry attempt" outcome-wise —
  same damage if any, no extra penalty.
- The v1.0 post-press lockout and windup-extension are gone. The 500ms
  minimum-hold is the only anti-spam mechanism.
- Hype HUD reads clearly: visible per-player meter, jumps on parry, shows a
  distinct full state.
- Both players parry independently. No P1/P2 branching anywhere.
- The hard invariants verified by a session played without ever holding
  parry — game plays as it did pre-this-task.
- All v2.0 numbers in `tuning.ts`: minimum hold, all three window widths,
  precision curve, Hype capacity, charged AOE damage multipliers and
  shape parameters per hunter. The widest window stays hardcoded active.
- No per-hunter or per-enemy `if`/`switch` in `ParrySystem` or `CombatSystem`.
  Parryability reads from enemy attack data; charged-AOE shape reads from
  `hunters.ts`.
- `npm run build` succeeds.
- `npm run typecheck` passes clean — strict mode, no `any`, no `@ts-ignore`
  without a one-line reason comment.

## Commits

Follow CLAUDE.md's `<area>: <change>` format, one concern per commit. Keep
tuning-number commits separate from logic commits. A reasonable shape — use
judgment, keep them separable:

- `tuning: charged-release dials (minimum hold, AOE multiplier, per-hunter shapes)`
- `input: parryPressed → parryHeld + release event`
- `combat: suspend auto-attack while parry is held`
- `content: add charged-AOE data to hunters.ts (shape kind, params, multiplier)`
- `combat: charged-AOE attack behaviors (wedge, radial, line)`
- `parry: gesture state machine — hold tracking + minimum-hold cancel`
- `parry: release outcome matrix (charged AOE + parry layer + signature)`
- `parry: remove auto-fire signature trigger; fire on Outcome C release`
- `parry: remove post-press lockout and windup-extension`
- `hud: distinct "ready" state on full Hype meter`
- `parry: charged stance visual on held hunter`

`npm run typecheck` passes before every commit. Do not commit a broken
build. Local commits only — do not push to `rebuild`. Push the completed
branch to `origin/parry-v2` when done.

## When done

Report back in chat: confirm the definition-of-done checklist, note anything
that fought the structure or any point where the docs were ambiguous, and
flag the in-browser check that needs Brad's eyes — the things this task is
really verified by:

- Does holding-to-pause-auto-attack feel like a real choice with real cost?
- Does the charged release feel meaningful as the default outcome — i.e.,
  is the verb worth using even when no parry window is active?
- Does releasing inside a Beat Ring produce a clear, satisfying parry
  outcome — clearer than v1.0's press-on-beat did?
- Do the three per-character charged AOE shapes feel distinct and
  characterful?
- Does the player-fired signature feel like the player chose the moment, or
  does Hype-full feel like a fiddly extra step?
- Does the kids-first invariant hold — a no-parry session still feels fine?
- The expected shortcoming — visual thinness with no audio, no hitstop, no
  big effects — persists. Still the audio + juice brief's job.

Then stop. The next task — implementing the three signature power effects
(Breakdown / Drop / Bridge) — will be briefed separately, **after** Brad
playtests v2.0 and confirms the verb plays better than v1.0.

---

<!-- PARRY-V2-BRIEF.md v1.0 — Claude Code task brief for Demon Hunters
(working title) Prototype #1, build step 6. Scope: rework the parry layer
from v1.0 (press-on-beat) to v2.0 (hold-and-release) per HIT-THE-BEAT-SPEC
v2.0. Workflow: branch first — create parry-v2 from rebuild; do not merge to
rebuild. InputSystem: parryPressed → parryHeld + release event. CombatSystem:
suspend auto-attack while held; new charged-AOE behaviors (wedge/radial/line)
parameterized by hunters.ts data. ParrySystem: gesture state machine with
500ms minimum-hold cancel; release outcome matrix (Outcome A plain charged
AOE / Outcome B parry layered on / Outcome C signature replaces charge at
full Hype / Outcome D sub-500ms cancel). Salvage map per spec §12 — Beat
Ring, window math, precision grading, stagger state, reflect path, Hype
state, HUD, signature wiring, placeholder visual all kept as-is. Remove
v1.0 post-press lockout and windup-extension; 500ms hold is the new anti-spam
invariant. Hard invariants: parry stays optional, missed parry never worse
than no attempt, holding genuinely pauses auto-attack. Explicitly excludes
signature effect implementations (next brief), difficulty selector menu,
charge-time damage scaling, third input button, cross-player synergy,
FeedbackSystem juice, AudioSystem build, SaveSystem touch, RunDirector
changes, tutorial prompts. Subordinate to CLAUDE.md, DESIGN-PILLARS.md,
PROTOTYPE-SCOPE.md, HIT-THE-BEAT-SPEC.md v2.0, HUNTER-SPEC.md v1.1.
Co-authored: Brad + Claude Chat. -->
