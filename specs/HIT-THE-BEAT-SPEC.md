# HIT-THE-BEAT-SPEC.md — The Charge & Parry Verb (v2.0)

> Spec for Prototype #1's signature verb. Subordinate to DESIGN-PILLARS.md,
> PROTOTYPE-SCOPE.md, CLAUDE.md. Read those first.
> Informed throughout by PARRY-RESEARCH.md — principle references like (P2),
> (R2), (OQ7) point into that document.
>
> Maps to `src/systems/ParrySystem.ts`. All numbers in this spec are
> **starting values** — they live in `tuning.ts` and are expected to move in
> playtest. The spec locks the *grammar and structure*, not the final dials.
>
> **v2.0 supersedes v1.0.** v1.0 designed parry as a press-on-beat verb,
> which failed playtest: in an auto-attack horde survivor, hunters killed
> telegraphed enemies before the player could read the windup, and the verb
> had no offensive choice frame to interrogate. v2.0 restructures the verb
> around **hold-and-release**: holding pauses your own auto-attack, releasing
> fires a character-flavored charged AOE, and releasing during a Beat Ring
> resolves as a parry. The Beat Ring grammar, single-window timing model,
> graded-Hype precision curve, three outcomes (reflect / negate+stagger /
> miss), no-streak no-decay Hype semantics, and per-attack telegraph data from
> v1.0 all carry forward. What changes is the *initiation gesture* and the
> *signature trigger* (now player-controlled via a Hype-full charged release,
> not auto-fired). The full change log is at the end of this spec.

---

## What this spec covers — and what it does not

**Covers:** the "Hit the Beat" verb — how a charged attack is held and released,
how telegraphed enemy attacks are parried inside it, the outcomes, the Hype
meter, how the Hype-full signature is fired, how it all behaves in co-op, the
full tuning surface.

**Does not cover, by design:**
- The Headliner's specific named signature attacks — those are the Headliner
  spec's job. This document specifies only how the parry interaction works
  against them generically.
- The hunters' signature *effects* — what Riya's / Bex's / Nim's full-Hype
  release actually *does* belongs in HUNTER-SPEC.md and is built in a dedicated
  later brief. This document specifies only that a full-Hype charged release
  *fires* the signature.
- The end-of-run song-line improvement formula — meta-progression / SaveSystem
  territory. This document notes only that parry performance is an *input* to it.

---

## The verb, in one paragraph

Your hunter auto-attacks the horde. **Holding the parry/charge button pauses
your auto-attack** and begins charging a character-flavored AOE. After a brief
minimum hold, releasing the button fires that charged attack: an AOE centered on
your hunter, shaped to the character (a thrust for Riya, a slam for Bex, a
piercing line for Nim). That charged release is the verb's offensive moment —
*always something*, every time you use it.

When a telegraphed enemy attack is in its parry window at the moment of release,
the release *also* resolves as a **parry** — it negates or reflects the attack,
banks Hype scaled to your precision, and the charged attack still fires. When
your Hype is full, the charged release *is* your hunter's signature power firing
instead of the normal charge — the player chooses the moment.

Movement still avoids damage. Holding the button is greedy — you stop your
auto-attack, so the horde keeps closing while you're charging. Parrying is
greedier still — you commit to a specific timing, and a missed window costs you
nothing extra but a successful one banks Hype. *That tradeoff is the verb.*

---

## §1 — Principles this layer must hold

Restated from PARRY-RESEARCH, DESIGN-PILLARS, and v1.0 as hard commitments. The
v1.0 principles all survive; one is newly load-bearing.

1. **Optional, always.** Every parryable attack is also dodgeable by
   repositioning. A player who never holds the charge button once finishes the
   run on auto-attack alone. The verb is the ceiling, never a gate.
   *(DESIGN-PILLARS Pillar 1.)*
2. **Anticipation, not reaction.** The parry window is at or below reaction
   time — the player reads the *telegraph* and commits the release. The Beat
   Ring exists to make that anticipation possible and kid-legible.
   *(P2, P6.)*
3. **Greedy, not safe — and the cost is your own DPS.** This is the v2.0
   sharpening of P1. Holding pauses your auto-attack. While you charge, the
   horde isn't being cut down. *That* is what makes the verb a real offensive
   choice rather than a free defensive option. **The defensive verb has an
   offensive opportunity cost** — the missing piece v1.0 lacked.
4. **The release is *always* something.** Even outside a parry window, even
   without full Hype, releasing the held button fires the character's charged
   AOE. The verb is never inert. *(v1.0 playtest finding: a verb that does
   nothing most of the time is one the player stops using.)*
5. **Failure is graded, never binary.** A mistimed release during a windup
   simply fires the charged attack with no parry layered on — you drop back to
   "charged attack" outcome, not "punish." A missed parry is *never* a punish.
   *(P4.)*
6. **Difficulty scales the window, not the rules.** Easier settings widen the
   parry window. The mechanic, the gesture, and the feedback are identical at
   every difficulty; only tolerance moves. *(P8, P10.)*
7. **The dance lands inside the encounter.** Hype is the cross-encounter reward;
   the **stagger** is the in-encounter one. A parry immediately makes the
   fight in front of you better, not just a future fight. *(P1; PARRY-RESEARCH
   OQ9.)*
8. **Every parry is a note.** A successful Hit the Beat produces a satisfying
   musical sound — the AudioSystem owns this when it lands. The "songs as
   power" conceit lives at the verb level. *(P5; DESIGN-PILLARS Pillar 3 / 5.)*
9. **The signature is player-fired, not auto-fired.** New in v2.0. A full Hype
   meter primes the next charged release to *be* the signature power. The
   player chooses the moment. This replaces v1.0's auto-trigger and dissolves
   the "always good to fire" constraint v1.0 imposed on HUNTER-SPEC.

---

## §2 — The telegraph grammar: the Beat Ring (unchanged from v1.0)

Every parryable attack uses **one shared telegraph grammar** so the player learns
the timing language exactly once. v2.0 changes how the player *acts* on the
telegraph; the telegraph itself is identical.

**Structure of a parryable attack — three phases:**

| Phase    | What happens                                                                 |
|----------|------------------------------------------------------------------------------|
| Windup   | The attacker plays its distinct body animation **and** spawns a Beat Ring that contracts toward a target marker over the windup duration. |
| Strike   | The ring meets the marker — *the beat*. The parry window is open across this moment. The attack would land here. |
| Recovery | Attack resolves (negated, reflected, or connects). Attacker returns to normal behavior, or to its stagger state if parried. |

**The Beat Ring:**
- A ring/indicator that **contracts** toward a target over the windup.
  Convergence = the beat = the window. The contraction *is* the countdown — the
  player reads timing from how much ring is left, not from a number.
- The grammar is **identical across all parryable attacks**; only the
  *contraction speed* differs per attack. Slow ring and fast ring are the same
  language at different tempos. *(P9.)*
- Each attack also keeps its own body animation. The tell is doubly encoded —
  body + ring — but the **ring is the timing cue and the universal grammar.**
- **Not color-dependent.** The contraction (motion + shape) is the primary read;
  color is secondary reinforcement only. *(P6; accessibility.)*

---

## §3 — The gesture: hold and release

The verb has two inputs at the player level (one button, two distinct uses):

- **Press-and-hold the parry/charge button.** Your hunter immediately stops
  auto-attacking. Charging begins. The hunter visibly enters a charged stance —
  posture change, color shift, ground-circle indicator, whatever reads
  unmistakably ("I am not attacking; I am charging"). This visibility is
  required, not optional: a player must be able to tell their auto-attack has
  stopped, and a co-op partner must be able to tell what the other is doing.
- **Release the button.** Resolution happens at the moment of release. The
  exact resolution depends on context (§4).

### The minimum hold

A release before **~500ms** of continuous holding is a **cancel** — nothing
fires, no charged attack, no parry. The hunter exits the charged stance and
resumes auto-attacking. This is the **anti-spam invariant.** Without it, a
zero-hold tap would be a free AOE every keystroke.

500ms is chosen deliberately:
- Long enough that a tap cannot exploit charged-attack damage.
- Short enough that a player can *react* to a Beat Ring and still complete the
  hold before the window. With the Mosher's ~1400ms windup, ~500ms minimum hold
  + ~280ms widest parry window leaves ~600ms of reaction tolerance after seeing
  the tell — generous for kids, still skill-rewarding.
- Short enough that pre-charging defensively (seeing a swarm closing, holding
  to ready an AOE) is tactical, not punishing.

The minimum-hold cancel produces **no penalty** — no cooldown, no flinch, no
input lockout. You can hold again immediately. The cost of holding is *your
DPS while you held* — that is sufficient anti-spam friction without piling on.

### What the hold looks like, mechanically

- `parryHeld` is a per-player boolean — true while held, false on release.
  Read in `InputSystem` as the only place raw keys are touched (CLAUDE.md).
  `parryPressed` (v1.0 edge-triggered) is removed; the system reads hold state
  per frame and detects the release transition.
- Auto-attacks for that hunter are suspended while `parryHeld` is true.
  `CombatSystem` simply does not fire auto-attacks for a hunter with the held
  state set.
- The hunter's hold-start timestamp is tracked. On release: if
  `now - holdStart < 500ms`, it's a cancel; otherwise it's a charged release
  that resolves per §4.
- Per-player, fully independent — P1 holding does not affect P2's auto-attack.

---

## §4 — The release outcomes

When the held release fires (hold duration ≥ 500ms), exactly one of three
outcomes resolves:

### Outcome A — Plain charged release (no Beat Ring, no full Hype)

- The hunter's **character-flavored charged AOE** fires, centered on the
  hunter, shaped per character (§6).
- This is the default outcome — the release you get when no parry window is
  active and Hype is not full.
- Damage is **meaningful** — provisionally ~1.5–2× the hunter's normal
  per-hit damage, in a single burst hitting all enemies in the AOE. Tuned in
  `tuning.ts`; real balance is playtest.
- This is *most* releases. It is the verb's everyday offensive moment.

### Outcome B — Parried release (release inside a parry window)

- A telegraphed enemy attack is in its parry window at the moment of release.
- Resolution by attack kind (unchanged from v1.0):
  - **Projectile attack** (Backup Dancer lob): the projectile is **reflected**
    — sent back as damage to enemies. (HUNTER-SPEC §3 / v1.0 §4 — already
    implemented in this codebase via `CombatSystem.spawnHunterProjectile`.)
  - **Body or area attack** (Mosher lunge, Bouncer slam, most Headliner
    signatures): the attack is **negated** and the attacker is **staggered** —
    cannot act, takes hunter damage normally, visibly different. After a
    stagger duration, returns to normal behavior.
- **Hype is banked**, scaled by precision within the window (§5).
- **The charged AOE still fires.** A parry does not consume the charged
  release; it *layers on top* of it. Outcome B is "Outcome A plus parry
  effects." This rewards the player twice for the harder skill — and it's
  natural in implementation, because the charged AOE is just what a release
  does.
- The full §8 feedback fires for the parry layer specifically.

### Outcome C — Signature release (release with full Hype)

- The player's Hype meter is at capacity.
- The **hunter's signature power fires** instead of the normal charged AOE.
  Riya's Breakdown / Bex's Drop / Nim's Bridge — *the player chose this
  moment*. (Per HUNTER-SPEC §3; implemented in a dedicated later brief.)
- Hype resets to zero. The meter begins refilling on the next successful parry.
- If the release *also* happens to be inside a parry window: parry effects
  layer on top (Outcome C + Outcome B). The signature fires *and* the parry
  resolves *and* Hype banks toward the next signature. This is the verb's
  peak moment.

### Outcome D — Missed release (no charged attack, no parry, no signature)

- Hold duration was below ~500ms → cancel (§3). No outcome resolves.

The matrix:

| Hold ≥ 500ms? | Inside parry window? | Hype full?     | Outcome                       |
|---------------|----------------------|----------------|-------------------------------|
| No            | —                    | —              | Cancel (§3)                   |
| Yes           | No                   | No             | A — plain charged AOE         |
| Yes           | Yes                  | No             | B — parry + charged AOE       |
| Yes           | No                   | Yes            | C — signature fires           |
| Yes           | Yes                  | Yes            | C + B — signature + parry     |

### A note on graceful failure (P4)

A player who *intends* to parry but releases at the wrong moment within a
windup doesn't get punished — they get **Outcome A**. Their charged AOE still
fires; they just don't get parry effects or Hype. A missed parry is never worse
than no parry attempt — it's just an unaccompanied charged release. (This is the
v2.0 version of the v1.0 graceful-failure principle.)

A player who releases *before* the strike window opens — too early — gets the
same: Outcome A, no parry. There is no "you blew it, take extra damage" path.

---

## §5 — The Hype meter and the signature trigger

**Hype** is the in-run offensive resource. Per-player, per-run. Lives in
`ParrySystem` state. (Largely unchanged from v1.0 — the *trigger* moves to
player-controlled at full meter, per §4 Outcome C.)

- **Fills only on Outcome B** (parried releases). The plain charged release
  (Outcome A) does *not* fill Hype — that would erase the skill gradient.
- **Scaled by precision within the parry window.** A release dead on the beat
  banks **maximum** Hype; a release near the window edge banks **less** but
  still parries categorically. Precision curve is **linear** from edge → center
  to start; the curve shape is tunable.
- **No streak.** Per-parry independent fill, no consecutive count to build or
  break. Deliberate, per v1.0; v2.0 reaffirms.
- **No decay** in the prototype. Hype persists through the run.
- **Capacity** is a `tuning.ts` value, set so a competent run reaches full once
  or twice across its length. Provisional. Tuned via playtest.
- **Per-run, not persistent.** Hype resets at run start.

### The signature trigger — v2.0's key change

When Hype is full, the **next charged release fires the signature** (§4
Outcome C) instead of the normal charged AOE. The player chooses the moment.

This change dissolves v1.0's "always good to fire" constraint that
HUNTER-SPEC §3 had to absorb. The signature still must be *good* — but it no
longer needs to be safely autofireable at any moment, because the *player*
picks the moment. The constraint relaxes from "always good" to "good when the
player chooses to fire it" — a much weaker, much more designable property.
HUNTER-SPEC v1.1 records this in a parallel amendment.

### The Hype meter HUD

Unchanged from v1.0 — per-player, visibly associated with each hunter, visibly
**jumps** on a successful parry (scaled to precision), distinct **full** state.
The full state's framing changes slightly: it now reads "your next charged
release will be your signature" rather than "the signature will fire
automatically at any moment." A visual treatment that makes this read clear is
welcome — a "ready" pulse, a color shift, a hold-indicator change while charging
— but it's a polish call, not load-bearing.

**Boundary unchanged:** Hype is in-run (lives in `ParrySystem`, resets every
run). Song-line quality is persistent across runs (lives in `SaveSystem`). The
two are different things. This spec touches only Hype.

---

## §6 — The charged AOE: per-character shape

The charged release (§4 Outcomes A and B; signature release replaces it in
Outcome C) is centered on the hunter and **shaped per character.** Identity
expression lives in the *shape and feel*, not in the numbers — the damage
multipliers stay roughly equal across hunters so balance doesn't drift.

Provisional shapes:

| Hunter | Charged AOE shape                                              | Reads as                          |
|--------|----------------------------------------------------------------|-----------------------------------|
| Riya   | Forward arc / wedge in front of her (wider, shorter than her sword) | A heavy committed sword thrust  |
| Bex    | Radial slam — full circle around her, ground-shockwave shape   | A big bruiser body-slam           |
| Nim    | Piercing line / volley forward through her facing or movement direction | A power shot of stars     |

Notes:
- **No aiming.** Riya's arc faces her movement direction (or her current
  auto-attack target's direction at release moment — pick the simpler one).
  Bex's radial is omnidirectional. Nim's line uses movement direction; if she
  isn't moving, default to last facing.
- **Damage is provisional** — start at ~1.5–2× the hunter's normal hit
  damage, single-burst hitting all enemies in the AOE. Tuned in `tuning.ts`.
- **The release itself is binary** (§3). Hold ≥ 500ms = full charged AOE; no
  damage scaling by hold duration. The skill gradient lives in *whether* to
  hold (the DPS tradeoff) and *when* to release (the parry window timing) —
  *not* in how long to hold.
- **The signature release replaces the charged AOE**, it does not stack with
  it. A Hype-full release fires Breakdown / Drop / Bridge; the normal charged
  AOE does not also fire. (Otherwise charged releases at full Hype would be
  *strictly better* than at empty Hype, which they should be — but not by
  *doubling* effects.)

Per CLAUDE.md content-as-data: the AOE shape, damage multiplier, and other
per-hunter charged-release values live in `hunters.ts`, not as `if` statements
in `ParrySystem` or `CombatSystem`.

---

## §7 — The prototype's parryable attacks (unchanged from v1.0)

Tied to the five enemy archetypes and the boss from PROTOTYPE-SCOPE.md. The
Mosher, Backup Dancer, and Bouncer telegraphs are already implemented per the
enemy brief; the Headliner's specific signatures are the Headliner spec's job,
and only the generic interaction is fixed here.

| Source         | Attack         | Beat Ring tempo | On Outcome B (parry)                          | On Outcome A (no parry) |
|----------------|----------------|-----------------|-----------------------------------------------|--------------------------------|
| Mosher         | Straight lunge | **Slowest** — the teaching attack             | Lunge negated, Mosher staggered | Lunge connects in its line; sidesteppable |
| Backup Dancer  | Lobbed projectile | Medium       | Projectile **reflected** as damage to enemies | Projectile lands; area hit if in it |
| Bouncer        | AOE slam       | Medium          | Slam negated, no damage ring, Bouncer staggered | Slam ring damages if in radius |
| Headliner      | 2–3 named signatures | Per-attack    | Per attack: reflect or negate+stagger; banks **large** Hype | Signature resolves; dodgeable |

The teaching ladder is unchanged: the Mosher's lunge is the slowest, most
generous ring on purpose — it is where a player learns the grammar with no
tutorial text. Fan and Weaver remain un-telegraphed and un-parryable; they are
pure dodge-floor pressure (and pressure on your decision to *hold* in the first
place).

---

## §8 — Feedback: the non-confusable signatures

The outcomes must be tellable apart from the moment of contact alone, without
reading any meter. *(P5.)*

**The charged stance (while held):**
- The hunter visibly enters a charged state — posture change, color shift,
  ground-circle indicator, whatever reads unmistakably. This is the v2.0
  feedback channel that v1.0 didn't need: the player must see at all times
  whether they are holding or not.

**Outcome A — plain charged release:**
- A clear AOE animation per character (§6).
- A solid sound — heavier than an auto-attack swing.
- Damage numbers (if FeedbackSystem brings them in) over hit enemies.

**Outcome B — parried release:**
- Outcome A's feedback fires *plus*:
- A brief hitstop / pause.
- A flash + particle burst at the contact point.
- A **musical sound** — a note or chord stab, not a generic thud. Every parry
  is a note (§1.8). (AudioSystem-deferred.)
- The Hype meter visibly **jumps**, scaled to precision (analog readout of
  parry quality).
- The staggered state is unmistakable on staggered enemies.
- A reflected projectile visibly reverses and reads as "yours now."

**Outcome C — signature release:**
- A peak-moment effect per hunter (per the dedicated signature brief).
- Distinct from any charged release — the player must never feel surprised
  that "this was actually my signature."
- The Hype meter visibly empties.

**Outcome D — cancel (sub-500ms release):**
- The charged stance silently ends. No feedback. No animation. No sound.
  This is correct — a cancel is a no-op, not an event.

---

## §9 — Co-op

- Two players, two independent hold/charge buttons (CLAUDE.md control map —
  P1 Space, P2 Numpad 0).
- Two independent charged-stance states, two independent Hype meters, two
  independent signature triggers.
- Multiple Beat Rings can be onscreen simultaneously — one per active parryable
  attack. Pool them.
- **No cross-player synergy** — one player's parry does not feed the other's
  Hype, does not cover the other's attack. Each player's parry is their own.
  Parked per v1.0.
- **One player holding does not pause the other's auto-attack.** This is the
  natural property of per-player state and worth restating: a kid charging on
  one side of the screen does not disable the parent's auto-attack on the
  other.

---

## §10 — Tuning surface

Every value below lives in `tuning.ts`. Starting values are suggestions;
playtest moves them.

| Dial                              | Starting value                          | Notes |
|-----------------------------------|-----------------------------------------|-------|
| Minimum hold to fire charged release | **~500ms**                           | The anti-spam invariant (§3). |
| Parry window width — Widest tier  | ~280ms                                  | Difficulty dial. Widest is hardcoded active in Prototype #1. |
| Parry window width — Medium tier  | ~200ms                                  | — |
| Parry window width — Narrowest tier | ~140ms                                | — |
| Window placement                  | Centered on Strike                      | Centered vs. late-biased is a playtest experiment (R2). |
| Attack windup — Mosher lunge      | ~1400ms (slowest — the teaching attack) | Beat Ring contraction time. |
| Attack windup — Dancer lob        | ~900ms                                  | — |
| Attack windup — Bouncer slam      | ~900ms                                  | — |
| Attack windup — Headliner signatures | ~600–1000ms, per-attack              | Set in the Headliner spec. |
| Charged AOE damage multiplier     | ~1.5–2× normal hit damage               | Per-hunter in `hunters.ts`; provisional. |
| Charged AOE shape / size — Riya   | Forward wedge, provisional radius/angle | `hunters.ts`. |
| Charged AOE shape / size — Bex    | Radial, provisional radius              | `hunters.ts`. |
| Charged AOE shape / size — Nim    | Forward line, provisional range/width   | `hunters.ts`. |
| Hype gained per parry — max (dead-center) | TBD                             | Set so a competent run reaches one signature trigger satisfyingly. |
| Hype precision curve              | Linear, edge → center                   | Curve shape tunable. |
| Hype meter capacity               | TBD                                     | Pairs with per-parry gain. |
| Hype decay                        | Off                                     | Parked. |
| Signature trigger                 | Player release at full Hype             | Replaces v1.0's auto-trigger. |
| Stagger duration                  | TBD                                     | Generous enough to feel like a real opening. |

---

## §11 — Out of scope for this spec / parked

- **A discrete PERFECT / GOOD two-tier outcome.** The single-window + graded
  Hype model is unchanged. Whether a discrete tier reads better is a playtest
  question (§13), not a prototype feature.
- **Hype decay.** Off for the prototype.
- **Charge-time scaling of damage.** Binary release. Hold ≥ 500ms = full
  charged release. The skill gradient lives in *whether* and *when*, not in
  *how long*. Variable-charge is a parked full-game lever.
- **A second action button per player.** v1.0 reserved a third action key per
  hunter and v2.0 still does not use it. Parked for future complexity (e.g.
  bombs, dash variants).
- **Cross-player co-op parry synergy.** Each player's parry is their own.
- **An unparryable "red-attack" boss tier.** Already out per PROTOTYPE-SCOPE.md.
  *(PARRY-RESEARCH R7.)*
- **The Headliner's specific signature attack designs** — Headliner spec.
- **The hunters' signature *effects*** — HUNTER-SPEC + a dedicated brief.
- **The song-line improvement formula** — meta-progression / SaveSystem spec.
- **Visible charge-meter / charge-ready indicator** beyond the basic stance
  visual — i.e., a precise "you have charged" progress bar above the hunter is
  not required; the binary stance + 500ms threshold is enough. Adding one
  cleanly is fine if Claude Code's implementation naturally surfaces one, but
  it is not required.

---

## §12 — Implementation salvage (v1.0 → v2.0)

A note for the brief that will implement v2.0: **most of v1.0's parry
implementation salvages.** The brief is a *rework*, not a rewrite.

Salvageable as-is:
- The Beat Ring telegraph visual (`ParrySystem`'s ring rendering + pooling).
- The parry window timing math, the precision grading, the three window tiers
  in `tuning.ts`.
- The three outcome resolutions: reflect (Dancer), negate+stagger (Mosher,
  Bouncer). The `Demon.staggered` state. `CombatSystem.spawnHunterProjectile`.
- The Hype meter state machine and HUD.
- The signature trigger wiring (the event emission, the signatureId lookup) —
  what changes is *what triggers it*.

Replaced or reworked:
- `InputSystem`: `parryPressed` (edge-triggered) becomes `parryHeld` (boolean
  per frame) plus a release event.
- `CombatSystem`: auto-attacks suspended for any hunter with `parryHeld =
  true`.
- `ParrySystem`: gesture state machine — tracks hold-start, applies the
  500ms cancel threshold, fires charged AOE on release, layers parry on top
  if inside a window, fires signature on release at full Hype.
- `ParrySystem` / `CombatSystem`: a new charged-AOE attack behavior, shaped
  per-hunter from `hunters.ts` data.
- `tuning.ts`: new section for charged-release dials (minimum hold, damage
  multiplier, per-hunter shapes). The v1.0 PARRY section stays, repurposed.

The post-press lockout from v1.0 is **removed**. The 500ms minimum-hold is
the new anti-spam invariant — a lockout is no longer needed because mashing
the button cannot fire a charged attack.

---

## §13 — Open questions for playtest

Paper cannot resolve these. The kids' hands resolve them. v1.0 questions are
preserved where they still apply; v2.0 adds new ones.

1. **Does the single-window + graded-Hype model read more clearly than a
   discrete PERFECT/GOOD tier?** v1.0's central design bet — still untested
   because v1.0 never got a meaningful playtest on the parry layer itself.
2. **Is the widest window genuinely kid-landable?** If a six-year-old cannot
   reliably parry the Mosher at the easiest tier, the floor is broken.
3. **Does the Beat Ring grammar survive horde chaos and, in co-op, two rings
   at once?** Spec-flagged legibility risk.
4. **Centered vs. late-biased window placement.** *(R2.)*
5. **Does graded-per-parry Hype sidestep the streak-mindset risk?** *(OQ7.)*
6. **Does the stagger land as "the dance"?** *(P1, OQ9.)*
7. **Does the verb feel meaningfully *greedy* now that the cost is your own
   DPS?** v2.0's central design bet — addresses the v1.0 playtest finding
   directly.
8. **Is the 500ms minimum hold the right number?** Too short and tap-spam
   creeps back. Too long and a Mosher react-and-parry becomes unreachable.
   Tunable; needs hands.
9. **Does releasing at the wrong moment within a windup (Outcome A instead of
   B) feel like graceful failure or feel like punishment?** A "missed parry =
   I just got an AOE" framing must read as a soft loss, not a fail.
10. **Does player-fired signature feel right** — does the player ever forget
    Hype is full and waste it on a routine charge? Or does the meter's full
    state read clearly enough to prevent that?
11. **Do the per-character charged AOE shapes (Riya wedge, Bex radial, Nim
    line) feel distinct enough** to be a meaningful identity expression even
    *before* the signature lands?

---

## v2.0 change log

**Restructured:**
- The verb is now hold-and-release (§3) instead of press-on-beat. Hold pauses
  the hunter's auto-attack; release resolves per §4.
- A new outcome — **plain charged release (§4 Outcome A)** — is what most
  releases produce. The verb is *always something*, never inert.
- Parry (Outcome B) layers on top of the charged release rather than
  replacing it.
- The signature is **player-fired (Outcome C)** at full Hype, not
  auto-triggered.

**New sections:**
- §6 — the per-character charged AOE shapes.
- §12 — salvage notes for the implementation rework.

**Carried forward from v1.0:**
- §2 (Beat Ring grammar) entirely unchanged.
- §5 (Hype semantics — graded, no streak, no decay, per-run, the HUD) largely
  unchanged; only the trigger condition moves.
- §7 (parryable attacks table) unchanged; the column reading reframed for
  Outcome B vs. Outcome A.
- §8 (feedback) reorganized around the new outcome set, but the principles
  (musical parry sound, unmistakable stagger, precision-scaled jump) all
  carry.
- §9 (co-op semantics) unchanged in spirit; the gesture changes.

**Removed:**
- The post-press lockout from v1.0. The 500ms minimum hold replaces it as
  the anti-spam invariant.
- The "always good to fire" constraint from v1.0 §5 (HUNTER-SPEC inherits a
  weaker version — see HUNTER-SPEC v1.1).

**Playtest finding that drove the rework:** v1.0 deployed; the brief shipped.
On first playtest the verb didn't function — auto-attacks killed telegraphed
enemies before windups could be read, and parry had no offensive choice frame
to interrogate. The player insight ("hold the button to pause your own attack,
release as parry or charged hit") produced this v2.0.

---

<!-- HIT-THE-BEAT-SPEC.md v2.0 — Prototype #1's signature verb, restructured as
hold-and-release after v1.0's playtest findings. Locks: the verb is press-and-
hold to pause auto-attack and charge a per-character AOE, release at ≥500ms to
fire it (§3). Release outcomes are matrixed across "in parry window?" and "Hype
full?" — Outcome A plain charged release, Outcome B parry layered on top with
reflect/negate+stagger and Hype banking, Outcome C signature replaces charged
release at full Hype, plus a sub-500ms cancel. The Beat Ring grammar, single-
window precision-graded Hype model, no-streak no-decay semantics, parry
optionality, and per-attack telegraph data from v1.0 all carry forward. The
signature is now player-fired (player chooses when to release at full Hype),
replacing v1.0's auto-trigger and dissolving the always-good-to-fire constraint
HUNTER-SPEC inherited. Anti-spam is the 500ms minimum-hold invariant, replacing
v1.0's post-press lockout. Maps to ParrySystem.ts + InputSystem.ts (parryHeld
replaces parryPressed) + CombatSystem.ts (auto-attack suspend during hold,
charged-AOE attack behavior). Most of v1.0's implementation salvages — see §12.
Subordinate to DESIGN-PILLARS.md, PROTOTYPE-SCOPE.md, CLAUDE.md; informed by
PARRY-RESEARCH.md. Parallel amendment: HUNTER-SPEC v1.1 (signature trigger
moves from auto-fire to player-fired charged release at full Hype). Co-authored:
Brad + Claude Chat. -->
