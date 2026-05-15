# DESIGN-PILLARS.md — Demon Hunters (working title)

> What the full game is. Source of truth. Non-negotiable.
> If PROTOTYPE-SCOPE.md or any spec contradicts this document, surface it —
> this document wins unless it is explicitly amended here.
>
> "Demon Hunters" is a working title only. Original IP. See Open Questions.

---

## What this game is

**One line:** A co-op horde-survival roguelike where an original cast of idol-shaman
demon hunters fights back a corrupted crowd — and every run lays down a line of the
song that brings the headliner down.

**The fusion — three inspirations, one game:**

- **Vampire Survivors** — the horde-survival loop, move-only controls, the mid-run
  1-of-3 level-up pick, escalating waves.
- **Hades** — a small cast of strong, distinct characters; per-run builds; meta-progression;
  and a run that *completes*. It has an ending, not just a high score.
- **K-Pop Demon Hunters** — the aesthetic and tone, the idol-meets-shaman fantasy, and the
  "songs as power" conceit made literal: performance *is* combat, and assembling a song
  *is* progression.

**Audience, in priority order:** the kids first, the designer second, a wider online
audience third. The third audience is real — this may go online, and may become
commercial — but it never outranks the first two. See Pillar 1.

---

## The five pillars

### Pillar 1 — Kids-first is the constraint; depth lives in the ceiling, never the floor

The floor of the game — move, survive, finish a run — must be playable and joyful for a
six-year-old who never learns a single advanced mechanic. Every advanced system (parry,
builds, meta-progression) is layered *on top* of that floor and is *optional* to engage
with. Difficulty is something a player dials up into — never something the game forces
down onto them.

This is the pillar that protects the game from itself. The commercial-roguelike instinct
is "make the boss harder, add depth, punish mistakes." That instinct is allowed — but only
in the *ceiling*. The floor is sacred. A future change that makes the floor harder,
scarier, or more punishing is wrong by definition.

**Test:** *Can a kid who ignores every system except "move" still finish a run and feel
good?* If no, the change broke the pillar.

### Pillar 2 — Move to the music

Controls are movement plus one button. Two players share a keyboard now and hold
controllers later, and either player can pick the game up cold in under a minute. No
combos, no aiming, no unskippable mid-action menus. The hands stay simple so the *reads*
can get rich.

**Test:** *Can a new player be really playing — not fumbling — inside 60 seconds?*

### Pillar 3 — Every run is a song

A run is not an open-ended survival timer. It is a song with a shape: an intro, a build,
a drop, and a headliner to close. The player's build *is* the song they assemble — verses
stacked onto a hunter. And the meta-progression is literally musical: each of the three
hunters contributes their line — melody, rhythm, harmony — and only the assembled song is
strong enough to bring the headliner down.

This is the Hades borrow: a run *completes*. There is a finish line, an arc, a payoff —
not just a number that goes up.

**Test:** *Does finishing a run feel like landing an ending, not stopping a clock?*

### Pillar 4 — Characters worth caring about

Three hunters, each with a genuinely different feel in the hands — not three reskins with
different stat lines. The lead is the honest baseline; the bruiser plays slow and heavy
and rewards standing your ground; the kiter plays fast and far and rewards never being
cornered. Meta-progression is about *who* you have played and *what they contributed* —
not an abstract upgrade tree. You should have a favorite, and your kid should have a
different one.

**Test:** *Do two players, asked who they want to play, give different answers — and have
reasons?*

### Pillar 5 — Spectacle is cheap and constant

The game over-delivers on feedback — screen shake, hit-pause, particles, floating numbers,
a combo that climbs, banners that punctuate the run. The procedural audio engine means
this spectacle costs almost nothing in assets: every hit, every parry, every level-up is
loud and satisfying with placeholder art. The game should feel *great* long before it
looks finished.

**Test:** *Is a hit satisfying with programmer art and synthesized sound — before any real
asset exists?*

---

## The signature verb — "Hit the Beat"

Movement avoids damage. **Hit the Beat** — the parry — *converts* it.

Most of the horde is not telegraphed; it is pressure you reposition around. But specific
attacks — certain enemies' moves, and all of the boss's signature attacks — wind up with a
visible tell. A button press timed to the moment of impact is a parry: it negates the
attack and banks **Hype**.

- **Parry is optional.** Every telegraphed attack can also simply be dodged by
  repositioning. A player who never parries once can still win. Parry is the skill ceiling,
  not a gate. *(Pillar 1.)*
- **Parry is greedy, not safe.** Dodging an attack wastes it. Parrying it turns danger into
  Hype. That is the thing dodging does *not* do — and it is why the verb earns its place in
  a game where the player is already constantly dodging.
  *(Grounded in PARRY-RESEARCH §2, the Returnal negative case; P1.)*
- **Hype is the offense within the encounter.** A full Hype meter unleashes the hunter's
  signature power. Parry → resource → spend is the loop every deep parry game shares.
  *(PARRY-RESEARCH P1, P7.)*
- **Failure is graded, never binary.** A mistimed press is just a normal moment — no Hype
  gained, nothing lost. A missed parry is never a punish. *(PARRY-RESEARCH P4.)*
- **Difficulty scales the window, not the rules.** Easier settings widen the parry window.
  The mechanic is identical for a six-year-old and an expert; only the tolerance moves.
  *(PARRY-RESEARCH P8, P10.)*

The signature power each hunter's Hype unleashes is also their **song-line**. Performing
well *is* writing the song.

---

## The cast

Three hunters. The names below are **working drafts** — they may be renamed, possibly with
the kids. The *feel* and *song-line* assignments are the load-bearing part.

| Hunter (draft name) | Feel                                              | Weapon         | Song-line   |
|---------------------|---------------------------------------------------|----------------|-------------|
| Riya                | The lead — the honest baseline, no spike, no hole | Sword          | **Melody**  |
| Bex                 | The bruiser — slow and heavy, stand and delete    | Staff          | **Rhythm**  |
| Nim                 | The kiter — fast and far, hits light, never cornered | Throwing stars | **Harmony** |

Three voices make a song. That is both the fiction and the meta-progression structure.

The hunters differ in *what they do* — auto-attack and signature power — not in the
*body*. Base stats (health, move speed) are identical; differentiation lives entirely in
the verb. Per-hunter base stats are a parked full-game lever, not a prototype feature. See
`HUNTER-SPEC.md` for the auto-attack triangle and the three signature powers.

---

## Run structure (full game)

A full-game run is **15–30 minutes** and moves through four beats:

1. **Intro** — light pressure; establish the hunter.
2. **Build** — waves escalate; verses get picked; the build takes shape.
3. **Drop** — peak horde density; the mid-run elite.
4. **Headliner** — the boss; the song's closing number.

Between runs, the player returns to a **backstage** hub — the Hades "House" equivalent —
where song-lines are assembled, hunters are chosen, and meta-progression lives.

---

## Meta-progression

- Each hunter, by completing runs, lays down their **song-line**.
- Hunters are **replayable** — a run *improves* a hunter's line rather than just switching
  it on. The line has a quality, not a boolean. A longer or harder run improves it more;
  an easy, short run still always helps. *(Tunable — see Open Questions.)*
- Assembling all three lines completes the **song** — the power that makes the Headliner
  decisively winnable.
- A player can attempt the Headliner with an incomplete song; it is just a harder, longer
  fight. The assembled song is the reward arc, not an entry fee. *(Pillar 1.)*

---

## Tone

Bright, kinetic, a little funny. The fantasy is a concert, not a graveyard — the horde is
a crowd gone wrong, the hunters are performers, the weapons are performances. Stakes are
real but the register is joyful. Nothing grim, nothing punishing, nothing that is not safe
for young players.

---

## Open questions (full game)

Genuinely unresolved. None of these block the prototype. Listed here so they are not
silently decided.

1. **Project name.** "Demon Hunters" is a working title — descriptive, generic, and likely
   crowded if the game goes commercial. Needs a real name. Original IP: must not use the
   Netflix property's name or characters.
2. **Is there a campaign / narrative layer?** Does this game have a story arc beyond
   "assemble the song, beat the headliner," or is the musical-progression structure the
   whole narrative?
3. **Verse evolutions.** Vampire Survivors' signature "two picks combine into an evolved
   weapon." Compelling depth — but more design surface, and a possible overwhelm risk for
   young players. In or out of the full game's build system?
4. **Authored vs. procedural music.** The procedural engine is asset-free and thematically
   perfect. But a game *about songs* may eventually want authored music. When — and does it
   replace, or layer over, the procedural engine?
5. **Dynamic camera.** The prototype uses a fixed wide camera. Does the full game want a
   dynamic zoom that pulls back as co-op players separate?
6. **Does a harder/longer run yield a meaningfully better song-line** — or is run length
   purely a turn-sharing convenience? Current lean: yes, gently — harder helps more, easy
   still always helps. Needs playtest.
7. **The streak-mindset risk.** If Hype builds across a streak of parries, does it shift
   players into a defensive "don't break the streak" mindset rather than a confident one?
   *(PARRY-RESEARCH §5, OQ2.)* Playtest question.
8. **Parry window placement** — centered vs. late-biased. *(PARRY-RESEARCH §5.)* Playtest
   question.
9. **The roster and song list beyond the first three hunters and first song.** Cast size,
   song count, and boss count for the full game are all unscoped.
10. **Commercial framing.** If this goes commercial: platform (web / Steam / both), pricing
    model, and where the kids-first audience and the paying audience pull apart — and how
    that tension is managed.

---

<!-- DESIGN-PILLARS.md v1.1 — Demon Hunters (working title). Establishes the full-game
vision: five pillars, the three-inspiration fusion (Vampire Survivors / Hades / K-Pop
Demon Hunters), the "Hit the Beat" parry verb, the three-hunter cast, song-based
meta-progression, and 10 full-game open questions. v1.1 amendment: cast table and Pillar 4
updated to the bruiser/kiter hunter identities (Riya/sword/baseline, Bex/staff/bruiser,
Nim/stars/kiter) to match HUNTER-SPEC.md; noted that base stats are identical across
hunters. Subordinate documents: PROTOTYPE-SCOPE.md, CLAUDE.md, and the specs in /specs
(HIT-THE-BEAT-SPEC, HUNTER-SPEC). Co-authored: Brad + Claude Chat. -->
