# Bottom of the Ninth — Parry/Dodge Cross-Game Research

> Cross-game close-read of parry and dodge design, with audit against current
> Bottom of the Ninth specs and concrete recommendations. Subordinate to
> DESIGN-PILLARS.md, PROTOTYPE-SCOPE.md, FASTBALL-SPEC.md, M2_5-SPEC.md,
> CURVEBALL-SPEC.md, COMBAT-DESIGN-SPEC.md. Read those first.
>
> Output of the parry-research kickoff (2026-05-11).

---

## Pressure-test result: proceed

The kickoff asked whether this research is the right next priority. Yes:

- **Parry was just felt in playtest** (post-perspective-rebuild build, son+daughter 2026-05-09; combat-room M1B.3 hands-on 2026-05-11). Reactions are still fresh and concrete.
- **Tuning windows are wide-open.** Combat-parry is at 400/150ms loose for testability, due for tightening in M1B.5. Cross-game research informs *where* to tighten, not just *that* it needs tightening.
- **At-bat is mid-iteration.** Curveball v2 not yet implemented, changeup spec'd but unbuilt. Decisions made now propagate into both pitches.
- **Pre-empts revisiting later.** Doing this research after M1B.4-5 would mean revisiting tuning decisions that already got baked in.

No strong reason to delay. Proceeding.

---

## §1 — Principles (10)

Each principle is named, testable, and drawn from cross-game patterns rather than any single source.

### P1 — The dance of offense and defense

Parrying is most resonant when it *creates* offense, not just *prevents* damage. The Sekiro gold standard is that deflecting fills the enemy's posture meter, so playing perfect defense is also dealing damage — "Performing several deflects in quick succession does more posture damage to an enemy" and the player can chain into a deathblow when the meter breaks. Nine Sols inherits half of this — parries grant Qi charges that fuel Talisman detonations — but community discourse explicitly calls out that "in Nine Sols, parrying is only for defense. Enemies don't react to your offense", which limits the dance. Testable as: *does landing a parry visibly advance an offensive resource the player can spend?* If the answer is no, the parry is half a verb.

### P2 — Anticipation, not reaction

Parry windows in this neighborhood (60–200ms) are below reliable human reaction time. Players cannot *react* to the ball entering the window — they must *anticipate* it. Lies of P measured at ~130ms perfect-guard caused widespread "I can't REACT, I have to study moveset first" complaints in community threads, while Sekiro's ~200ms with consistent attack speeds reads as fair. The fix is not wider windows; the fix is windup tells distinctive enough that the player can pre-commit to the swing. Testable as: *can the player describe what the windup looked like before they swung, or did they swing on guess?* FASTBALL-SPEC's identity-lock on a square body trapezoid and clean arm swing exists precisely to make this anticipatable.

### P3 — Perfect-window placement (centered vs asymmetric)

A "perfect" window nested inside a "hit" window can be centered, front-loaded, or late-biased — each teaches a different feel. Sekiro's deflection rewards pressing right when the attack lands; the perfect feels like a confident mid-swing read. Lies of P advice converges on pressing *before* the attack visually connects (because attack animations are quicker than windups). Hi-Fi Rush bakes the moment into a beat overlap. Centered (current Bottom of the Ninth design) is the safest default — Hades-school. But late-biased could feel like "I waited as long as I dared and *got* it," which is a different emotional payoff. Testable as: *do players say "I felt brave" or "I felt precise" when describing perfect parries?*

### P4 — Graceful failure modes

A miss that becomes a worse-but-not-broken outcome reads as forgiving. Lies of P's failed perfect guard <q>transitions to normal Guard (no vulnerability gap)</q> means an early press is still a block — the player loses the perfect upside, not the round. Sekiro's mistimed deflect is still a block with chip damage. Hollow Knight requires attack-collision but failed parry just means you took a hit. The shared pattern: the mechanic is more forgiving than it looks because the failure mode is graded, not binary. Bottom of the Ninth's strikeout-on-three-misses is harsher because each miss is one of three strikes; the consequence curve is steep. Testable as: *does a single missed swing feel costly, or just feel like "I'll get the next one"?*

### P5 — Audiovisual feedback richness — non-confusable signature

The moment of contact is where personality lives. Every reference game over-delivers here: Sekiro's spark count visibly scales with how close you were to perfect; "Sparks will show up based on how close you were to deflecting". Hi-Fi Rush layers screen flash + sound effect + hitstop + combo indicator. The non-negotiable principle is that PERFECT and HIT (or their equivalents) must be non-confusable — different colors, different fonts, different audio. Bottom of the Ninth already commits hard here (manga text, hit-pause, shake, particles, zoom, color flip on trail). Testable as: *can the player tell the difference between PERFECT and HIT without looking at any meter, just from the contact moment?*

### P6 — Tell legibility — pre-attack vs in-flight

Parry-centric games split into two camps. Camp 1 (Sekiro, Punch-Out!!) loads all the read into the *pre-attack windup* — by the time the strike actually starts, the player should already know what's coming. "To be a Punch-Out!! master, one must have an excellent memory… if an opponent so much as winks at Little Mac, or shakes his left hand, the gesture is likely significant". Camp 2 (Hollow Knight, Returnal) uses *in-flight cues* — projectiles have distinct colors, speeds, shapes that read mid-air. Bottom of the Ninth is a Camp 1 game with light Camp 2 support (ball color codes pitch type, but that's flagged as a programmer-art crutch that goes away). Testable as: *if you mute the color-coded ball, can the player still tell the pitch type?* If not, the windup tells aren't carrying enough weight.

### P7 — Reward stacking — building toward something

Sekiro's posture meter, Punch-Out's star counter, Nine Sols' Qi charges, Hi-Fi Rush's combo gauge, Lies of P's Fable — every game with deep parry design has a *meter that fills with parries* and *something cool that spends the meter*. "successful counters build stars that enable uppercuts to deplete health faster" from Punch-Out is the structural template. Isolated parries feel good once; stacking parries feel like a *run*. Bottom of the Ninth's at-bat structure (3 contacts = door unlock) is binary — perfects don't compound beyond their spectacle. Testable as: *does the player feel a "streak" forming during an at-bat, or is each pitch an independent event?*

### P8 — Difficulty scales the timing, not the rules

The accessibility move every reference game makes: when you turn down difficulty, you widen the windows; you don't change the mechanic. Expedition 33 explicitly does this — "the game has a story mode difficulty level where the timing windows for both parrying and dodging are bigger". Hades 2's Athena boon system is the same idea expressed as build choices. The skill ceiling stays the same; the floor moves. Bottom of the Ninth's Rookie/Veteran/All-Star planned toggle is structurally correct. Testable as: *does the All-Star player and the Rookie player describe the same mechanic, just at different speeds?*

### P9 — Pacing rhythm — the breath between parries

The interval between parry opportunities matters as much as the windows themselves. Sekiro's "dance" requires offensive lulls; Punch-Out's bouts pace patterns across three rounds; Hi-Fi Rush quantizes everything to musical beats; the Bottom of the Ninth at-bat compresses 1800 → 1200 → 900ms across three pitches. The principle: a parry rhythm that *tightens* across an encounter produces escalating pressure without changing the input vocabulary. Testable as: *does pitch 3 feel harder than pitch 1 even when the windup is identical?*

### P10 — Same mechanic, two player profiles

The hardest design problem: the mechanic must feel like *practice* at one skill level and *fight* at another, without splitting into two games. Hi-Fi Rush solves this by auto-syncing attacks to the beat — even a bad player gets *some* parries, while a good player threads the timing for combo finishers. Sekiro and Nine Sols solve it through progression — early enemies are practice, late bosses are fights. Bottom of the Ninth's changeup spec explicitly bakes this in (<q>tune toward: "first time tricks them, third time they read it"</q>) — that target should generalize. Testable as: *does Eric describe the same pitch type as "fun" while Brad describes it as "tense"?*

---

## §2 — Per-game close reads

One paragraph each. Highlighting what's portable to Bottom of the Ninth.

### Sekiro: Shadows Die Twice — the gold standard

The genius is that *deflection IS the offense*. The posture meter on both fighters means defending is dealing damage — "the game is at its best when you are in this dance of offense until deflected, then deflecting the retaliation, then comboing back". Hitting an enemy's block builds their posture even though it does no health damage. Damaging health slows posture recovery, so chip damage matters mid-fight. Sparks at the deflect moment scale visibly with timing precision, giving the player a feedback gradient instead of a binary read. The deflect window is roughly 200ms by community measurement, which is right at human anticipation threshold. **Portable:** the posture-as-currency model, the dance structure, the spark-precision feedback. **Not portable:** the active offense (Bottom of the Ninth's player doesn't have a swing-back equivalent within the at-bat itself; the "offense" is whatever the at-bat unlocks downstream).

### Hi-Fi Rush — rhythm as parry teacher

The whole game quantizes to musical beats; the parry is just the beat-aligned button on incoming attacks. The visual indicator is two overlapping circles — "a Light Blue Circle overlaps with the Pink Circle" — and that overlap *is* the timing cue. Forced-parry segments train the mechanic by requiring it; later sections reward it with combo finishers. The "Rhythm Parry" enraged-enemy mode breaks the music's regular beat and requires reading a *different* rhythm — same vocabulary, harder problem. **Portable:** the idea that parry timing can be *taught* by a continuous synced cue (Bottom of the Ninth has a similar in-spirit pattern with pitch sequencing 1800/1200/900ms — that's a metronome players will internalize). **Not portable:** the music-locks-input mechanic; baseball pitches don't have a beat, they have a flight time.

### Punch-Out!! — the closest mechanical analog

The original parry-as-at-bat. A series of boss fights where each opponent has a *fixed pattern* — eyebrow twitches, glove jerks, dance animations, named windups like Hondo Rush. "A player learns these 'visual tells' the hard way: by getting hit and KO'd hundreds of times." Stars-as-reward — perfect reads against specific cues earn Star Punches, which are devastating. Heart counter as exhaustion mechanic: blocking, getting hit, and missing all deplete it; zero hearts = can't attack until you dodge to recover. Win conditions: KO, TKO, decision. **Portable:** named special pitches (Hondo Rush analog → "The Curveball-In," "Wild Thing's signature pitch"), pattern-recognition as the primary skill, the heart-counter idea as a fatigue/discipline meter, the named-pitch identity for The Nine's bosses. **Not portable:** the punch-back input — Bottom of the Ninth is timing-only by lock.

### Hollow Knight / Silksong — parry as a side option

Parrying isn't a dedicated button — Hornet's needle attack that *collides with the enemy's weapon* mid-attack counts as a parry, with a "ping" sound, white flash, and minor hitstop. Cross Stitch (dedicated parry as a Silk Skill) is an *optional* unlock behind a secret boss. The mechanic is hard to react to; players are advised to "observe enemy attack patterns and timing your slash so it collides with theirs… if you're trying to parry on reaction, you'll most likely fail". **Portable:** the white-flash + ping + hitstop trinity is a universally readable "you did the parry" signature; the idea that parrying is optional (avoidance is also valid) gives players agency. **Not portable:** the attack-collision model — Bottom of the Ninth's bat is on a fixed contact angle, doesn't collide with anything by direction.

### Expedition 33 — turn-based parry as accessibility lens

Parry is high-risk/high-reward — perfect timing negates damage, grants Action Points for the next turn, opens counterattacks. Dodge is the safer-but-less-rewarding alternative with a more forgiving window. Crucially, Story Mode difficulty "the timing windows for both parrying and dodging are bigger" — same mechanic, different tolerance. Enemy attacks often align with the game's musical rhythm, so the soundtrack is a metronome. **Portable:** the difficulty-scales-windows-not-rules pattern (already in Bottom of the Ninth's planned Rookie/Veteran/All-Star), the parry-as-AP-generator analog (perfects could generate something the at-bat structure spends — see Recommendations §R1). **Not portable:** the turn-based pacing; Bottom of the Ninth is real-time.

### Hades / Hades 2 — deflect as build choice

Athena's Divine Dash makes dashing through projectiles reflect them. In Hades 1 this was nearly mandatory because every projectile was deflectable; in Hades 2 the Hades team deliberately limited it — "AOE/zone damage isn't deflectable", fewer projectile types qualify, Athena's boons are harder to acquire. The principle: deflection is *one tool among several*, not a universal answer. **Portable:** the idea that not everything should be parryable. Bottom of the Ninth's strikeout pitch (4th pitch + strike count = strikeout) is currently "miss it and you eat the consequence" — but a future variant might be "this pitch *can't* be parried, only avoided" (out of scope per locked decisions, but worth noting for combat-room verbs). **Not portable:** the boon system itself (no permanent build-into-deflect in this prototype).

### Lies of P — leniency curve experiment

Perfect-guard window is ~130ms by community measurement, tighter than Sekiro. The result is community discourse split between "feels precise" and "I can't REACT, I have to study moveset first." Critical leniency: failed perfect-guard transitions to normal Guard (with chip damage) instead of a vulnerability gap, so an early press is graded, not binary. Fury Attacks (red glow) are perfect-guard-only — adds *forced* perfection moments without changing the base mechanic. **Portable:** the graceful-failure-into-normal-block pattern (currently Bottom of the Ninth's miss-then-strike is binary), the idea of a single forced-perfect attack per encounter (could be the "All-Star pitch type" — appears once per at-bat, perfect-only). **Not portable:** the chip-damage-on-block — there's no equivalent in a parry-based at-bat.

### Nine Sols — 2D Sekiro school

Two parry outcomes: normal and perfect. Both grant Qi charges, but perfect resets the enemy's damage-regen timer (so accumulated damage *sticks*). Three eventual parry types: normal, bouncing, and Unbound Counter (for crimson unparryable attacks). The community-flagged limit: Nine Sols only has the defensive half of Sekiro's dance — "You can attack only when you have a guaranteed, safe opening. You're not allowed to create openings, only wait for them". **Portable:** the both-tiers-grant-resource model (Bottom of the Ninth currently grants no resource on HIT, only the door progression — consider a small reward for HIT too), the unparryable-attack-tier idea (the crimson attacks are a different skill that uses the same input). **Not portable:** the second-half-of-Sekiro problem applies to Bottom of the Ninth too — pitchers don't react to your contact, they just throw the next pitch. That's the at-bat's identity, not a bug.

### Returnal — bullet hell as the negative case

Returnal *doesn't have a parry* — it has dodge-dash (i-frames during dash) and melee (close-range punisher). Bosses layer slow + fast attacks in escalating combos; the player reads patterns over many runs. Knowledge accumulates faster than reflex. The negative lesson: when projectile count is high and the player has spatial agency, parry doesn't earn its place — dodge is enough. **Portable:** the lesson that parry needs to *do something dodge doesn't*. In Bottom of the Ninth there is no dodge — parry is the only verb — so this is moot for the at-bat. For the combat rooms (Pitcher's Mound bullet-hell), where the player has spatial movement, parry must offer something dodge doesn't (e.g., reflect damage, like Hades' Athena). **Not portable:** Returnal's gun + dash combat layer; Bottom of the Ninth has neither.

### Pragmata — pattern-based attack timing

Less material available in cross-game analyses; this is brief by necessity. The community read is that combat is pattern-based with telegraphed enemy attacks the player must read and time against. Eric plays it. **Portable:** confirms the pattern-recognition-over-reflex thesis (P2, P6, P10) holds across modern action games. **Not portable:** without deeper close-read, no specifics to lift.

---

## §3 — Audit: Bottom of the Ninth vs principles

Status: ✅ aligned / ⚠️ partial / ❌ gap / 🚫 contradicts. Severity for gaps: **blocking** / **important** / **polish**.

| # | Principle | BotN status | Severity | Where it lives / where it's missing |
|---|---|---|---|---|
| P1 | Dance of offense and defense | ⚠️ partial | important | At-bat is a one-sided wall: player parries, pitcher throws. No "offense" loop within the at-bat — the offense is the *outcome* (door unlocks). Combat rooms get closer to this via parry-reflect (M1B.3) but the reflection-vs-Reliever loop isn't yet a "dance." |
| P2 | Anticipation, not reaction | ✅ aligned | — | Windup tells locked by FASTBALL-SPEC + CURVEBALL-SPEC; pitch type readable from windup before flight. |
| P3 | Perfect-window placement | ✅ aligned | (polish if retested) | Currently centered (60ms inside 180ms hit). Late-biased is worth testing but not a current gap. |
| P4 | Graceful failure | ❌ gap | important | A missed swing = 1 strike, 3 strikes = strikeout, no graded fallthrough between "perfect" and "nothing." Spec'd vocabulary already includes WHIFF/EARLY/LATE — those names suggest gradation, but the consequence is binary. |
| P5 | Audiovisual feedback richness | ✅ aligned | — | Manga text + hit-pause + shake + particles + zoom + trail-color-flip on PERFECT. Already richer than most comp set. |
| P6 | Tell legibility | ⚠️ partial | important | Strong windup tells (body trapezoid skew for curveball, longer hold for changeup). In-flight cues are color-coded (red/blue/yellow ball) but flagged as a programmer-art crutch. Decision deferred: are in-flight cues a permanent part of the language, or do they go away with real art? |
| P7 | Reward stacking | ❌ gap | important | Perfect parries are isolated events. No streak meter, no consecutive-perfect bonus, no resource that builds across an at-bat. Spec'd outcome split (PERFECT > HIT > WHIFF > STRIKE OUT) compounds nothing beyond visual punctuation. |
| P8 | Difficulty scales windows | ✅ aligned (planned) | — | Rookie/Veteran/All-Star planned in DESIGN-PILLARS but not yet implemented. Pattern is correct. |
| P9 | Pacing rhythm | ✅ aligned | — | 1800 → 1200 → 900ms tightening cadence is exactly the Sekiro/Punch-Out escalation pattern. |
| P10 | Same mechanic, two players | ⚠️ partial | polish | Changeup spec explicitly targets "first time tricks them, third time they read it" — the right design move. Needs verification across other pitches and at All-Star level. |

**Two gaps marked important** (P1, P4, P7); one partial marked important (P6). One partial marked polish (P10). Everything else aligned.

---

## §4 — Recommendations

Each labeled **Effort** / **Confidence** / **Target doc**.

### R1 — Add a perfect-parry streak meter for the at-bat

A small visual streak indicator that accumulates per consecutive PERFECT inside an at-bat. Three perfects in a row = "PERFECT GAME" finisher: door unlocks with bigger feedback (extra particles, a brief slowdown, a unique manga word). Streak breaks on any non-PERFECT outcome (HIT or WHIFF). The streak doesn't affect door-unlock requirements — it's a *reward layer* on top, not a gate.

This addresses **P1** (resource stacking is the missing offense within the at-bat), **P7** (the reward stack itself), and indirectly **P10** (gives All-Star players something to optimize for that Rookie players can ignore).

- **Effort:** medium (~1 day spec + 2-3 days impl)
- **Confidence:** medium — the principle is well-validated across reference games but the specific implementation needs playtest
- **Target doc:** new `STREAK-SPEC.md` (or extend `FASTBALL-SPEC.md` §Outcome Signatures), update `DESIGN-PILLARS.md` to mention perfect-game streak as a v1 vocabulary item

### R2 — Test late-biased perfect window vs centered

A simple tuning toggle: shift the 60ms perfect window from "centered inside 180ms hit window" to "last 60ms of the hit window" (or "first 60ms"). Run a self-playtest of each configuration for ~30 minutes and a single Eric session.

Hypothesis: late-biased rewards "I waited as long as I dared and got it" — different emotional payoff than the centered "I read the pitch precisely." If late-biased feels better, lock it. If centered feels better, lock it explicitly so it doesn't drift.

- **Effort:** small (one-line tuning change + test sessions)
- **Confidence:** medium — Sekiro and Lies of P discourse splits on this; only playtest can decide
- **Target doc:** `FASTBALL-SPEC.md` §Travel-time decomposition, `tuning.ts`

### R3 — Add a graceful failure tier — "FOUL TIP"

Bottom of the Ninth's miss-then-strike is binary. Adding a graded fallthrough: a press in the EARLY or LATE phase that's *just outside* the 180ms hit window resolves as "FOUL TIP" — does not advance contact, does not advance strikes, but doesn't punish either. Sub-FOUL-TIP misses (way outside the window or no press) resolve as WHIFF.

This addresses **P4** (the graceful-failure pattern from Lies of P) without weakening the core difficulty — three real misses still strike you out, but the *feel* of "I was close but not close enough" gets its own outcome instead of equal punishment with not-trying.

- **Effort:** small to medium (tuning surface + outcome vocabulary + manga text addition; existing EARLY/LATE outcomes can host this)
- **Confidence:** medium — high principle confidence, but risk of softening the at-bat's difficulty curve; needs playtest verification
- **Target doc:** `FASTBALL-SPEC.md` §Outcome Signatures (add FOUL_TIP between WHIFF and HIT), update outcome vocabulary in `DESIGN-PILLARS.md`

### R4 — Decide the in-flight cue identity

Currently FASTBALL-SPEC and CURVEBALL-SPEC color-code the ball (red/blue/yellow) and flag this as a programmer-art crutch — <q>"Red-coding the ball remains a prototype cheat. Real animation will encode pitch type via windup, seam-spin, release tells. Color goes away when art replaces it."</q> But Punch-Out, Sekiro, and Hollow Knight all use *some* in-flight cue (windup carries primary read, but mid-attack shape/color also encodes). Decision needed: is ball-color a permanent part of the visual language, or does the art pass remove it?

This addresses **P6** (tell legibility) and pre-empts a future regression where the art pass strips ball color and the changeup becomes unreadable.

- **Effort:** small (architect decision, no immediate implementation)
- **Confidence:** high (the question itself is well-formed; the answer needs playtest with mute-color toggle)
- **Target doc:** `FASTBALL-SPEC.md` §Open Questions / Parked (decide and remove from parked), `CURVEBALL-SPEC.md` similarly

### R5 — Combat-room parry vs at-bat parry — align or diverge

COMBAT-DESIGN-SPEC v1.4 currently has combat-parry at 400/150ms windows (loose for testability) with a 2.5u spatial gate; at-bat-parry is 180/60ms centered with no spatial component. The two are semantically different — at-bat reads as "swinging a bat at a pitch," combat-room reads as "deflecting a thrown ball in 2D space" — but the input is the same (spacebar).

Three options:
- **A) Align timing.** Combat tightens to match at-bat (180/60ms). Pro: one parry mechanic, one muscle memory. Con: spatial component in combat means timing alone isn't the whole story.
- **B) Diverge intentionally.** Combat stays looser to compensate for spatial gate. Pro: the spatial component is the harder problem in combat, so timing can be more forgiving. Con: players may struggle to switch mental models between at-bat and combat-room.
- **C) Hybrid.** Combat HIT window matches at-bat (180ms), PERFECT window matches at-bat (60ms), spatial gate stays. Effectively: at-bat parry plus a "you must be near the ball" gate.

Recommendation: **option C.** Same timing across both contexts; spatial gate is the combat-only addition. Aligns with **P10** (same mechanic, two contexts) and **P2** (the player's muscle memory transfers cleanly).

- **Effort:** medium — requires tuning sweep + playtest in both contexts
- **Confidence:** medium-to-high
- **Target doc:** `COMBAT-DESIGN-SPEC.md` (would bump v1.4 → v1.5), `tuning.ts` (re-tighten combat parry from 400/150 → 180/60)

### R6 — Sekiro-school "imperfect parry still does something" — for combat

The combat-room currently has parry-reflect (PERFECT and HIT both reflect with same speed/color). What if HIT reflects at incoming speed (current behavior), and PERFECT reflects at the parked REFLECTION_PROJECTILE_SPEED_UNITS_PER_SEC = 10 (1.67× faster)? This is the M1B.3 kickoff's parked escalation gradient. Currently both outcomes look the same, which fails **P5** (non-confusable signature) in the combat context.

This also fulfills **P1** in combat (PERFECT is offense — faster reflected projectile = more damage to Reliever — once Reliever HP lands in M1B.4).

- **Effort:** small (single tuning constant + one if-branch in reflectTowards)
- **Confidence:** high — already designed for, just not wired up
- **Target doc:** `COMBAT-DESIGN-SPEC.md` §Reflection physics, `IncomingProjectile.ts` `reflectTowards()` reads speed from outcome rather than fixed

### R7 — Add the "unparryable pitch" / red-attack tier (post-prototype)

Sekiro's perilous-attack kanji, Nine Sols' crimson Unbound attacks, and Lies of P's Fury Attacks all encode a *different* attack tier with a different rule (perfect-guard only, jump-over, dodge-only, etc.). For Bottom of the Ninth this would be a pitch that *cannot* be parried — say, a "spitball" or "knuckler" with a wild trajectory — and must be intentionally taken as a strike (or, in v2, dodged via an as-yet-undesigned movement verb).

Out of v1 scope (no dodge verb, no aim layer). But worth tracking as a v2 / Wild Thing boss design hook — the boss's signature pitch is the unparryable one, and you have to *take it on the chin* and survive on hearts.

- **Effort:** large (introduces new mechanic + visual vocabulary)
- **Confidence:** speculative — well-grounded in cross-game pattern, but unbuilt
- **Target doc:** new `WILD-THING-BOSS-SPEC.md` or future pitch spec; reference in `DESIGN-PILLARS.md` open questions

### R8 — Borrow Punch-Out's named-pitch / boss-signature pattern

Each member of The Nine should have a *named signature pitch* — Bald Bull has the Bull Charge, Hondo has the Hondo Rush, Wild Thing has *X*. The named pitch should be the boss's defining test: distinctive windup, distinctive trajectory, distinctive consequence on miss. This is more a content/spec move than a mechanical change, but it's the principle that turns "boss with extra HP" into "boss with personality."

- **Effort:** medium (per-boss spec authoring)
- **Confidence:** high (Punch-Out has carried this design for 40 years)
- **Target doc:** new `THE-NINE-SIGNATURES.md` or per-boss spec; `WILD-THING-BOSS-SPEC.md` first since Wild Thing is the v1 boss

---

## §5 — Open questions

Things this research can't resolve — playtest, not paper.

1. **Centered vs late-biased perfect window — which feels better?** Per R2. Needs ~30min self-playtest of each + one Eric session. The "right answer" almost certainly varies by pitch type (curveball might want centered because the break is the read; fastball might want late-biased because the read is whether to commit).

2. **Does perfect-streak stacking improve flow, or break it?** Per R1. Risk: a streak meter could turn the at-bat from "three discrete reads" into "don't break the streak" — which might shift the player into a defensive mindset rather than the swinging-confidently mindset DESIGN-PILLARS wants.

3. **Does FOUL TIP soften the difficulty curve too much?** Per R3. Risk: gracing every "close miss" might mean Eric stops strikeoutting entirely, which removes the consequence pressure that makes contact feel earned.

4. **Are programmer-art ball colors load-bearing?** Per R4. Run a playtest with a "mute colors" debug toggle — same windups, same trajectories, ball is white. If Eric still reads pitch types, the windups are doing their job. If he doesn't, the color is more permanent than spec'd.

5. **Is the 60ms perfect window the right "All-Star" tightness?** Cross-reference: Lies of P at ~130ms is "too tight to react." Sekiro at ~200ms is "fair." Bottom of the Ninth at 60ms perfect inside 180ms hit is *tighter than Lies of P at the perfect tier* — but the hit window provides the leniency. Whether this lands as "rewarding precision" or "frustrating roulette" needs All-Star self-playtest.

6. **Should each pitch type carry its own perfect-window placement?** Currently the centered 60ms is shared across all pitch types. But the curveball's break happens in the last 40% of flight (per CURVEBALL-SPEC v2.0) — late-biased perfect might fit it better; the fastball's identity-as-honest might fit centered better. Per-pitch placement is more design surface, but might feel right.

7. **Does at-bat parry feel transfer cleanly to combat-room parry, or do players struggle to context-switch?** Per R5. Especially relevant once Pitcher's Mound rooms ship — the player will be doing combat-parry inside a room, then transitioning to an at-bat at the end. If the timing/spatial rules differ too much, the at-bat becomes a fresh skill rather than the climax of the room.

8. **What does "PERFECT GAME" mean at the boss level?** A perfect streak across an entire boss-length at-bat (maybe 6-9 pitches against Wild Thing) is a different commitment than a 3-pitch streak. Does the reward scale? Is there a "perfect game" stat in the end-of-run scorecard?

9. **Does the dance of offense-defense (P1) need to land *inside* the at-bat, or is "the door unlocks" enough offense for the model to work?** This is the deepest open question. The Sekiro model has offense inside the encounter; Bottom of the Ninth has offense as the *outcome* of the encounter. If playtest reveals the at-bat feels too one-sided, R1 (streak meter) might not be enough — the at-bat might need a swing-back verb the player can deploy after a successful contact.

---

<!-- PARRY-RESEARCH.md v1.0 — 2026-05-11: Cross-game close-read of parry/dodge
mechanics across 10 reference games (Sekiro, Hi-Fi Rush, Punch-Out!!, Hollow
Knight/Silksong, Expedition 33, Hades/Hades 2, Lies of P, Nine Sols, Returnal,
Pragmata). Extracted 10 transferable principles; audited current Bottom of
the Ninth design (FASTBALL-SPEC v2.0, CURVEBALL-SPEC v2.0, M2_5-SPEC v2.0,
COMBAT-DESIGN-SPEC v1.4); flagged two important gaps (graceful failure
fallthrough, perfect-parry streak stacking) and one partial (in-flight cue
identity decision deferred). 8 recommendations labeled effort/confidence/
target-doc. 9 open questions for future playtest-driven architect chats.
Co-authored: Brad + Claude Chat. -->
