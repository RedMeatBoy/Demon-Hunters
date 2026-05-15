import Phaser from 'phaser';
import { ATTACK, HUD, PARRY } from '../config/tuning';
import type { AttackDef } from '../config/enemies';
import type { Demon } from '../entities/Demon';
import type { Hunter, HunterId } from '../entities/Hunter';
import type { SignaturePowerId } from '../config/hunters';
import type { InputSystem } from './InputSystem';

// ParrySystem — "Hit the Beat" (HIT-THE-BEAT-SPEC). Owns the parry verb:
// reads parryPressed intents from InputSystem, resolves them against
// the per-attack timing window EnemySystem opens during a telegraphed
// windup, banks per-player Hype scaled by precision, and emits a
// signature-trigger event when a player's Hype hits capacity.
//
// Coordination with EnemySystem: parryability is a data property on
// enemy defs (def.telegraphed). EnemySystem extends the windup state
// timer by half the active parry window so the strike resolves AFTER
// the centered window closes — that lets ParrySystem set
// parriedThisAttack on the enemy and EnemySystem honour it in
// endWindup (negate+stagger for lunge/slam, reflect for lob). No
// system branches on enemy id; the lunge/slam vs lob fork lives in
// EnemySystem off attack.kind.
//
// Co-op: two players, two independent lockouts, two independent Hype
// meters. Once an attack is claimed by a parry, subsequent presses on
// the same attack are inert (HIT-THE-BEAT-SPEC §8: no cross-player
// parry synergy in the prototype).

export const SIGNATURE_TRIGGERED = 'signature-triggered';

export interface SignatureTriggeredPayload {
  readonly hunterId: HunterId;
  readonly signatureId: SignaturePowerId;
  readonly x: number;
  readonly y: number;
}

interface PlayerState {
  hype: number;
  lockoutRemainingMs: number;
  // HUD feedback: bar pulses briefly after a parry; intensity scales
  // with precision (HIT-THE-BEAT-SPEC §7).
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

// Signature trigger placeholder (PARRY-BRIEF §7). A burst + name label
// centered on the hunter — proves wiring, does NOT damage / clear / buff.
// The actual signature effects (Breakdown/Drop/Bridge) are the next
// brief; the registry stays status: 'stub'.
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
  private readonly playerStates: Record<HunterId, PlayerState>;
  private readonly rings: BeatRing[] = [];
  private readonly flashes: FadingArc[] = [];
  private readonly signatureVisuals: SignatureVisual[] = [];

  constructor(
    scene: Phaser.Scene,
    hunters: readonly Hunter[],
    enemies: readonly Demon[],
    input: InputSystem,
  ) {
    // Hard invariant (HIT-THE-BEAT-SPEC §3, PARRY-BRIEF §3): the
    // post-press lockout must be shorter than the shortest attack
    // windup so a press is never "stuck" through a telegraph the
    // player could otherwise have read. Enforce, do not assume.
    const shortestWindupMs = Math.min(
      ATTACK.MOSHER_WINDUP_MS,
      ATTACK.DANCER_WINDUP_MS,
      ATTACK.BOUNCER_WINDUP_MS,
    );
    if (PARRY.LOCKOUT_MS >= shortestWindupMs) {
      throw new Error(
        `PARRY.LOCKOUT_MS (${PARRY.LOCKOUT_MS}) must be shorter than the shortest attack windup (${shortestWindupMs}).`,
      );
    }

    this.scene = scene;
    this.hunters = hunters;
    this.enemies = enemies;
    this.input = input;
    this.playerStates = {
      P1: makePlayerState(),
      P2: makePlayerState(),
    };
  }

  update(deltaMs: number): void {
    this.tickPlayerStates(deltaMs);
    this.tickRings();
    this.tickFlashes(deltaMs);
    this.tickSignatureVisuals(deltaMs);
    this.readPresses();
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
      if (s.lockoutRemainingMs > 0) s.lockoutRemainingMs -= deltaMs;
      if (s.hypeFlashRemainingMs > 0) s.hypeFlashRemainingMs -= deltaMs;
    }
  }

  // --- Parry-press resolution --------------------------------------------

  private readPresses(): void {
    for (const hunter of this.hunters) {
      if (!hunter.alive) continue;
      const intent = this.input.getIntent(hunter.id);
      if (!intent.parryPressed) continue;
      this.resolvePress(hunter);
    }
  }

  private resolvePress(hunter: Hunter): void {
    const state = this.playerStates[hunter.id];
    // Anti-mash, never punitive (HIT-THE-BEAT-SPEC §3). Any press during
    // lockout is dropped — no inert flourish, no penalty, no extended
    // lockout. Simply ignored.
    if (state.lockoutRemainingMs > 0) return;
    // Every press that gets past lockout — Hit, Miss, or Inert — starts
    // a fresh lockout.
    state.lockoutRemainingMs = PARRY.LOCKOUT_MS;

    const target = this.findBestParryTarget(hunter);
    if (!target) {
      // Inert press. Lockout already started above.
      return;
    }

    this.applyParry(target, hunter, state);
  }

  // Among enemies with an open parry window, pick the one nearest the
  // pressing hunter. Natural co-op disambiguation (each player tends to
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

    state.hype += hypeGained;
    state.hypeFlashRemainingMs = HUD.HYPE_BAR_FILL_FLASH_DURATION_MS;
    state.hypeFlashIntensity = precision;

    this.spawnParryHitVisual(enemy.x, enemy.y);

    if (state.hype >= PARRY.HYPE_CAPACITY) {
      state.hype = 0;
      this.fireSignature(hunter);
    }
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
    lockoutRemainingMs: 0,
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
  // Placeholder labels for the trigger wiring (PARRY-BRIEF §7). The
  // SIGNATURE_POWERS registry stays status: 'stub' — the actual
  // signature effects (Breakdown/Drop/Bridge) ship in the next brief.
  switch (id) {
    case 'breakdown': return 'BREAKDOWN!';
    case 'drop':      return 'DROP!';
    case 'bridge':    return 'BRIDGE!';
  }
}
