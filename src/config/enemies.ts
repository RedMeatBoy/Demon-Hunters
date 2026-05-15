// The 5 enemy archetypes as data. Source of truth for per-archetype
// identity, stats, movement read, and attack data. EnemySystem reads
// from here; CombatSystem reads from here. No system branches on
// `enemy.def.id` — behaviour selection lives in `movementKind` and
// (when present) `attack.kind`.
//
// Subordinate to PROTOTYPE-SCOPE.md (the archetype table) and
// HIT-THE-BEAT-SPEC §6 (the parryable-attack table). The Beat Ring
// telegraph itself is deferred to the parry brief — this brief carries
// body-animation tells only.

import { ENEMY, ATTACK } from './tuning';

export type EnemyId = 'fan' | 'weaver' | 'mosher' | 'dancer' | 'bouncer';

// Five distinct reads, general implementations. EnemySystem selects on
// this kind, not on enemy id.
export type MovementKind =
  | 'direct'         // Fan — slow, straight at the target.
  | 'weave'          // Weaver — fast, sinusoidal angle oscillation.
  | 'approach-lunge' // Mosher — direct approach, windup-and-lunge in range.
  | 'circle-strafe'  // Backup Dancer — orbits at a preferred distance.
  | 'big-direct';    // Bouncer — slow, direct, big, AOE-slam in range.

export type AttackKind = 'lunge' | 'lob' | 'slam';

// Selects the trigger predicate the enemy state machine uses to leave
// 'moving' for 'windup'. Data, not branches.
//   in-range  → windup when distance to target ≤ attack.triggerRangePx
//   on-cooldown → windup as soon as the per-attack cooldown is ready
//                 (the Dancer's orbit keeps them in lob range)
export type AttackTrigger = 'in-range' | 'on-cooldown';

interface AttackBase {
  readonly trigger: AttackTrigger;
  readonly windupMs: number;
  readonly recoveryMs: number;
  readonly cooldownMs: number;
  readonly triggerRangePx: number;
  readonly damage: number;
}

export interface LungeAttack extends AttackBase {
  readonly kind: 'lunge';
  readonly lungeDistancePx: number;
  readonly lungeSpeedPxPerSec: number;
  readonly lungeWidthPx: number;
}

export interface LobAttack extends AttackBase {
  readonly kind: 'lob';
  readonly projectileSpeedPxPerSec: number;
  readonly projectileRadiusPx: number;
  readonly projectileColor: number;
}

export interface SlamAttack extends AttackBase {
  readonly kind: 'slam';
  readonly slamRadiusPx: number;
  readonly slamRingColor: number;
}

export type AttackDef = LungeAttack | LobAttack | SlamAttack;

export interface EnemyDef {
  readonly id: EnemyId;
  readonly movementKind: MovementKind;
  readonly maxHp: number;
  readonly moveSpeedPxPerSec: number;
  readonly contactDamage: number;
  readonly sizePx: number;
  readonly radiusPx: number;
  readonly bodyColor: number;
  // Body-animation windup tell colour — used in 'windup' state to make
  // the telegraph unmistakable. Per ENEMY-BRIEF §3 the tell must be
  // legible even with the Beat Ring deferred to the parry brief.
  readonly windupTintColor: number;
  readonly attack: AttackDef | null;
  // Explicit per ENEMY-BRIEF §1: the parry brief reads this to find
  // parryable attacks from data, never by guessing.
  readonly telegraphed: boolean;
}

// Per-archetype data. Multiplier-style relationships are not used here —
// each enemy is its own thing in a way each hunter is not (the hunter
// triangle is the design conceit; the archetype ladder is not).
export const ENEMIES: Record<EnemyId, EnemyDef> = {
  fan: {
    id: 'fan',
    movementKind: 'direct',
    maxHp: ENEMY.FAN_HP,
    moveSpeedPxPerSec: ENEMY.FAN_SPEED,
    contactDamage: ENEMY.FAN_CONTACT_DAMAGE,
    sizePx: ENEMY.FAN_SIZE,
    radiusPx: ENEMY.FAN_SIZE / 2,
    bodyColor: 0xC7522A,
    windupTintColor: 0xFFFFFF,
    attack: null,
    telegraphed: false,
  },
  weaver: {
    id: 'weaver',
    movementKind: 'weave',
    maxHp: ENEMY.WEAVER_HP,
    moveSpeedPxPerSec: ENEMY.WEAVER_SPEED,
    contactDamage: ENEMY.WEAVER_CONTACT_DAMAGE,
    sizePx: ENEMY.WEAVER_SIZE,
    radiusPx: ENEMY.WEAVER_SIZE / 2,
    bodyColor: 0xD17BC0,
    windupTintColor: 0xFFFFFF,
    attack: null,
    telegraphed: false,
  },
  mosher: {
    id: 'mosher',
    movementKind: 'approach-lunge',
    maxHp: ENEMY.MOSHER_HP,
    moveSpeedPxPerSec: ENEMY.MOSHER_SPEED,
    contactDamage: ENEMY.MOSHER_CONTACT_DAMAGE,
    sizePx: ENEMY.MOSHER_SIZE,
    radiusPx: ENEMY.MOSHER_SIZE / 2,
    bodyColor: 0x4F7CAC,
    windupTintColor: 0xFFFFFF,
    attack: {
      kind: 'lunge',
      trigger: 'in-range',
      windupMs: ATTACK.MOSHER_WINDUP_MS,
      recoveryMs: ATTACK.MOSHER_RECOVERY_MS,
      cooldownMs: ATTACK.MOSHER_COOLDOWN_MS,
      triggerRangePx: ATTACK.MOSHER_TRIGGER_RANGE_PX,
      damage: ATTACK.MOSHER_LUNGE_DAMAGE,
      lungeDistancePx: ATTACK.MOSHER_LUNGE_DISTANCE_PX,
      lungeSpeedPxPerSec: ATTACK.MOSHER_LUNGE_SPEED_PX_PER_SEC,
      lungeWidthPx: ATTACK.MOSHER_LUNGE_WIDTH_PX,
    },
    telegraphed: true,
  },
  dancer: {
    id: 'dancer',
    movementKind: 'circle-strafe',
    maxHp: ENEMY.DANCER_HP,
    moveSpeedPxPerSec: ENEMY.DANCER_SPEED,
    contactDamage: ENEMY.DANCER_CONTACT_DAMAGE,
    sizePx: ENEMY.DANCER_SIZE,
    radiusPx: ENEMY.DANCER_SIZE / 2,
    bodyColor: 0x6FCF97,
    windupTintColor: 0xFFFFFF,
    attack: {
      kind: 'lob',
      trigger: 'on-cooldown',
      windupMs: ATTACK.DANCER_WINDUP_MS,
      recoveryMs: ATTACK.DANCER_RECOVERY_MS,
      cooldownMs: ATTACK.DANCER_COOLDOWN_MS,
      // Dancer fires on cooldown; trigger range is unused but kept for
      // shape uniformity. Set to the orbit radius for legibility.
      triggerRangePx: ENEMY.DANCER_ORBIT_RADIUS_PX,
      damage: ATTACK.DANCER_LOB_DAMAGE,
      projectileSpeedPxPerSec: ATTACK.DANCER_LOB_SPEED_PX_PER_SEC,
      projectileRadiusPx: ATTACK.DANCER_LOB_RADIUS_PX,
      projectileColor: 0x6FCF97,
    },
    telegraphed: true,
  },
  bouncer: {
    id: 'bouncer',
    movementKind: 'big-direct',
    maxHp: ENEMY.BOUNCER_HP,
    moveSpeedPxPerSec: ENEMY.BOUNCER_SPEED,
    contactDamage: ENEMY.BOUNCER_CONTACT_DAMAGE,
    sizePx: ENEMY.BOUNCER_SIZE,
    radiusPx: ENEMY.BOUNCER_SIZE / 2,
    bodyColor: 0xB8336A,
    windupTintColor: 0xFFFFFF,
    attack: {
      kind: 'slam',
      trigger: 'in-range',
      windupMs: ATTACK.BOUNCER_WINDUP_MS,
      recoveryMs: ATTACK.BOUNCER_RECOVERY_MS,
      cooldownMs: ATTACK.BOUNCER_COOLDOWN_MS,
      triggerRangePx: ATTACK.BOUNCER_TRIGGER_RANGE_PX,
      damage: ATTACK.BOUNCER_SLAM_DAMAGE,
      slamRadiusPx: ATTACK.BOUNCER_SLAM_RADIUS_PX,
      slamRingColor: 0xB8336A,
    },
    telegraphed: true,
  },
};
