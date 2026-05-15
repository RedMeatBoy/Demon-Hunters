# HUNTER-SPEC.md — The Three Hunters

> Spec for Prototype #1's three playable hunters. Subordinate to
> DESIGN-PILLARS.md, PROTOTYPE-SCOPE.md, CLAUDE.md. Read those first.
> Cross-references HIT-THE-BEAT-SPEC.md — this spec owns the constraint that
> spec handed down (see §3).
>
> Maps to `src/config/hunters.ts` (the data) and `src/entities/Hunter.ts`
> (the entity). Auto-attack behavior is `src/systems/CombatSystem.ts`'s job;
> signature powers are triggered by `src/systems/ParrySystem.ts` per
> HIT-THE-BEAT-SPEC. All numbers here are **starting values** — they live in
> `tuning.ts` and are expected to move in playtest. The spec locks the
> *structure and identity*, not the final dials.

---

## What this spec covers — and what it does not

**Covers:** the three hunters as designed objects — their auto-attack identities,
how auto-attacks target, their signature powers, their base stats, and the data
shape that expresses all of it.

**Does not cover, by design:**
- The mechanics of `CombatSystem` — how hit detection, swing arcs, and projectiles
  are *implemented*. This spec says what each hunter's attack *is*; the combat
  build brief says how it is built.
- The parry layer — owned by HIT-THE-BEAT-SPEC. This spec only specifies what each
  hunter's full-Hype signature power *does*, since HIT-THE-BEAT-SPEC explicitly
  deferred that.
- The five enemy archetypes — owned by the combat/enemy brief. This spec
  references them only as targets.
- Character art, names beyond the working drafts, voice, or backstory.

---

## §1 — The cast (locked identities)

Three hunters. Working-draft names; the *roles* are load-bearing, the names are
not. Note: DESIGN-PILLARS.md is being amended alongside this spec so Bex reads as
the bruiser and Nim as the kiter — the weapon identities below are canon.

| Hunter | Role / feel              | Weapon         | Song-line | One-line identity                          |
|--------|--------------------------|----------------|-----------|---------------------------------------------|
| Riya   | The lead — honest baseline | Sword         | Melody    | No weakness, no spike. The first-timer's pick. |
| Bex    | The bruiser              | Staff          | Rhythm    | Slow and heavy. Stand your ground and delete. |
| Nim    | The kiter                | Throwing stars | Harmony   | Fast and far, hits light. Never be cornered. |

The three song-lines (Melody / Rhythm / Harmony) are unchanged from DESIGN-PILLARS
and do not depend on weapon identity.

---

## §2 — Auto-attacks

All three hunters **auto-attack** — no attack button, consistent with the
move-only promise (DESIGN-PILLARS Pillar 2). The player's only job is positioning;
the attack fires on its own.

### Targeting — nearest enemy, all three hunters

Every hunter's auto-attack targets the **nearest enemy within range**, automatically.

- The player never aims. This keeps the move-only promise intact and means the
  kids never fight the controls. *(DESIGN-PILLARS Pillar 1, Pillar 2.)*
- A melee swing (Riya, Bex) orients its arc toward the nearest enemy at the moment
  it fires. A projectile (Nim) launches toward the nearest enemy at the moment it
  fires.
- If no enemy is in range, the attack does not fire (or fires a harmless idle
  flourish — a `CombatSystem` implementation call, not a design requirement).
- "Nearest" is by straight-line distance to the hunter. If a tie needs breaking,
  any stable rule is fine — this is not a balance-sensitive decision.

### The weapon triangle (the rebalanced, locked design)

Three axes — **attack speed** (how often it fires), **range** (how far it
reaches), **damage** (per hit). The design rule that makes this balanced: **each
non-baseline hunter is best at exactly one thing and worst at exactly one thing,
and no hunter is top-two on every axis.** Riya is the deliberate exception — all
medium, the honest baseline.

| Hunter | Attack speed | Range    | Damage   | Best at        | Worst at |
|--------|--------------|----------|----------|----------------|----------|
| Riya   | medium       | medium   | medium   | — (baseline)   | — (baseline) |
| Bex    | **slowest**  | medium   | **heaviest** | damage     | speed    |
| Nim    | **fastest**  | **longest** | lowest | speed + range  | damage   |

**Why this is balanced — the reasoning, so it is not "tuned away" later:**

- **Riya** is the control case. In a three-hunter roster, one pick with no spike
  and no hole is good design — she is who you hand a nervous first-timer, and she
  is the yardstick the other two are read against. She must stay all-medium.
- **Bex and Nim are answers to *different problems*, not the same problem at
  different quality.** Bex is "stand and delete" — slow swings that one-shot
  through the swarm, where her heavy damage is not wasted on grouped enemies. Nim
  is "stay back and pepper" — she never wants to be close, and her range + speed
  let her not be.
- The earlier draft had Bex best at *both* range and damage and Nim best at only
  speed — that made Bex close to strictly better, because in a horde of 1-HP
  enemies, heavy damage and overkill clear a `Fan` just as dead as a fast light
  hit does. **Bex giving up "longest range" to Nim is the specific change that
  balances the pair.** Nim *owns* range; Bex *owns* damage; neither owns both.
- The triangle is balanced **as a triangle** — do not tune one hunter's axis in
  isolation. If Bex feels weak, the question is "weak versus Nim and Riya," not
  "weak in absolute." Tuning notes belong in playtest evidence (§7), not intuition.

### Concrete starting values

All in `tuning.ts`. Suggestions — playtest moves them. Expressed as relative
multipliers off Riya = 1.0 baseline, so the triangle stays legible as a triangle.

| Hunter | Attack interval | Range          | Damage per hit |
|--------|-----------------|----------------|----------------|
| Riya   | 1.0× (baseline) | 1.0× (baseline) | 1.0× (baseline) |
| Bex    | ~1.5× (slower)  | 1.0×           | ~2.0× (heavy)  |
| Nim    | ~0.6× (faster)  | ~1.5× (longest) | ~0.5× (light) |

The baseline absolute values (Riya's interval in ms, range in px, damage per hit)
are also `tuning.ts` constants — set them when `CombatSystem` is built, against
the enemy HP values from the combat/enemy brief.

---

## §3 — Signature powers

Each hunter has **one signature power**, triggered automatically when their Hype
meter fills (HIT-THE-BEAT-SPEC §5). One of each *flavor* across the three —
defensive, offensive, buff — so the hunters differ in **both** their
moment-to-moment verb (§2) **and** their payoff moment.

### The constraint this spec owns

HIT-THE-BEAT-SPEC §5 handed down a hard constraint and named this spec as its
owner:

> **Signature powers must be "always good to fire,"** because Hype auto-triggers
> and the player does not choose the moment.

Every power below is designed to satisfy it. The test for each: *if this fires at
the worst possible moment — player at full health, only one weak enemy onscreen —
is it still fine? Never a downside, never a "wasted" feeling.* A power that fails
that test does not ship; it gets redesigned, not given a manual trigger (manual
trigger is a parked full-game question per HIT-THE-BEAT-SPEC §10).

### The three powers

| Hunter | Flavor    | Working name | What it does                                                                 |
|--------|-----------|--------------|------------------------------------------------------------------------------|
| Riya   | Defensive | "Breakdown"  | Clears / hard-shoves the horde in a radius around her — instant breathing room. |
| Bex    | Offensive | "Drop"       | A large burst of damage — a single decisive hit on everything in a wide area in front of her. |
| Nim    | Buff      | "Bridge"     | A short window (a few seconds) of greatly boosted attack speed — she becomes a fountain of stars. |

**Why each satisfies "always good to fire":**

- **Riya — Breakdown (defensive).** Clearing space is never bad. At worst (one weak
  enemy, full health) it is mildly redundant — but redundant is not a *downside*.
  It never costs the player anything. Safe to autofire.
- **Bex — Drop (offensive).** Free damage is never bad. At worst it overkills a
  weak enemy — wasted potential, but not a loss. The player is never punished for
  it landing. Safe to autofire.
- **Nim — Bridge (buff).** A buff window with no cost and no downside. At worst the
  extra fire rate has thin targets — again, redundant, not harmful. Safe to
  autofire. (Design note: the buff is *attack speed* specifically because it
  compounds Nim's existing identity — the kiter becomes an overwhelming kiter —
  rather than papering over her weakness. It does not, for example, give her
  Bex's damage. A signature should amplify identity, not erase it.)

### Notes binding on implementation

- Each power is **a discrete event**, fired by `ParrySystem` when Hype is full,
  then Hype resets (HIT-THE-BEAT-SPEC §5). This spec does not own the trigger
  plumbing — it owns what fires.
- Each power needs **unmistakable feedback** — a signature power going off is a
  peak spectacle moment (DESIGN-PILLARS Pillar 5). Big, loud, distinct per hunter.
  `FeedbackSystem` and `AudioSystem` own the execution; this spec just flags it is
  required, not optional polish.
- Powers must be **co-op-safe** — two hunters firing signatures at once must not
  break or visually drown each other. Each is self-contained, affects only its own
  owner's surroundings/targets.
- The thematic frame: a signature power is the hunter laying down their **line of
  the song**. Riya's, Bex's, Nim's powers feeling distinct in *kind* is what makes
  "three voices make a song" cohere (DESIGN-PILLARS Pillar 3, Pillar 4).

---

## §4 — Base stats

**Identical for all three hunters in the prototype.** Health and move speed are
the same for Riya, Bex, and Nim.

- Differentiation lives entirely in *what a hunter does* — their auto-attack (§2)
  and their signature power (§3) — never in the *body*.
- **Move speed is deliberately equal and this is a hard line.** In a move-only
  co-op game, a slower hunter does not read as "character variety" to a young
  player — it reads as "my guy is worse." Equal move speed also keeps the shared
  fixed-wide camera framing honest (PROTOTYPE-SCOPE.md). *(DESIGN-PILLARS
  Pillar 1.)*
- Equal health for the same reason — no hunter is "the fragile one" in a
  kids-first prototype.
- Per-hunter base stats are a strong *full-game* lever and are parked there, not
  cut forever — see Open Questions.

The values themselves (the shared health number, the shared move-speed number)
live in `tuning.ts`. Move speed already exists there from the scaffold
(`HUNTER.MOVE_SPEED_PX_PER_SEC`); health is added when it first matters (when
enemies can deal damage — the combat/enemy brief).

---

## §5 — Data shape

The three hunters live as **data in `src/config/hunters.ts`** — per CLAUDE.md's
content-as-data rule. Adding or changing a hunter means editing that file, never
editing `CombatSystem` or `ParrySystem`.

Each hunter entry should express, at minimum:

- Identity: id, working name, song-line.
- Auto-attack: weapon kind (`sword` / `staff` / `stars` — i.e. melee-arc vs.
  projectile), and the three triangle values (attack interval, range, damage),
  ideally as the relative multipliers in §2 so the triangle stays readable.
- Signature: which power, expressed so `ParrySystem` can fire it without a
  `switch` on hunter id (a power identifier the systems resolve, not inline
  per-hunter logic).

`CombatSystem` reads weapon-kind to decide melee-arc vs. projectile behavior — but
the *behaviors themselves* are general (one melee-arc implementation, one
projectile implementation), parameterized by the data. Per CLAUDE.md: if you find
yourself writing `if (hunter.id === 'Riya')` inside a system, stop — that
difference belongs in `hunters.ts`.

The `Hunter` entity (`src/entities/Hunter.ts`) stays dumb data per CLAUDE.md — it
already holds id + position + sprite from the scaffold. It may also hold a
reference to its config entry and its current Hype; it owns no behavior.

---

## §6 — Out of scope for this spec / parked

- **The `CombatSystem` implementation** — how swing arcs and projectiles actually
  work. Combat/enemy brief.
- **The five enemy archetypes** — combat/enemy brief.
- **Per-hunter base stats** (different health/speed per hunter) — parked as a
  full-game lever (§4).
- **Manual signature trigger** — parked by HIT-THE-BEAT-SPEC §10; if ever wanted,
  it needs the reserved third action key, a CLAUDE.md chat-level decision.
- **Verse / upgrade interaction with hunters** — whether some verses are
  hunter-specific. `upgrades.ts` is its own future spec; for now assume verses are
  hunter-agnostic.
- **A fourth+ hunter** — out per PROTOTYPE-SCOPE.md.
- **Character select UI** — `MenuScene` is still a stub; how a player is assigned
  a hunter is a later task.
- **Hunter art, final names, voice, backstory.**
- **NPC / non-player hunters** — flagged from the co-op build: `HunterId` and
  `PlayerId` are currently the same type. They only need to diverge if a
  non-player hunter is ever introduced (e.g. a defeated-boss-becomes-ally
  pattern). Not a prototype concern; noted so the decision stays visible.

---

## §7 — Open questions for playtest

Paper cannot resolve these. The kids' hands resolve them.

1. **Is the weapon triangle actually balanced in play** — do two kids pick
   different hunters and both feel effective, or does one hunter quietly dominate?
   The §2 reasoning is a hypothesis; playtest is the test.
2. **Is Bex's slow swing *satisfying* or just *sluggish*?** A slow heavy hit has
   to feel weighty and decisive — if it feels unresponsive instead, the issue may
   be feedback (hitstop, screen shake) rather than the interval number.
3. **Is Nim's low damage *frustrating*?** The kiter fantasy only works if peppering
   feels effective. If Nim feels weak rather than nimble, the lever is fire rate
   and feedback density, not damage — raising her damage erases her identity.
4. **Does nearest-enemy targeting ever feel "wrong"** — does the auto-attack pick a
   target the player did not expect or want, in a way that feels like fighting the
   game? If so, the tie-break or the "nearest" definition may need a tweak.
5. **Do the signature powers read as distinct?** Riya's, Bex's, Nim's should feel
   like three different *kinds* of moment, not three booms. If they blur together,
   the feedback (§3) is doing too little.
6. **Does an auto-triggered signature ever feel wasted or random** despite the
   "always good to fire" design? If it does, this is the same lever
   HIT-THE-BEAT-SPEC §11 Q5 flags — revisit decay or manual spend at the full-game
   level.
7. **Does Riya — the no-spike baseline — feel boring** next to two spiky hunters?
   Some players love the honest pick; if she feels flavorless rather than
   reliable, her signature (Breakdown) may need to carry more of her character.

---

<!-- HUNTER-SPEC.md v1.0 — Prototype #1, the three hunters. Locks: the cast and
weapon identities (Riya/sword/baseline, Bex/staff/bruiser, Nim/stars/kiter — with
a matching DESIGN-PILLARS amendment); auto-attack via nearest-enemy targeting for
all three; the rebalanced weapon triangle (each non-baseline hunter best at one
axis, worst at one, none top-two on all — Bex owns damage, Nim owns range+speed,
Riya all-medium); the three mixed-flavor signature powers (Riya defensive
"Breakdown", Bex offensive "Drop", Nim buff "Bridge"); and ownership of
HIT-THE-BEAT-SPEC's "signatures must be always-good-to-fire" constraint. Base
stats identical across hunters (move speed equal is a hard kids-first line).
Content lives as data in src/config/hunters.ts. Maps to hunters.ts +
Hunter.ts; auto-attack impl deferred to the combat/enemy brief, signature trigger
plumbing owned by ParrySystem. Subordinate to DESIGN-PILLARS.md,
PROTOTYPE-SCOPE.md, CLAUDE.md. Co-authored: Brad + Claude Chat. -->
