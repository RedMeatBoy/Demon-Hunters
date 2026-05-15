# PARRY-BRIEF.md — Claude Code Task: ParrySystem + the Parry Layer

> A task brief for Claude Code — build step 5.
> Read CLAUDE.md, then DESIGN-PILLARS.md, then PROTOTYPE-SCOPE.md, then
> specs/HIT-THE-BEAT-SPEC.md before starting. This brief is subordinate to
> all of them — **HIT-THE-BEAT-SPEC.md is the bible for this task; this brief
> implements that spec.** Where they differ, the spec wins; surface it.
>
> This is a scope-bounded task. The "Not in this task" section is binding —
> if you find yourself reaching past it, stop and surface it in chat.

---

## Goal

Build the parry layer. After this task, "Hit the Beat" — the verb the game is
named after — is real. Telegraphed enemy attacks get a Beat Ring on top of their
existing body-animation tell; a well-timed parry press negates or reflects the
attack and banks Hype scaled by precision; a full Hype meter fires a visible
signature placeholder. Two players, two independent Hype meters, two HUDs.

**Signature power *implementations* (Breakdown, Drop, Bridge) are the next
brief.** This brief proves the trigger wiring with a visible placeholder; the
next brief makes Riya's defensive clear, Bex's offensive burst, and Nim's buff
window actually do their things.

## Why this shape

The parry layer is the most feel-critical system in the project, and
HIT-THE-BEAT-SPEC.md already did the hard design work — telegraph grammar, single
window, graded Hype, three outcomes, the always-good-to-fire constraint that
HUNTER-SPEC inherited. So the brief is mostly about *correctly slicing* what the
spec already specifies. Two slicing decisions:

- **The parry *interaction* is one brief, the signature power *effects* are the
  next.** The interaction (ring, window, outcomes, Hype filling, trigger) is one
  tight interdependent loop that has to be felt as a whole — splitting it apart
  creates handoffs in the middle of the only system whose feel is the whole point.
  The three signature effects are genuinely separable, each already specified, and
  bolting them on roughly doubles this brief's size.
- **The difficulty selector is deferred to a later menu brief.** All three window
  widths from HIT-THE-BEAT-SPEC §3 live in `tuning.ts` as data, but only the
  **widest** is active — kids-first, the first playtest of parry should err
  generous, and switching is one constant change for the Bex-swap-style feel test.
  The selector itself is a menu concern; this brief stays about parry.

The Beat Ring telegraph visual was *deferred* from the enemy brief on purpose —
its job is to communicate the parry window, so building it before the window
existed risked building it wrong. The body-animation tells the enemy brief built
remain — the Beat Ring sits **on top of** them per HIT-THE-BEAT-SPEC §2 (doubly
encoded — body + ring).

## Source of truth

`HIT-THE-BEAT-SPEC.md` is the implementation bible. Read it cover to cover before
starting. Section references in this brief point into it. Where this brief is
silent or unclear, the spec is the answer. Where this brief and the spec
*disagree*, the spec wins — flag and surface.

---

## In scope for this task

### 1. `ParrySystem` — make it real

The stub becomes the real system. It owns:

- Reading the per-player `parryPressed` edge-triggered intent from `InputSystem`
  (already exists, self-cleans via `POST_UPDATE` — confirmed working since the
  co-op brief; this brief consumes the intent that has been sitting there since
  the scaffold).
- Knowing when a parryable attack is in its strike window (`EnemySystem` already
  has the attack state machine — coordinate via events or a queryable state;
  whichever is cleaner. Do not duplicate windup timing.)
- Resolving parry presses — Hit / Miss / inert (HIT-THE-BEAT-SPEC §4).
- Owning the post-press lockout per player (HIT-THE-BEAT-SPEC §3).
- Owning the per-player Hype meter and emitting the signature-trigger event when
  it fills.

Per CLAUDE.md ECS-flavored: `ParrySystem` is a system, parry state lives in the
system, the `Hunter` and `Demon` entities stay dumb data — `Demon` already
anticipates a `staggered` state per the enemy brief; this brief makes it real.

No per-hunter or per-enemy `if`/`switch` — parryability is a *data* property on
attacks (the enemy brief tagged telegraphed attacks accordingly).

### 2. The Beat Ring telegraph visual

The contracting indicator that turns body-animation tells into a parry-grammar.
Per HIT-THE-BEAT-SPEC §2:

- A ring (or equivalent contracting indicator) that starts large at windup start
  and **contracts to convergence at the strike moment**. Convergence = the beat =
  the window. The contraction *is* the countdown — no number on screen.
- Drawn at the impact target / attack origin — wherever the player needs to look
  to read the timing.
- **One shared grammar across all parryable attacks** (Mosher lunge, Backup Dancer
  lob, Bouncer slam). Only the *contraction speed* differs per attack (driven by
  each attack's windup duration in `tuning.ts`). A slow ring and a fast ring are
  the same language at different tempos.
- **Not color-dependent.** The contraction (motion + shape) is the primary read;
  color is secondary reinforcement only. Verify the telegraph is legible if color
  is desaturated.
- Programmer-art simple, but **unmistakable**. This is the most feel-critical
  visual in the project; do not skimp on legibility.
- Pool the rings like `CombatSystem` pools swing visuals — a ring outlives a
  short-lived attack cleanly, and an enemy killed mid-windup must not leak its
  ring.

### 3. Timing window and lockout

Per HIT-THE-BEAT-SPEC §3:

- **Single window** around each attack's strike moment. No discrete nested
  PERFECT/GOOD tiers — precision is rewarded *within* the single window via
  graded Hype (§5 below).
- **Three window widths live in `tuning.ts` as data** — the Soundcheck / Opening
  Act / Headliner tiers (~280ms / ~200ms / ~140ms total per the spec, draft names
  in the spec — use whatever names land cleanly in code). **Hardcode the widest
  active** for this brief. The selector that lets a player choose is a later menu
  brief; switching for feel testing is changing one constant, exactly like the
  Bex swap.
- **Window placement: centered** on the strike moment. Late-biased is a playtest
  experiment per the spec; ship centered.
- **Post-press lockout** per player: ~250ms after any parry press, during which a
  new press cannot register. Lockout is anti-mash, **never** punitive — a
  pressed-and-missed parry with the lockout resolves identically to no press
  (Miss outcome, take the hit if in area, no Hype, nothing extra bad).
- **Hard constraint:** lockout must always be shorter than the shortest attack
  windup. The Mosher windup (~1400ms per the enemy build) makes this trivially
  safe at ~250ms — but enforce it as an invariant, not an assumption.

### 4. The three outcomes

Per HIT-THE-BEAT-SPEC §4 — three outcomes, only three:

**Hit the Beat** (press lands inside window) — splits by attack kind:

- **Reflect** (Backup Dancer lob): the projectile is **sent back as damage**.
  Reverse its velocity, change its damage-target to enemies (not hunters), let it
  travel back through `CombatSystem`'s existing damage path. The reflected
  projectile damages any enemy it hits — not only its original Dancer.
- **Negate + stagger** (Mosher lunge, Bouncer slam): the attack is **negated**
  (no damage to any hunter) and the attacker enters a **staggered** state. While
  staggered, the enemy:
  - Cannot act — no movement, no new windups, no contact damage.
  - Is **visibly** different — unmistakable that it cannot fight back.
  - Takes hunter auto-attack damage normally (this is the in-encounter payoff —
    PARRY-RESEARCH P1 and HIT-THE-BEAT-SPEC §1.6).
  - After a stagger duration (in `tuning.ts`, generous enough to feel like a real
    opening) returns to normal behavior.

In **all** Hit outcomes: **Hype banked**, scaled by precision (§5), and the
required minimal feedback fires (§7).

**Miss the Beat** (press outside window *or* no press):
- Attack resolves normally. Hunter takes damage **only if in its damage area** —
  repositioning still works, exactly as it has worked since the enemy brief.
- No Hype, no stagger, no reflect. **No extra penalty for having tried.** The
  feedback for "missed parry, took hit" must be **identical** to "took hit, no
  attempt." This is the graceful-failure floor (HIT-THE-BEAT-SPEC §4, P4).

**Inert press** (parry pressed with no parryable attack in range):
- Nothing resolves. Cosmetic flourish at most. Lockout still applies (§3).

### 5. The Hype meter

Per HIT-THE-BEAT-SPEC §5:

- **Per-player, per-run state.** Lives in `ParrySystem`. Two meters in co-op,
  fully independent — no cross-player synergy (parked per spec §8).
- **Fills on Hit the Beat, scaled by precision** within the window. A press dead
  on the beat banks **maximum** Hype; a press near the window edge still parries
  (still reflects/negates/staggers — these are categorical) but banks **less**.
  - Precision curve: **linear** from edge → center to start. The curve shape is
    tunable (`tuning.ts`).
- **No streak mechanic** — Hype accrues per-parry independently, no consecutive
  count to build or break. This is a deliberate design choice per the spec to
  sidestep the don't-break-the-streak mindset risk. Do not add a streak.
- **No decay** in the prototype. Hype persists through the run.
- **Capacity** is a provisional `tuning.ts` value — set so a competent run reaches
  full once or twice across its length. Do not agonize; mark provisional. Real
  tuning is playtest.
- **Per-run, not persistent.** Hype resets at run start. (`SaveSystem` is a stub
  and is not touched this brief — the per-run reset can be as simple as
  initializing to zero in `RunScene.create()`.)

**Boundary (HIT-THE-BEAT-SPEC §5):** Hype is *in-run* (resets every run, lives in
`ParrySystem`). Song-line quality is *persistent across runs* (will live in
`SaveSystem`). The two are different things. This brief touches only Hype.

### 6. Hype HUD — minimal, per player

The player must be able to see their meter. Without a visible meter, the verb is
unplayable — you'd never know when the meter's full or how close.

- A per-player meter on the HUD. Two meters, one per hunter, both visible
  simultaneously. Visually associate each with its player (color match to the
  hunter, position near their corner of the screen — your call, keep it
  unambiguous).
- Programmer-art simple — a filled bar, a ring, whatever is unmistakable.
- The meter **visibly jumps** on a successful parry, scaled to precision (a
  center-of-window parry has a bigger, more satisfying jump than an edge parry —
  the meter *is* the precision-grade feedback).
- A clearly distinct **full** state — the player can tell at a glance their next
  parry will trigger the signature. (Once the signature actually triggers, the
  meter empties and refills from zero.)
- Position, size, colors, animation values all in `tuning.ts`.
- This is the *only* HUD this brief adds. No score, no combo, no run timer, no
  hunter-HP bar (a hunter-HP bar is genuinely useful and not in this brief —
  flag it for a later HUD brief).

### 7. Signature trigger — placeholder only

When the Hype meter fills, the signature **triggers automatically** — no extra
input. Per HUNTER-SPEC §3 the player does not choose the moment.

**This brief proves the wiring with a placeholder. It does not build the
effects.**

- When a hunter's Hype hits full, `ParrySystem` emits a signature-triggered event
  with the hunter's `signatureId` (from the `SIGNATURE_POWERS` registry — combat
  brief established this with `status: 'stub'`).
- The placeholder behavior: a visible, unmistakable on-screen event centered on
  the hunter — a burst/flash + a label showing the signature name
  ("BREAKDOWN!" / "DROP!" / "BRIDGE!"). It does **not** damage enemies, clear
  the horde, or buff anything. It exists to prove the trigger fires at the right
  moment for the right hunter.
- Hype resets to zero. The meter is ready to fill again immediately.
- The `SIGNATURE_POWERS` entries can be touched only as needed to wire the
  trigger — the brief is **not** the place to flip `status: 'stub'` to
  `status: 'implemented'`. The next brief owns that. If a small data field is
  needed (e.g. a display name for the placeholder label), add it; do not redesign
  the registry.

### 8. Co-op

- Two players, two independent parry buttons (CLAUDE.md control map: P1 Space,
  P2 Numpad 0 — already in `tuning.ts`).
- Two independent Hype meters, two independent lockouts, two independent
  signature triggers.
- No cross-player parry interaction in the prototype — one player parrying does
  not feed the other's Hype, does not cover the other's attack. (Parked per
  HIT-THE-BEAT-SPEC §8.)
- Multiple Beat Rings can be onscreen simultaneously — one per active parryable
  attack. Pool them; do not let counts balloon. This is the spec's flagged
  legibility risk (§11 Q3) — flag for playtest.

### 9. Minimal parry feedback — what is in, what is out

Outcome distinguishability is essential to the verb (HIT-THE-BEAT-SPEC §7, P5).
Build **just enough** feedback that Hit / Miss / Inert / Reflect / Stagger are
tellable apart from the moment of contact alone. Defer everything else to a
dedicated juice brief and the audio port.

**In this brief — required, minimal:**
- A visible flash / burst on a successful parry (at the attack-resolution point).
- The Hype meter visibly jumps (§6) — itself a feedback channel.
- The staggered state is **unmistakable** — an enemy in stagger looks
  categorically different from a normal enemy (color shift, pose change,
  whatever — programmer-art is fine, *legibility* is non-negotiable).
- A reflected projectile is unmistakably reflected — visibly reverses, ideally
  changes appearance/tint to read as "yours now."
- A failed parry is silent (no extra feedback) — identical to no attempt, per §4.

**Deferred — explicitly out of this brief:**
- Hitstop on parry. *(Comes with a dedicated juice / FeedbackSystem brief.)*
- Screen shake, especially shake scaled to precision. *(Same.)*
- Particle bursts beyond a simple flash. *(Same.)*
- The "every parry is a note" musical sound — HIT-THE-BEAT-SPEC §1.7 calls this
  out as core to the verb, but `AudioSystem` is still a stub. *(Comes with the
  AudioSystem port brief.)*
- Floating damage numbers, combo counter, milestone banners.

**Note the known shortcoming:** playtesting this brief will surface that parry
"works but feels visually thin" — that is **expected**. The full feel of the verb
arrives when the juice brief and audio port land on top of this implementation.
Do not preemptively build juice or audio to compensate.

---

## Not in this task — binding

Do not build any of the following. If the task seems to call for one, stop and
surface it in chat.

- **No signature power implementations.** Riya's Breakdown, Bex's Drop, Nim's
  Bridge — the *trigger* fires and a *placeholder* shows; the *effects* are the
  next brief. `SIGNATURE_POWERS` stays `status: 'stub'`.
- **No difficulty selector / menu.** All three window widths are in `tuning.ts`
  as data; the widest is hardcoded active. `MenuScene` stays a stub.
- **No manual signature spend.** Auto-trigger only. (Parked per HIT-THE-BEAT-SPEC
  §10.)
- **No Hype decay.** Hype persists through the run. (Parked per the spec.)
- **No cross-player parry synergy.** Each player's parry is their own. (Parked
  per the spec.)
- **No unparryable "red-attack" tier on any enemy.** (Already out per
  PROTOTYPE-SCOPE.md and the spec.)
- **No `FeedbackSystem` build beyond the minimal §9 requirements.** No hitstop,
  no screen shake, no particle storms, no floating numbers, no combo. Stays a
  stub structurally.
- **No `AudioSystem` build.** Parry has no sound this brief. The "every parry is
  a note" requirement from the spec is deliberately deferred to the audio port.
  Stays a stub.
- **No `SaveSystem` touch.** Per-run Hype only. Song-line quality (which Hype
  performance will *eventually* feed) is a future brief.
- **No `RunDirector`, no run arc, no wave structure.** `SpawnSystem` continues
  its escalating trickle from the enemy brief. Stub.
- **No hunter-HP HUD, no other HUD elements.** Hype meter only.
- **No new boss / Headliner.** `Boss.ts` stays a stub.
- **No new enemy archetypes**, no changes to the five existing archetypes beyond
  what the stagger state and the Beat Ring require.
- **No new directories**, and no new files beyond what `ParrySystem`, the Beat
  Ring, and the Hype HUD strictly need. Propose in chat first if the structure
  seems to need something new.
- **No automated tests.** Per CLAUDE.md, still human-playtest only at this
  stage. *(`ParrySystem`'s window math is the standing unit-test candidate per
  CLAUDE.md — but tests there are still optional and a later call.)*

### Hard invariant to preserve

**Parry must remain optional.** A player who never presses parry once must be
able to play the prototype exactly as they could after the enemy brief — the
horde behaves the same, the telegraphed attacks are dodgeable by repositioning,
the body-animation tells still work. Verify this by playing a session without
touching the parry button: it must feel identical to pre-this-brief except for
the visible Beat Rings (which can be ignored). If anything about a non-parrier's
experience got *worse*, that is a failure of this brief — surface it.

---

## Definition of done

- `npm run dev` boots to `RunScene`. The game runs, two hunters fight a five-type
  horde, telegraphed attacks now show Beat Rings on top of body tells, Hype
  meters visible per hunter. No console errors.
- A parry press inside the window negates the Mosher lunge (Mosher visibly
  staggers, takes hunter damage during stagger), negates the Bouncer slam
  (Bouncer visibly staggers), or reflects the Backup Dancer lob (projectile
  visibly returns and damages enemies on hit). Hype meter visibly jumps, scaled
  to precision.
- A parry press outside the window (or no press) resolves identically — the
  attack lands if you're in its area, dodgeable otherwise; no Hype; no penalty
  for trying.
- Post-press lockout works — mashing the parry button does not register a parry
  per frame.
- Hype meter fills to capacity over the course of competent play, triggers the
  visible signature placeholder (burst + name label, no effect), resets to zero.
- Both players parry independently. Two Hype meters, two HUDs, two signature
  triggers. No P1/P2 branching.
- **Hard invariant verified:** a session played without ever pressing parry
  behaves identically to the pre-this-brief game (modulo the visible Beat Rings,
  which can be ignored).
- All Beat Ring widths, lockout, window widths (all three tiers), Hype capacity,
  precision curve, stagger duration, HUD position/sizes — every number in
  `tuning.ts`. The widest window tier is the hardcoded active.
- No per-hunter or per-enemy `if`/`switch` in `ParrySystem`. Parryability is a
  data property on attacks; signature ids are data on hunters.
- `npm run build` succeeds.
- `npm run typecheck` passes clean — strict mode, no `any`, no `@ts-ignore`
  without a one-line reason comment.

## Commits

Follow CLAUDE.md's `<area>: <change>` format, one concern per commit. Keep
tuning-number commits separate from logic commits. A reasonable shape — use
judgment, keep them separable:

- `tuning: parry windows (3 tiers as data), lockout, Hype capacity, stagger`
- `parry: ParrySystem scaffold — consume parryPressed intent, lockout`
- `parry: timing window resolution + precision grading`
- `enemies: staggered state on Demon — entry/exit, no-act, visible`
- `parry: negate + stagger outcome (Mosher, Bouncer)`
- `parry: reflect outcome (Backup Dancer projectile)`
- `parry: Hype meter — per-player state, precision-scaled fill`
- `hud: Hype meter HUD per player`
- `parry: signature trigger placeholder + signatureId wiring`
- `parry: Beat Ring telegraph visual, pooled`
- `parry: minimal hit feedback — flash, stagger visual, reflect visual`

`npm run typecheck` passes before every commit. Do not commit a broken build.
Local commits only — do not push.

## When done

Report back in chat: confirm the definition-of-done checklist, note anything
that fought the structure or any point where the docs were ambiguous, and flag
the in-browser check that needs Brad's eyes — the things this task is really
verified by:

- Can a player see the Beat Ring's timing well enough to land a parry?
- Does a successful parry feel like a *moment* despite the minimal visual
  feedback (no hitstop, no shake, no sound)?
- Does the staggered state read as a clear opening?
- Does precision-graded Hype communicate? Do center-of-window parries feel more
  rewarding than edge ones, *without* an explicit "PERFECT!" callout?
- Is the kids-first invariant intact — can a non-parrying playthrough still feel
  fine?
- The expected shortcoming: parry will feel "works but visually thin" — that is
  the audio port and juice brief's job to fix, not this one.

Then stop. The next task — implementing the three signature power effects
(Breakdown / Drop / Bridge) — will be briefed separately.

---

<!-- PARRY-BRIEF.md v1.0 — Claude Code task brief for Demon Hunters (working
title) Prototype #1, build step 5. Scope: implement HIT-THE-BEAT-SPEC.md's parry
interaction layer — ParrySystem made real, the contracting Beat Ring telegraph
visual sitting on top of the enemy brief's body tells, single-window timing with
the widest tier hardcoded active and all three tiers in tuning.ts as data,
anti-mash post-press lockout, three outcomes (reflect for Backup Dancer lobs,
negate + stagger for Mosher lunges and Bouncer slams, miss = unchanged dodge
floor), per-player precision-graded Hype meter with no streak and no decay,
minimal per-player Hype HUD, signature trigger placeholder (burst + name label,
no effect — proves wiring), minimal parry feedback (visible flash, unmistakable
stagger state, visible reflect — defers hitstop/shake/particles/sound).
Explicitly excludes signature power implementations (next brief), difficulty
selector menu, manual spend, Hype decay, cross-player synergy, FeedbackSystem
juice, AudioSystem build, SaveSystem touch, RunDirector / run arc, hunter-HP
HUD, and new boss/enemies. Hard invariant: parry stays optional — a
non-parrying session must feel identical to pre-this-brief. Subordinate to
CLAUDE.md, DESIGN-PILLARS.md, PROTOTYPE-SCOPE.md, HIT-THE-BEAT-SPEC.md.
Co-authored: Brad + Claude Chat. -->
