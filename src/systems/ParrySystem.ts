import Phaser from 'phaser';
import { ATTACK, CHARGED, HUD, PARRY } from '../config/tuning';
import type { AttackDef } from '../config/enemies';
import type { Demon } from '../entities/Demon';
import type { Hunter, HunterId } from '../entities/Hunter';
import type { SignaturePowerId } from '../config/hunters';
import type { CombatSystem } from './CombatSystem';
import type { InputSystem } from './InputSystem';

// ParrySystem — "Hit the Beat", v2.0 hold-and-release (HIT-THE-BEAT-SPEC
// v2.0). Owns the parry verb as a gesture state machine:
//
//   - Holding the parry/charge button pauses the hunter's auto-attack
//     (CombatSystem reads parryHeld and suspends) and enters a charged
//     stance. ParrySystem records when the hold began.
//   - Releasing resolves the verb. Below ~500ms held it is a silent
//     cancel (Outcome D). At or above the minimum hold it is a charged
//     release: the per-character charged AOE fires (Outcome A), with a
//     parry layered on top if a telegraphed attack is in its window at
//     the moment of release (Outcome B — reflect / negate+stagger,
//     banks precision-graded Hype), or the signature firing instead of
//     the charged AOE when Hype is full (Outcome C).
//
// Coordination with EnemySystem (unchanged from v1.0): parryability is a
// data property on enemy defs (def.telegraphed). EnemySystem extends the
// windup state timer by half the active parry window so the strike
// resolves AFTER the centered window closes — that lets ParrySystem set
// parriedThisAttack on the enemy and EnemySystem honour it in endWindup
// (negate+stagger for lunge/slam, reflect for lob). No system branches
// on enemy id; the lunge/slam vs lob fork lives in EnemySystem off
// attack.kind.
//
// Co-op: two players, two independent charged-stance states, two
// independent Hype meters, two independent signature triggers. Once an
// attack is claimed by a parry, a later release against the same attack
// is inert (HIT-THE-BEAT-SPEC §9: no cross-player parry synergy).

export const SIGNATURE_TRIGGERED = 'signature-triggered';

export interface SignatureTriggeredPayload {
  readonly hunterId: HunterId;
  readonly signatureId: SignaturePowerId;
  readonly x: number;
  readonly y: number;
}

interface PlayerState {
  hype: number;
  // Gesture state machine. `holding` is true between the rising edge of
  // parryHeld and the release that resolves it; `holdStartMs` is the
  // scene clock at the rising edge, so a release can measure hold
  // duration against CHARGED.MINIMUM_HOLD_MS.
  holding: boolean;
  holdStartMs: number;
  // The charged-stance ground ring shown while holding (HIT-THE-BEAT-SPEC
  // v2.0 §3, §8). Null when not holding.
  stanceRing: Phaser.GameObjects.Arc | null;
  // HUD feedback: bar pulses briefly after a parry; intensity scales
  // with precision (HIT-THE-BEAT-SPEC §5).
  hypeFlashRemainingMs: number;
  hypeFlashIntensity: number;
}

interface BeatRing {
  readonly enemy: Demon;
  readonly attack: AttackDef;
  readonly graphics: Phaser.GameObjects.Graphics;
  // True after the one-shot beat flash has fired for this windup, so
  // shape-not-colour convergence reinforcement happens exactly once.
  beatFlashFired: boolean;
}

// Shared fading-arc pool: parry-hit flashes (filled) and beat
// convergence flashes (stroke-only) both fade their alpha over a
// fixed duration. Same lifecycle, different draw — distinguished only
// by what was set up at construction time.
interface FadingArc {
  remainingMs: number;
  readonly durationMs: number;
  readonly baseAlpha: number;
  readonly arc: Phaser.GameObjects.Arc;
}

// Signature trigger placeholder (PARRY-V2-BRIEF §5). A burst + name
// label centered on the hunter — proves wiring, does NOT damage / clear
// / buff. The actual signature effects (Breakdown/Drop/Bridge) are the
// next brief; the registry stays status: 'stub'.
interface SignatureVisual {
  remainingMs: number;
  readonly durationMs: number;
  flashRemainingMs: number;
  readonly flash: Phaser.GameObjects.Arc;
  readonly label: Phaser.GameObjects.Text;
  readonly startX: number;
  readonly startY: number;
}

const HUNTER_IDS: readonly HunterId[] = ['P1', 'P2'];

export class ParrySystem {
  private readonly scene: Phaser.Scene;
  private readonly hunters: readonly Hunter[];
  private readonly enemies: readonly Demon[];
  private readonly input: InputSystem;
  private readonly combat: CombatSystem;
  private readonly playerStates: Record<HunterId, PlayerState>;
  private readonly rings: BeatRing[] = [];
  private readonly flashes: FadingArc[] = [];
  private readonly signatureVisuals: SignatureVisual[] = [];

  constructor(
    scene: Phaser.Scene,
    hunters: readonly Hunter[],
    enemies: readonly Demon[],
    input: InputSystem,
    combat: CombatSystem,
  ) {
    // Sanity invariant (HIT-THE-BEAT-SPEC v2.0 §3): the minimum hold must
    // be shorter than the shortest attack windup, or a player could
    // never react to a telegraph and still complete the hold in time to
    // parry it. Enforce, do not assume.
    const shortestWindupMs = Math.min(
      ATTACK.MOSHER_WINDUP_MS,
      ATTACK.DANCER_WINDUP_MS,
      ATTACK.BOUNCER_WINDUP_MS,
    );
    if (CHARGED.MINIMUM_HOLD_MS >= shortestWindupMs) {
      throw new Error(
        `CHARGED.MINIMUM_HOLD_MS (${CHARGED.MINIMUM_HOLD_MS}) must be shorter than the shortest attack windup (${shortestWindupMs}) so a player can react to a telegraph and still complete the hold.`,
      );
    }

    this.scene = scene;
    this.hunters = hunters;
    this.enemies = enemies;
    this.input = input;
    this.combat = combat;
    this.playerStates = {
      P1: makePlayerState(),
      P2: makePlayerState(),
    };
  }

  update(deltaMs: number): void {
    this.tickPlayerStates(deltaMs);
    this.tickGestures();
    this.tickStanceRings();
    this.tickRings();
    this.tickFlashes(deltaMs);
    this.tickSignatureVisuals(deltaMs);
  }

  // --- HUD readers --------------------------------------------------------

  getHypeFraction(playerId: HunterId): number {
    const state = this.playerStates[playerId];
    return Math.max(0, Math.min(1, state.hype / PARRY.HYPE_CAPACITY));
  }

  getHypeFlashAlpha(playerId: HunterId): number {
    const state = this.playerStates[playerId];
    if (state.hypeFlashRemainingMs <= 0) return 0;
    const tRemaining = state.hypeFlashRemainingMs / HUD.HYPE_BAR_FILL_FLASH_DURATION_MS;
    return Math.max(0, Math.min(1, tRemaining * state.hypeFlashIntensity));
  }

  // --- Player-state ticks -------------------------------------------------

  private tickPlayerStates(deltaMs: number): void {
    for (const id of HUNTER_IDS) {
      const s = this.playerStates[id];
      if (s.hypeFlashRemainingMs > 0) s.hypeFlashRemainingMs -= deltaMs;
    }
  }

  // --- Gesture state machine ---------------------------------------------

  private tickGestures(): void {
    for (const hunter of this.hunters) {
      const state = this.playerStates[hunter.id];

      // A hunter that dies mid-hold drops the hold silently — no charged
      // release, no parry, no cancel feedback.
      if (!hunter.alive) {
        if (state.holding) this.endHold(state);
        continue;
      }

      const intent = this.input.getIntent(hunter.id);

      // Rising edge — the hold begins. Auto-attack is already suspended
      // by CombatSystem reading the same parryHeld state.
      if (intent.parryHeld && !state.holding) {
        state.holding = true;
        state.holdStartMs = this.scene.time.now;
        this.spawnStanceRing(hunter, state);
      }

      // Falling edge — the release resolves the verb. Detected here from
      // the gesture state (holding) plus the key no longer being held;
      // an explicit InputSystem release event replaces this in a
      // follow-up commit.
      if (state.holding && !intent.parryHeld) {
        this.resolveRelease(hunter, state);
      }
    }
  }

  private resolveRelease(hunter: Hunter, state: PlayerState): void {
    const holdMs = this.scene.time.now - state.holdStartMs;
    this.endHold(state);

    // Outcome D — a sub-minimum hold is a silent cancel. No charged
    // attack, no parry, no penalty, no cooldown. Auto-attack resumes on
    // CombatSystem's next tick automatically.
    if (holdMs < CHARGED.MINIMUM_HOLD_MS) return;

    // Resolve the §4 outcome matrix. The charged release is always
    // *something*: either the signature (Hype full) or the plain charged
    // AOE. A parry, if a telegraphed attack is in its window right now,
    // layers on top of whichever fired.
    const target = this.findBestParryTarget(hunter);
    const hypeFull = state.hype >= PARRY.HYPE_CAPACITY;

    if (hypeFull) {
      // Outcome C — the signature fires instead of the plain charged AOE
      // and Hype resets. If a parry also lands (C + B) the parry below
      // banks Hype toward the next signature.
      state.hype = 0;
      this.fireSignature(hunter);
    } else {
      // Outcome A — the plain charged AOE. Most releases land here.
      this.combat.fireChargedAoe(hunter);
    }

    if (target) {
      // Outcome B — parry effects layer on top of the charged release.
      this.applyParry(target, hunter, state);
    }
  }

  private endHold(state: PlayerState): void {
    state.holding = false;
    if (state.stanceRing) {
      state.stanceRing.destroy();
      state.stanceRing = null;
    }
  }

  // --- Charged-stance visual ---------------------------------------------

  private spawnStanceRing(hunter: Hunter, state: PlayerState): void {
    state.stanceRing = this.scene.add
      .circle(hunter.x, hunter.y, CHARGED.STANCE_RING_RADIUS_PX, 0, 0)
      .setStrokeStyle(
        CHARGED.STANCE_RING_LINE_WIDTH_PX,
        CHARGED.STANCE_RING_COLOR,
        CHARGED.STANCE_RING_ALPHA,
      )
      .setDepth(45);
  }

  private tickStanceRings(): void {
    const pulsePhase = (this.scene.time.now / 1000) * CHARGED.STANCE_RING_PULSE_HZ * Math.PI * 2;
    const pulse = Math.sin(pulsePhase) * CHARGED.STANCE_RING_PULSE_AMPLITUDE_PX;
    for (const hunter of this.hunters) {
      const state = this.playerStates[hunter.id];
      if (!state.holding || !state.stanceRing) continue;
      // Track the hunter — they keep moving while charging — and pulse
      // the radius so the stance reads as live, not a static decal.
      state.stanceRing.setPosition(hunter.x, hunter.y);
      state.stanceRing.setRadius(CHARGED.STANCE_RING_RADIUS_PX + pulse);
    }
  }

  // --- Parry resolution --------------------------------------------------

  // Among enemies with an open parry window, pick the one nearest the
  // releasing hunter. Natural co-op disambiguation (each player tends to
  // parry what is coming at them) and stable in a move-only game where
  // there is no "facing" to read from.
  private findBestParryTarget(hunter: Hunter): Demon | null {
    let best: Demon | null = null;
    let bestDistSq = Infinity;
    for (const enemy of this.enemies) {
      if (!isParryWindowOpen(enemy)) continue;
      const dx = enemy.x - hunter.x;
      const dy = enemy.y - hunter.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        best = enemy;
      }
    }
    return best;
  }

  private applyParry(enemy: Demon, hunter: Hunter, state: PlayerState): void {
    const precision = precisionForEnemy(enemy);
    const hypeGained = lerp(
      PARRY.HYPE_PER_PARRY_MIN_AT_EDGE,
      PARRY.HYPE_PER_PARRY_MAX_AT_CENTER,
      precision,
    );

    // EnemySystem reads this in endWindup and redirects into the parry
    // outcome (negate+stagger for lunge/slam, reflect for lob). The
    // resolution lives there, not here, so the strike-vs-parry fork
    // stays adjacent to the normal-strike code.
    enemy.parriedThisAttack = true;
    // Immediate body-tint shift so the parry reads as a moment, not a
    // delayed event. EnemySystem keeps it on stagger entry; the Dancer
    // (lob, no stagger) restores its base colour on recovery anyway.
    enemy.sprite.setFillStyle(PARRY.STAGGER_TINT_COLOR);

    // Bank Hype. v2.0: no auto-fire when the meter caps — a full meter is
    // just a condition the next release reads (Outcome C). Clamp at
    // capacity so a C+B release banks cleanly toward the next signature.
    state.hype = Math.min(PARRY.HYPE_CAPACITY, state.hype + hypeGained);
    state.hypeFlashRemainingMs = HUD.HYPE_BAR_FILL_FLASH_DURATION_MS;
    state.hypeFlashIntensity = precision;

    this.spawnParryHitVisual(enemy.x, enemy.y);
  }

  // --- Signature trigger --------------------------------------------------

  private fireSignature(hunter: Hunter): void {
    const payload: SignatureTriggeredPayload = {
      hunterId: hunter.id,
      signatureId: hunter.def.signature,
      x: hunter.x,
      y: hunter.y,
    };
    this.scene.events.emit(SIGNATURE_TRIGGERED, payload);
    this.spawnSignatureVisual(hunter);
  }

  private spawnSignatureVisual(hunter: Hunter): void {
    const flash = this.scene.add.circle(
      hunter.x,
      hunter.y,
      HUD.SIGNATURE_FLASH_RADIUS_PX,
      HUD.SIGNATURE_FLASH_COLOR,
      HUD.SIGNATURE_FLASH_ALPHA,
    ).setDepth(900);
    const label = this.scene.add.text(
      hunter.x,
      hunter.y,
      signatureLabel(hunter.def.signature),
      {
        fontFamily: 'monospace, sans-serif',
        fontSize: `${HUD.SIGNATURE_LABEL_FONT_PX}px`,
        color: HUD.SIGNATURE_LABEL_COLOR,
        fontStyle: 'bold',
      },
    )
      .setOrigin(0.5, 0.5)
      .setDepth(901);
    this.signatureVisuals.push({
      remainingMs: HUD.SIGNATURE_LABEL_DURATION_MS,
      durationMs: HUD.SIGNATURE_LABEL_DURATION_MS,
      flashRemainingMs: HUD.SIGNATURE_FLASH_DURATION_MS,
      flash,
      label,
      startX: hunter.x,
      startY: hunter.y,
    });
  }

  // --- Beat Ring visuals --------------------------------------------------

  private tickRings(): void {
    // 1. Update visible state for existing rings; drop rings whose enemy
    //    is dead, no longer in windup, or has been claimed by a parry.
    let write = 0;
    for (let read = 0; read < this.rings.length; read++) {
      const ring = this.rings[read];
      if (!ringStillRelevant(ring)) {
        ring.graphics.destroy();
        continue;
      }
      this.drawRing(ring);
      this.rings[write++] = ring;
    }
    this.rings.length = write;

    // 2. Scan for new windups not yet ringed.
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.state !== 'windup') continue;
      if (!enemy.def.telegraphed) continue;
      if (enemy.parriedThisAttack) continue;
      if (this.hasRingFor(enemy)) continue;
      const attack = enemy.def.attack;
      if (!attack) continue;
      this.spawnRing(enemy, attack);
    }
  }

  private hasRingFor(enemy: Demon): boolean {
    for (const r of this.rings) {
      if (r.enemy === enemy) return true;
    }
    return false;
  }

  private spawnRing(enemy: Demon, attack: AttackDef): void {
    const g = this.scene.add.graphics().setDepth(50);
    this.rings.push({ enemy, attack, graphics: g, beatFlashFired: false });
  }

  private drawRing(ring: BeatRing): void {
    const halfWindowMs = PARRY.ACTIVE_WINDOW_MS / 2;
    // remainingWindupMs counts down the visible windup (the ring's
    // contraction); it goes <= 0 during the post-beat half of the
    // parry window, where the ring stays pinned at INNER.
    const remainingWindupMs = ring.enemy.stateTimerMs - halfWindowMs;
    const progress = remainingWindupMs <= 0
      ? 1
      : Math.max(0, Math.min(1, 1 - remainingWindupMs / ring.attack.windupMs));
    const radius =
      PARRY.BEAT_RING_OUTER_RADIUS_PX +
      (PARRY.BEAT_RING_INNER_RADIUS_PX - PARRY.BEAT_RING_OUTER_RADIUS_PX) * progress;

    ring.graphics.clear();
    ring.graphics.lineStyle(
      PARRY.BEAT_RING_LINE_WIDTH_PX,
      PARRY.BEAT_RING_COLOR,
      PARRY.BEAT_RING_ALPHA,
    );
    ring.graphics.strokeCircle(ring.enemy.x, ring.enemy.y, radius);

    // Fire the one-shot beat flash the instant the ring lands — shape-
    // not-colour reinforcement of convergence (HIT-THE-BEAT-SPEC §2).
    if (!ring.beatFlashFired && remainingWindupMs <= 0) {
      ring.beatFlashFired = true;
      this.spawnBeatFlash(ring.enemy.x, ring.enemy.y);
    }
  }

  // --- Fading-arc pool (parry hits + beat flashes) ------------------------

  private spawnParryHitVisual(x: number, y: number): void {
    const arc = this.scene.add.circle(
      x,
      y,
      PARRY.HIT_FLASH_RADIUS_PX,
      PARRY.HIT_FLASH_COLOR,
      PARRY.HIT_FLASH_ALPHA,
    ).setDepth(60);
    this.flashes.push({
      remainingMs: PARRY.HIT_FLASH_DURATION_MS,
      durationMs: PARRY.HIT_FLASH_DURATION_MS,
      baseAlpha: PARRY.HIT_FLASH_ALPHA,
      arc,
    });
  }

  private spawnBeatFlash(x: number, y: number): void {
    const arc = this.scene.add.circle(x, y, PARRY.BEAT_FLASH_RADIUS_PX, 0, 0)
      .setStrokeStyle(PARRY.BEAT_FLASH_LINE_WIDTH_PX, PARRY.BEAT_FLASH_COLOR)
      .setDepth(51);
    this.flashes.push({
      remainingMs: PARRY.BEAT_FLASH_DURATION_MS,
      durationMs: PARRY.BEAT_FLASH_DURATION_MS,
      baseAlpha: 1,
      arc,
    });
  }

  private tickFlashes(deltaMs: number): void {
    let write = 0;
    for (let read = 0; read < this.flashes.length; read++) {
      const v = this.flashes[read];
      v.remainingMs -= deltaMs;
      if (v.remainingMs <= 0) {
        v.arc.destroy();
        continue;
      }
      const t = v.remainingMs / v.durationMs;
      v.arc.setAlpha(Math.max(0, Math.min(1, t * v.baseAlpha)));
      this.flashes[write++] = v;
    }
    this.flashes.length = write;
  }

  private tickSignatureVisuals(deltaMs: number): void {
    let write = 0;
    for (let read = 0; read < this.signatureVisuals.length; read++) {
      const v = this.signatureVisuals[read];
      v.remainingMs -= deltaMs;
      v.flashRemainingMs -= deltaMs;

      // Flash fades faster than the label rises — two channels of the
      // same trigger, so they decay independently.
      if (v.flashRemainingMs > 0) {
        const tFlash = v.flashRemainingMs / HUD.SIGNATURE_FLASH_DURATION_MS;
        v.flash.setAlpha(HUD.SIGNATURE_FLASH_ALPHA * tFlash);
      } else if (v.flash.alpha > 0) {
        v.flash.setAlpha(0);
      }

      const tLabel = v.remainingMs / v.durationMs;
      const rise = (1 - tLabel) * HUD.SIGNATURE_LABEL_RISE_PX;
      v.label.setPosition(v.startX, v.startY - rise);
      v.label.setAlpha(Math.max(0, Math.min(1, tLabel)));

      if (v.remainingMs <= 0) {
        v.flash.destroy();
        v.label.destroy();
        continue;
      }
      this.signatureVisuals[write++] = v;
    }
    this.signatureVisuals.length = write;
  }
}

// --- module helpers -----------------------------------------------------

function makePlayerState(): PlayerState {
  return {
    hype: 0,
    holding: false,
    holdStartMs: 0,
    stanceRing: null,
    hypeFlashRemainingMs: 0,
    hypeFlashIntensity: 0,
  };
}

function isParryWindowOpen(enemy: Demon): boolean {
  if (!enemy.alive) return false;
  if (!enemy.def.telegraphed) return false;
  if (enemy.parriedThisAttack) return false;
  if (enemy.state !== 'windup') return false;
  // The strike resolves at stateTimerMs == 0; the centered window covers
  // the last ACTIVE_WINDOW_MS of the state timer — that is the half before
  // the visible beat AND the half after, by construction (EnemySystem
  // extends the windup state by ACTIVE_WINDOW_MS / 2).
  if (enemy.stateTimerMs < 0) return false;
  if (enemy.stateTimerMs > PARRY.ACTIVE_WINDOW_MS) return false;
  return true;
}

function precisionForEnemy(enemy: Demon): number {
  const half = PARRY.ACTIVE_WINDOW_MS / 2;
  const distanceFromBeatMs = Math.abs(enemy.stateTimerMs - half);
  return Math.max(0, Math.min(1, 1 - distanceFromBeatMs / half));
}

function ringStillRelevant(ring: BeatRing): boolean {
  const e = ring.enemy;
  if (!e.alive) return false;
  if (e.state !== 'windup') return false;
  if (e.parriedThisAttack) return false;
  return true;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function signatureLabel(id: SignaturePowerId): string {
  // Placeholder labels for the trigger wiring (PARRY-V2-BRIEF §5). The
  // SIGNATURE_POWERS registry stays status: 'stub' — the actual
  // signature effects (Breakdown/Drop/Bridge) ship in the next brief.
  switch (id) {
    case 'breakdown': return 'BREAKDOWN!';
    case 'drop':      return 'DROP!';
    case 'bridge':    return 'BRIDGE!';
  }
}
