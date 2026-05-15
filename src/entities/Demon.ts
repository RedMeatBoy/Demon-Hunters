import type Phaser from 'phaser';
import type { EnemyDef } from '../config/enemies';

// Demon — enemy entity. Dumb data per CLAUDE.md's ECS-flavored rule:
// position, HP, def reference, the small amount of state the movement
// and attack systems read. No methods; behaviour lives in EnemySystem
// and CombatSystem.
//
// The five archetypes (Fan, Weaver, Mosher, Backup Dancer, Bouncer)
// differ entirely in their `def` and their `movementKind` /
// `attack.kind` — no per-id branching in any system.

// State machine for the three telegraphed archetypes. Fan and Weaver
// (no attack) stay 'moving' for life. 'staggered' is the parry payoff
// state (HIT-THE-BEAT-SPEC §1.6, §4): the enemy cannot act and is open
// to hunter auto-attacks until the stagger timer elapses.
export type EnemyState = 'moving' | 'windup' | 'striking' | 'recovery' | 'staggered';

// Target — the minimum shape CombatSystem's hunter-attack targeting +
// hit detection reads. Demon satisfies it. Kept distinct so a future
// Boss can also satisfy it without enemy-specific fields leaking in.
export interface Target {
  x: number;
  y: number;
  readonly radius: number;
  hp: number;
  readonly maxHp: number;
  alive: boolean;
  readonly sprite: Phaser.GameObjects.Rectangle;
  readonly baseColor: number;
  flashRemainingMs: number;
}

export interface Demon extends Target {
  readonly def: EnemyDef;
  // Movement scratchpad. Per-kind fields, harmless when unused — the
  // Weaver uses weavePhase, the Dancer uses orbitAngle, others ignore
  // both. Cheaper than a tagged-union allocation per frame.
  weavePhase: number;
  orbitAngle: number;
  // Attack state machine. attackCooldownMs gates 'moving' → 'windup' for
  // attack.trigger === 'on-cooldown' archetypes (the Dancer).
  state: EnemyState;
  stateTimerMs: number;
  attackCooldownMs: number;
  // Lunge strike state (valid while state==='striking' AND
  // def.attack.kind==='lunge'). dir is locked at windup-start so a
  // hunter can sidestep the line during windup.
  lungeDirX: number;
  lungeDirY: number;
  lungeRemainingPx: number;
  // Hunter ids already damaged by the current lunge — prevents a single
  // lunge applying damage every frame against the same target.
  readonly lungeHits: Set<'P1' | 'P2'>;
  // Per-hunter contact damage tick — ENEMY.CONTACT_TICK_INTERVAL_MS
  // gates how often a touching enemy chips a hunter. With only two
  // hunters a fixed-key object beats a Map allocation.
  readonly contactCooldownByHunter: { P1: number; P2: number };
  // Set by ParrySystem when a parry press lands inside the active window
  // for this enemy's current windup; consumed in EnemySystem.endWindup
  // to redirect into the parry outcome (negate+stagger for lunge/slam,
  // reflect for lob). Cleared on the windup that consumed it; reset on
  // entering a new windup. Per HIT-THE-BEAT-SPEC §3 the strike resolves
  // at the end of the extended windup so a parry never has to undo
  // already-applied damage.
  parriedThisAttack: boolean;
}
