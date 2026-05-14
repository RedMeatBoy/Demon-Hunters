# HIT-THE-BEAT-SPEC.md — The Parry Layer

> Spec for Prototype #1's parry verb. Subordinate to DESIGN-PILLARS.md,
> PROTOTYPE-SCOPE.md, CLAUDE.md. Read those first.
> Informed throughout by PARRY-RESEARCH.md — principle references like (P2),
> (R2), (OQ7) point into that document.
>
> Maps to `src/systems/ParrySystem.ts`. All numbers in this spec are
> **starting values** — they live in `tuning.ts` and are expected to move in
> playtest. The spec locks the *grammar and structure*, not the final dials.

---

## What this spec covers — and what it does not

**Covers:** the "Hit the Beat" verb — how a parry is telegraphed, timed, resolved,
and rewarded; the Hype meter; how parry behaves in co-op; the full tuning surface.

**Does not cover, by design:**
- The Headliner's specific named signature attacks — those are the Headliner spec's job.
  This document specifies only how the parry *interaction* works against them generically.
- The hunters' signature powers themselves — what Riya's / Bex's / Nim's full-Hype power
  actually *does* belongs in a hunter spec. This document specifies only that a full Hype
  meter triggers it.
- The end-of-run song-line improvement formula — that is meta-progression / SaveSystem
  territory. This document notes only that parry performance is *an input* to it.

---

## The verb, in one paragraph

Movement avoids damage; **Hit the Beat** converts it. Specific enemy attacks and all of the
boss's signature attacks wind up with a visible telegraph — a contracting **Beat Ring**.
A parry-button press timed to the moment the ring lands negates the attack, banks **Hype**,
and — for body and area attacks — **staggers** the attacker, opening it to your
auto-attacks. Parry is optional: every telegraphed attack can also simply be dodged by
repositioning. Parry is the greedy line, not the safe one.

---

## §1 — Principles this layer must hold

Restated from PARRY-RESEARCH and DESIGN-PILLARS as hard commitments for implementation.

1. **Optional, always.** Every parryable attack is also dodgeable by repositioning. A
   player who never parries once finishes the run. Parry is the ceiling, never a gate.
   *(DESIGN-PILLARS P1.)*
2. **Anticipation, not reaction.** The parry window is at or below reaction time — the
   player reads the *telegraph* and pre-commits. The Beat Ring exists to make that
   anticipation possible and kid-legible. *(P2, P6.)*
3. **Greedy, not safe.** A successful parry must visibly *do something dodging does not* —
   reflect a projectile, or stagger an attacker. That payoff is why the verb earns its
   place in a game already full of dodging. *(P1; the Returnal negative case.)*
4. **Failure is graded, never binary.** A mistimed press, or no press, simply drops the
   player back to the dodge floor — take the hit only if you are also in its area, gain no
   Hype. Pressing-and-missing is *never* worse than not pressing. *(P4.)*
5. **Difficulty scales the window, not the rules.** The mechanic, the grammar, and the
   feedback are identical at every difficulty. Only the window width moves. *(P8, P10.)*
6. **The dance lands inside the encounter.** Hype is the cross-encounter reward; the
   **stagger** is the in-encounter one. A parry immediately makes the fight in front of you
   better, not just a future fight. *(P1; this is the spec's answer to PARRY-RESEARCH OQ9.)*
7. **Every parry is a note.** A successful Hit the Beat produces a satisfying musical sound
   — a note, a stab, a chord. The "songs as power" conceit lives at the verb level: parry
   well and the run literally sounds better. *(P5; DESIGN-PILLARS Pillar 3, Pillar 5.)*

---

## §2 — The telegraph grammar: the Beat Ring

Every parryable attack, from the tutorial Mosher to the Headliner, uses **one shared
telegraph grammar** so the player learns the timing language exactly once.

**Structure of a parryable attack — three phases:**

| Phase    | What happens                                                                 |
|----------|------------------------------------------------------------------------------|
| Windup   | The attacker plays its distinct body animation **and** spawns a Beat Ring that contracts toward a target marker over the windup duration. |
| Strike   | The ring meets the marker — *the beat*. The parry window is open across this moment. The attack would land here. |
| Recovery | Attack resolves (negated, or connects). Attacker returns to normal behavior, or to its stagger state if parried. |

**The Beat Ring:**
- A ring/indicator that **contracts** toward a target over the windup. Convergence = the
  beat = the window. The contraction *is* the countdown — the player reads timing from how
  much ring is left, not from a number.
- The grammar is **identical across all parryable attacks**; only the *contraction speed*
  (the windup duration) differs per attack. A slow ring and a fast ring are the same
  language at different tempos. *(P9 — a rhythm that tightens across an encounter raises
  pressure without changing the vocabulary.)*
- Each attack *also* keeps its own distinct body animation (Mosher crouches, Bouncer raises
  its arms, the Dancer winds the lob). The tell is doubly encoded — body + ring — but the
  **ring is the timing cue and the universal grammar.**
- **Not color-dependent.** The contraction (motion + shape) is the primary read; color is
  secondary reinforcement only. The telegraph must survive a colorblind player and a
  muted-color test. *(P6; accessibility is a stated project value.)*
- Visual treatment is a programmer-art-era decision. The *grammar* — contraction counts
  down, convergence is the beat — is locked.

---

## §3 — The timing model

**One window, not two.** There is a single **parry window** around the Strike moment.
There is no separate nested "perfect" tier to confuse a young player. Precision is rewarded
*within* the single window — see §5.

**Window width is the primary difficulty dial** *(P8)*. Three difficulty tiers; names are
draft and could be concert-themed (e.g. *Soundcheck / Opening Act / Headliner*).

| Tier (draft)  | Parry window (total) | Note                                                          |
|---------------|----------------------|---------------------------------------------------------------|
| Widest        | ~280 ms              | The floor for the kids. Approaches reaction-friendly territory. |
| Medium        | ~200 ms              | —                                                             |
| Narrowest     | ~140 ms              | Still more forgiving than Lies of P's ~130 ms, because the *whole* window is success — there is no separate punish tier. *(OQ5.)* |

**Window placement:** **centered** on the Strike moment for the prototype — press as the
ring lands. Late-biased placement ("I waited as long as I dared") is the flagged playtest
experiment, per PARRY-RESEARCH R2 — it is a tuning value, not a rebuild.

**Post-press lockout (anti-mash).** Any parry press starts a brief lockout (~250 ms
starting) during which a new parry cannot be initiated. This makes a press a *commitment* —
the point of anticipation — so mashing cannot substitute for timing.
- The lockout **never adds damage or penalty.** A pressed-and-missed parry with the lockout
  resolves *exactly* as not pressing: take the hit if in-area, no Hype. It is anti-mash,
  not anti-player. *(P4.)*
- **Hard constraint:** the lockout must always be shorter than the shortest attack windup,
  so a press is never "stuck" through a telegraph the player could otherwise have read.
- An idle parry press (no parryable attack active) is inert — a small cosmetic flourish at
  most — and still starts the lockout, for consistency.

---

## §4 — Outcomes

Three outcomes, and only three. The press is an edge-triggered keydown.

**Hit the Beat** — press lands inside the window:
- **Against a projectile attack** (the Backup Dancer's lob): the projectile is **reflected**
  — sent back as damage. Reflection is the projectile's "what dodge doesn't do." *(P1; the
  Hades/Athena lesson.)*
- **Against a body or area attack** (Mosher lunge, Bouncer slam, most Headliner signatures):
  the attack is **negated** and the attacker is **staggered** — a brief state where it
  cannot act and is fully open to the player's auto-attacks. The stagger is the
  in-encounter offense. *(P1, §1.6.)*
- In all cases: **Hype is banked**, scaled by precision within the window (§5), and the
  full §7 feedback fires.

**Miss the Beat** — press outside the window, *or* no press at all:
- The attack resolves normally. The player takes the hit **only if they are also within its
  area** — repositioning (the dodge floor) still works and still saves them.
- No Hype. No stagger. No reflect. No *extra* penalty for having tried.
- This is the graceful-failure floor: a missed parry is just "back to dodging." *(P4.)*

**Inert press** — parry pressed with no parryable attack in range:
- Nothing resolves. Cosmetic flourish at most. Lockout still applies (§3).

---

## §5 — The Hype meter and the signature trigger

**Hype** is the in-run offensive resource. Per-player, per-run.

- **Fills on Hit the Beat**, by an amount **scaled by precision within the window** — a
  press dead on the beat banks maximum Hype; a press near the window edge still parries
  (still negates, still staggers/reflects) but banks less. This is the skill gradient: kids
  land it anywhere and get *some* Hype; precise players reach the payoff faster. It gives
  P7's reward-stacking and P10's two-profiles **without** a confusable two-tier call-out.
- **No streak mechanic.** Hype accrues per-parry independently; there is no consecutive
  count to build or break. This is a deliberate choice to sidestep the defensive
  "don't-break-the-streak" mindset risk. *(PARRY-RESEARCH OQ7 / DESIGN-PILLARS OQ7 — this
  design is the proposed answer; validate in playtest.)*
- **No decay** in the prototype. Hype persists through the run. A kid who parries only
  occasionally still reaches the payoff eventually — that is the point of an optional,
  rewarding mechanic. Decay is a parked tuning question (§10).
- **Full meter auto-triggers the hunter's signature power** (= their song-line). No extra
  input to learn — parry enough, and something great happens. This imposes one design
  constraint on the hunter spec: **signature powers must be "always good to fire,"** since
  the player does not choose the moment. Manual-spend is a parked full-game question (§10).

**Boundary — do not confuse these two:**
- **Hype** = in-run, resets every run, lives in `ParrySystem` state.
- **Song-line quality** = persistent across runs, lives in `SaveSystem`.
- The relationship: how well the player engaged the parry layer during a run is *one input*
  to the end-of-run song-line improvement. The formula is the meta-progression spec's job,
  not this one.

---

## §6 — The prototype's parryable attacks

Tied to the five enemy archetypes and the boss from PROTOTYPE-SCOPE.md. The Mosher,
Backup Dancer, and Bouncer telegraphs are this layer's responsibility; the Headliner's
specific signatures are the Headliner spec's, and only the generic interaction is fixed
here.

| Source         | Attack         | Beat Ring tempo | On Hit the Beat                               | On Miss                                    |
|----------------|----------------|-----------------|-----------------------------------------------|--------------------------------------------|
| Mosher         | Straight lunge | **Slowest** — this is the teaching parry; the ring is generous and readable | Lunge negated, Mosher staggered             | Lunge connects if in its line; sidesteppable |
| Backup Dancer  | Lobbed projectile | Medium       | Projectile **reflected** as damage            | Projectile lands; area hit if in it        |
| Bouncer        | AOE slam       | Medium          | Slam negated, no damage ring, Bouncer staggered | Slam ring damages if in radius; dodgeable  |
| Headliner      | 2–3 named signatures | Per-attack; some fast, some slow *(P9)* | Per attack: reflect or negate+stagger; banks **large** Hype — the fast path through the fight | Signature resolves; dodgeable, never a binary punish |

Note the deliberate teaching ladder: the Mosher's lunge is the slowest, most generous ring
in the game on purpose — it is where a player learns the grammar with no tutorial text.
Fan and Weaver remain un-telegraphed and un-parryable; they are pure dodge-floor pressure.

---

## §7 — Feedback: the non-confusable signatures

The outcomes must be tellable apart from the *moment of contact alone*, without reading any
meter. *(P5.)*

**Hit the Beat:**
- Brief **hitstop** (the original game's hit-pause — port the feel).
- Flash + particle burst at the contact point.
- A **musical sound** — a note or chord stab, not a generic thud. Every parry is a note
  (§1.7). The AudioSystem owns this.
- The Hype meter visibly **jumps**.
- Screen shake, **scaled to precision** — a dead-center beat shakes and flashes bigger than
  an edge-of-window one. The feedback is an analog readout of how clean the parry was; this
  is the gradient, not a second discrete tier.
- On a **stagger**, the attacker's staggered state is unmistakable — it visibly cannot act.

**Miss / take the hit:**
- The existing damage feedback only (port the original's damage juice). Nothing *extra* bad
  for having attempted a parry — the feedback for "missed parry, took hit" and "took hit,
  no parry attempted" is the same.

**The Beat Ring** is itself feedback during the windup — its contraction is the read. It
must remain legible against a busy horde and, in co-op, against a second ring onscreen
(§8).

---

## §8 — Co-op

- **Two players, two independent parries.** Each player has their own parry button (CLAUDE.md
  control map), their own Hype meter, their own signature power.
- Multiple Beat Rings can be onscreen at once — one per active parryable attack. **Ring
  legibility against horde chaos *and* against a second player's ring is the core
  readability risk of this layer** — flag for playtest (§11).
- **No cross-player parry interaction** in the prototype — one player's parry does not feed
  the other's Hype, does not cover the other's attack. Co-op parry synergy is a parked
  full-game idea (§10).

---

## §9 — Tuning surface

Every value below lives in `tuning.ts`. Starting values are suggestions; playtest moves
them.

| Dial                              | Starting value                          | Notes |
|-----------------------------------|-----------------------------------------|-------|
| Parry window width — Widest tier  | ~280 ms                                 | Difficulty dial (§3). |
| Parry window width — Medium tier  | ~200 ms                                 | — |
| Parry window width — Narrowest tier | ~140 ms                               | — |
| Window placement                 | Centered on Strike                      | Centered vs late-biased is a playtest experiment (R2). |
| Post-press lockout                | ~250 ms                                 | Must stay < shortest attack windup (§3). |
| Attack windup — Mosher lunge      | ~1400 ms (slowest — the tutorial)       | Beat Ring contraction time. |
| Attack windup — Dancer lob        | ~900 ms                                 | — |
| Attack windup — Bouncer slam      | ~900 ms                                 | — |
| Attack windup — Headliner signatures | ~600–1000 ms, per-attack             | Set in the Headliner spec; some fast, some slow (P9). |
| Hype gained per parry — max (dead-center) | TBD                             | Set so a competent run reaches one signature trigger at a satisfying rate. |
| Hype precision curve              | Linear from edge→center, starting       | Curve shape is tunable. |
| Hype meter capacity               | TBD                                     | Pairs with per-parry gain. |
| Hype decay                        | Off                                     | Parked (§10). |
| Signature trigger                 | Auto at full meter                      | Manual-spend parked (§10). |

---

## §10 — Out of scope for this spec / parked

- **A discrete PERFECT / GOOD two-tier outcome.** The prototype uses one window with graded
  Hype instead. Whether a discrete tier reads better is a playtest question (§11), not a
  prototype feature.
- **Hype decay.** Off for the prototype.
- **Manual signature spend.** Auto-trigger for the prototype. Manual spend would need the
  reserved third action key, which is a CLAUDE.md chat-level decision.
- **Cross-player co-op parry synergy.** Each player's parry is their own.
- **An unparryable "red-attack" boss tier.** Already out per PROTOTYPE-SCOPE.md; restated
  here as it is the natural place a reader would look. *(PARRY-RESEARCH R7 — parked v2.)*
- **The Headliner's specific signature attack designs** — Headliner spec.
- **The hunters' signature power designs** — hunter spec.
- **The song-line improvement formula** — meta-progression / SaveSystem spec.

---

## §11 — Open questions for playtest

Paper cannot resolve these. The kids' hands resolve them.

1. **Does the single-window + graded-Hype model read more clearly than a discrete
   PERFECT/GOOD tier?** This is the spec's central design bet. Validate it.
2. **Is the widest window genuinely kid-landable?** If a six-year-old cannot reliably Hit
   the Beat on the Mosher at the easiest tier, the floor is broken — widen it.
3. **Does the Beat Ring grammar survive horde chaos** — and, in co-op, two rings at once?
   The core readability risk of the layer (§8).
4. **Centered vs late-biased window placement** — which feels better? *(R2.)* May differ by
   attack type.
5. **Does no-decay Hype feel right, or does the auto-triggered signature feel "random"**
   because it can fire at an arbitrary moment? If random-feel is a problem, the levers are
   decay, manual spend, or designing signatures to be even more reliably "good to fire."
6. **Does graded-per-parry Hype actually sidestep the streak-mindset risk** the way §5
   claims? *(OQ7.)* Watch whether players still play "protectively."
7. **Does the stagger land as "the dance"** — do players feel that a parry made the fight in
   front of them better, not just banked a meter? *(P1, OQ9.)*
8. **Does parry feel meaningfully *greedy* versus just dodging** — or do players default to
   dodging because the parry upside is not visceral enough?

---

<!-- HIT-THE-BEAT-SPEC.md v1.0 — Prototype #1 parry layer. Locks the telegraph grammar
(the contracting Beat Ring, one shared language across all parryable attacks), a
single-window timing model with width as the difficulty dial and graded Hype for precision,
three outcomes (Hit / Miss / inert) with reflect-or-negate+stagger as the greedy payoff,
the per-player per-run Hype meter with auto-triggered signature powers, the prototype's
parryable attack set (Mosher / Backup Dancer / Bouncer / Headliner), non-confusable
feedback signatures, co-op handling, the full tuning surface, and 8 playtest open
questions. Maps to src/systems/ParrySystem.ts. Subordinate to DESIGN-PILLARS.md,
PROTOTYPE-SCOPE.md, CLAUDE.md; informed by PARRY-RESEARCH.md. Co-authored: Brad + Claude
Chat. -->
