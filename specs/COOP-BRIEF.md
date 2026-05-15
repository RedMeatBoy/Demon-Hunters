# COOP-BRIEF.md — Claude Code Task: Player 2 + Co-op

> A task brief for Claude Code — build step 2.
> Read CLAUDE.md, then DESIGN-PILLARS.md, then PROTOTYPE-SCOPE.md before
> starting. This brief is subordinate to all three.
> This is a scope-bounded task. The "Not in this task" section is binding —
> if you find yourself reaching past it, stop and surface it in chat.

---

## Goal

Add the second player. Two input-driven squares, each on its own keyboard
binding, moving independently in `RunScene`, kept on screen together by a single
shared fixed-wide camera. Plus two small cleanups banked from the scaffold review.

After this task, the prototype is **co-op playable at the floor level** — two
players, one keyboard, both moving. No gameplay yet, but the thing two kids will
actually sit down at exists.

## Why this shape

The scaffold (build step 1) deliberately built the `InputSystem` abstraction with
a second player in mind but did not create Player 2 — that was left as a clean
follow-up. This is that follow-up. The scaffold report flagged that this task is
also the right moment to harden the `InputSystem.endFrame()` contract, because
co-op is the first time a second consumer leans on that system. Both are folded
in here.

Per PROTOTYPE-SCOPE.md: single shared camera, fixed wide, framed so neither player
can scroll the other off-screen. No split-screen, no dynamic zoom.

---

## In scope for this task

### 1. Player 2 entity + second moving square
- A second `Hunter` instance in `RunScene`, drawn as a solid-color square in a
  **visibly different color** from Player 1 (so two kids can tell which is theirs).
- It reads the **Player 2 intent** from `InputSystem` — the P2 bindings already
  exist in `tuning.ts` from the scaffold (Arrow keys to move, per CLAUDE.md).
- It moves independently of Player 1, using the same minimal movement step the
  scaffold established for Player 1. If that step currently hard-codes "P1", make
  it player-agnostic — both squares run the identical movement path, differing
  only in which intent they read. Do not duplicate the movement logic per player.
- Movement speed comes from `tuning.ts` — both players use the same
  `HUNTER.MOVE_SPEED_PX_PER_SEC` unless a reason to differ surfaces (it should
  not, in this task).
- `Hunter` stays dumb data per CLAUDE.md — it does not read input, owns no
  movement logic. Whatever player-identity the entity needs (which intent it
  reads) is data on the entity, not behavior.

### 2. The shared fixed-wide camera
- A single camera, shared by both players. **Fixed and wide** — framed wide
  enough that two players moving independently within the play area cannot scroll
  each other off-screen.
- Do **not** build dynamic zoom, camera follow, or any logic that reacts to
  player separation. Fixed-wide means fixed. Dynamic zoom is explicitly a
  full-game open question, out of scope here (PROTOTYPE-SCOPE.md).
- The scaffold already set up a fixed-wide camera for one square. This task
  confirms the framing works for two — if the existing dimensions are too tight
  for two players to move freely, widen them. All camera/canvas dimensions live
  in `tuning.ts`; adjust there, never inline.
- The play area and the camera framing should make sense together: if there is an
  implicit "arena" the squares move within, its bounds are `tuning.ts` values.

### 3. Cleanup — harden `InputSystem.endFrame()`
- The scaffold flagged that `InputSystem.endFrame()` is currently called manually
  at the bottom of `RunScene.update()` to clear the edge-triggered
  `parryPressed` / `dashPressed` intents — a hidden per-frame contract a future
  system author must remember.
- Convert this to **self-cleaning**: have `InputSystem` clear its own
  edge-triggered state via a scene `POST_UPDATE` event (or equivalently robust
  mechanism), so no external caller has to remember the manual call.
- After this change, `RunScene.update()` should no longer need to call
  `endFrame()` manually. If a public `endFrame()` is no longer meaningful,
  removing it is fine; if it stays for testing reasons, comment why.
- This is a small, contained refactor. Verify edge-triggered intents still behave
  correctly — a press registers for exactly one frame — for **both** players.

### 4. Cleanup — relocate `Planning research/`
- The repo currently has a root-level `Planning research/` folder (with a space
  in the name), outside CLAUDE.md's locked file structure. It holds
  `PARRY-RESEARCH.md`, which `specs/HIT-THE-BEAT-SPEC.md` references.
- Move it to `specs/research/` (no space in the path) so the whole document set
  lives under one predictable tree and the research sits near the spec that cites
  it.
- If `specs/HIT-THE-BEAT-SPEC.md` references the research by path, update the
  reference. If it references it by name only, no change needed — just confirm.
- This is a `git mv` — preserve history. One commit, on its own.

---

## Not in this task — binding

Do not build any of the following. If the task seems to call for one, stop and
surface it in chat.

- **No gameplay systems.** `SpawnSystem`, `CombatSystem` (beyond the existing
  minimal movement step), `ParrySystem`, `UpgradeSystem`, `RunDirector`,
  `SaveSystem`, `FeedbackSystem` stay as stubs.
- **No enemies, no boss, no projectiles.**
- **No parry, no dash behavior.** The intents exist and stay unconsumed. This task
  does not wire them to anything — even though both players now have parry/dash
  bindings, nothing acts on them yet. `HIT-THE-BEAT-SPEC.md` is a future task.
- **No dynamic camera** — no zoom, no follow, no separation logic. Fixed-wide only.
- **No collision between the two players** — they can overlap; that is fine for
  this task. Player-player collision, if it is ever wanted, is a separate
  decision.
- **No audio, no juice, no assets.** Programmer-art primitives only.
- **No content data.** `hunters.ts` etc. stay as stubs; the two `Hunter`
  instances are constructed minimally as in the scaffold.
- **No menu / character select.** Both squares just exist in `RunScene` on boot,
  as the scaffold's one square did. Choosing which hunter is which player is a
  later task.
- **No new directories** beyond the `specs/research/` move above, and no new
  files beyond what Player 2 strictly needs. If the structure seems to need
  something new, propose it in chat first.
- **No automated tests.** Per CLAUDE.md, still human-playtest only at this stage.

---

## Definition of done

- `npm run dev` boots to `RunScene` with **two** squares, visibly different
  colors, no console errors.
- Player 1 moves with WASD; Player 2 moves with Arrow keys; they move
  independently and simultaneously.
- Both squares stay on screen during independent movement — the fixed-wide camera
  frames the whole play area; neither player can scroll the other off.
- All keyboard reading still lives only in `InputSystem`. Both `Hunter` instances
  are dumb data reading an intent; the movement step is player-agnostic, not
  duplicated.
- `InputSystem` self-cleans its edge-triggered state — `RunScene.update()` no
  longer calls `endFrame()` manually. Edge-triggered intents register for exactly
  one frame, verified for both players.
- `Planning research/` is now `specs/research/`, moved with history preserved;
  any path reference in `HIT-THE-BEAT-SPEC.md` updated.
- Every number introduced or changed lives in `tuning.ts`. No inlined magic
  numbers.
- `npm run build` succeeds.
- `npm run typecheck` passes clean — strict mode, no `any`, no `@ts-ignore`
  without a one-line reason comment.

## Commits

Follow CLAUDE.md's `<area>: <change>` format, one concern per commit. A reasonable
shape — use judgment, keep them separable:

- `chore: relocate Planning research to specs/research`
- `input: self-cleaning edge-triggered intents via POST_UPDATE`
- `coop: player-agnostic movement step`
- `coop: Player 2 entity + second moving square`
- `coop: widen fixed camera to frame two players` *(only if framing needed adjustment)*

`npm run typecheck` passes before every commit. Do not commit a broken build.
Local commits only — do not push.

## When done

Report back in chat: confirm the definition-of-done checklist, note anything that
fought the structure or any point where the docs were ambiguous, and flag the
in-browser check that needs Brad's eyes (two squares, two keyboards, simultaneous
independent movement — Claude Code cannot verify rendered movement). Then stop.
The next task will be briefed separately.

---

<!-- COOP-BRIEF.md v1.0 — Claude Code task brief for Demon Hunters (working title)
Prototype #1, build step 2. Scope: Player 2 entity + second input-driven moving
square (P2 = Arrow keys, bindings already in tuning.ts), a single shared
fixed-wide camera framing both players, a player-agnostic movement step, plus two
banked cleanups — hardening InputSystem.endFrame() into self-cleaning POST_UPDATE
state, and relocating Planning research/ to specs/research/. Explicitly excludes
all gameplay systems, parry/dash behavior, dynamic camera, player-player
collision, audio, juice, assets, content data, and menu/character select.
Subordinate to CLAUDE.md, DESIGN-PILLARS.md, PROTOTYPE-SCOPE.md. Co-authored:
Brad + Claude Chat. -->
