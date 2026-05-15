// The dial board. Every magic number in the prototype lives here.

import type { HunterDefId } from './hunters';

export const CANVAS = {
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: 0x141826,
} as const;

// Fixed-wide shared camera (PROTOTYPE-SCOPE.md): wide enough that neither
// player can scroll the other off-screen. Dynamic zoom is out of scope.
export const CAMERA = {
  WIDTH: 1280,
  HEIGHT: 720,
} as const;

// The arena hunters move within. Sized to the canvas so the fixed-wide
// camera shows the whole play area; hunters are clamped to this box, so
// neither player can wander off-screen (no scrolling, no follow).
export const ARENA = {
  WIDTH: CANVAS.WIDTH,
  HEIGHT: CANVAS.HEIGHT,
} as const;

// Player bindings. Values are KeyboardEvent.code strings so the mapping
// is independent of the user's keyboard layout (CLAUDE.md control map).
export const INPUT = {
  P1: {
    UP: 'KeyW',
    DOWN: 'KeyS',
    LEFT: 'KeyA',
    RIGHT: 'KeyD',
    PARRY: 'Space',
    DASH: 'ControlLeft',
  },
  P2: {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    PARRY: 'Numpad0',
    DASH: 'NumpadEnter',
  },
} as const;

export const HUNTER = {
  MOVE_SPEED_PX_PER_SEC: 240,
  SQUARE_SIZE_PX: 28,
  // Each player spawns this many px horizontally from arena centre.
  SPAWN_OFFSET_X_PX: 80,
  // Identical across the three hunters (HUNTER-SPEC §4 — hard line for
  // the prototype). PROVISIONAL — moves in playtest.
  MAX_HP: 10,
} as const;

// Which HunterDef each player slot plays this run. Swap to demo other
// hunters. A real character-select lives in MenuScene (HUNTER-SPEC §6).
export const HUNTER_ASSIGNMENT: Record<'P1' | 'P2', HunterDefId> = {
  P1: 'bex',
  P2: 'nim',
};

// Combat baseline absolutes — Riya = 1.0× anchor; HUNTER-SPEC §2's
// triangle multipliers in hunters.ts resolve against these.
// PROVISIONAL — moves in playtest, but tuned this brief against real
// enemy HP so the triangle reads.
export const COMBAT = {
  RIYA_BASELINE_ATTACK_INTERVAL_MS: 700,
  RIYA_BASELINE_RANGE_PX: 130,
  RIYA_BASELINE_DAMAGE: 1.0,
  MELEE_ARC_HALF_ANGLE_RAD: Math.PI / 3,
  MELEE_SWING_DURATION_MS: 140,
  // Projectile (Nim's stars). Lifetime = range / speed in code so a star
  // travels exactly its hunter's effective range before despawning.
  PROJECTILE_SPEED_PX_PER_SEC: 520,
  PROJECTILE_RADIUS_PX: 6,
  PROJECTILE_COLOR: 0xF6E5B7,
  // Minimal hit feedback — brief tint flash, on both enemies and hunters.
  // The juice pass (shake, hitstop, particles, floating numbers, combo)
  // is a dedicated later brief.
  HIT_FLASH_MS: 90,
  HIT_FLASH_COLOR: 0xFFFFFF,
} as const;

// Per-archetype stats. PROVISIONAL — first balance pass tuned this brief
// so the weapon triangle reads against the horde (a Fan falls to anyone;
// a Bouncer visibly takes Bex's heavy hits better than Nim's light ones).
// Real balance is a playtest job.
export const ENEMY = {
  // Fan — slow, direct, swarms. 1 HP so any hit clears one.
  FAN_HP: 1,
  FAN_SPEED: 60,
  FAN_CONTACT_DAMAGE: 1,
  FAN_SIZE: 22,

  // Weaver — fast, weaving. 1 HP for the same swarm-clear reason.
  WEAVER_HP: 1,
  WEAVER_SPEED: 130,
  WEAVER_CONTACT_DAMAGE: 1,
  WEAVER_SIZE: 20,
  WEAVER_ANGLE_AMPLITUDE_RAD: 0.6,
  WEAVER_ANGLE_FREQUENCY_RAD_PER_SEC: 4.0,

  // Mosher — windup-and-lunge. 2 HP — a step up.
  MOSHER_HP: 2,
  MOSHER_SPEED: 80,
  MOSHER_CONTACT_DAMAGE: 1,
  MOSHER_SIZE: 28,

  // Dancer — ranged lobber. 1 HP — fragile if you can reach her.
  DANCER_HP: 1,
  DANCER_SPEED: 100,
  DANCER_CONTACT_DAMAGE: 1,
  DANCER_SIZE: 24,
  // Distance the Dancer maintains from her target hunter.
  DANCER_ORBIT_RADIUS_PX: 220,
  DANCER_ORBIT_ANGULAR_SPEED_RAD_PER_SEC: 1.2,
  // How tightly she snaps back to the orbit ring when displaced.
  DANCER_RADIUS_CORRECTION_GAIN: 2.2,

  // Bouncer — big slow slam-elite. 8 HP — Bex feels good, Nim feels slow.
  // Per ENEMY-BRIEF §2's first balance pass aim.
  BOUNCER_HP: 8,
  BOUNCER_SPEED: 55,
  BOUNCER_CONTACT_DAMAGE: 1,
  BOUNCER_SIZE: 44,

  // Contact damage tick — any enemy touching a hunter applies its
  // contact damage at this cadence so contact pressure is graded, not
  // a per-frame instant-kill.
  CONTACT_TICK_INTERVAL_MS: 500,
} as const;

// Attack-specific tuning. HIT-THE-BEAT-SPEC §9 names the windups (slowest
// is the Mosher — teaching attack); the rest is PROVISIONAL.
export const ATTACK = {
  // Mosher lunge — the slowest, most generous windup. The "teaching parry"
  // (HIT-THE-BEAT-SPEC §6) when the parry brief lands.
  MOSHER_WINDUP_MS: 1400,
  MOSHER_RECOVERY_MS: 600,
  MOSHER_COOLDOWN_MS: 0,
  MOSHER_TRIGGER_RANGE_PX: 200,
  MOSHER_LUNGE_DAMAGE: 2,
  MOSHER_LUNGE_DISTANCE_PX: 280,
  MOSHER_LUNGE_SPEED_PX_PER_SEC: 560,
  MOSHER_LUNGE_WIDTH_PX: 32,

  // Backup Dancer lob — medium tempo (HIT-THE-BEAT-SPEC §9).
  DANCER_WINDUP_MS: 900,
  DANCER_RECOVERY_MS: 400,
  DANCER_COOLDOWN_MS: 1800,
  DANCER_LOB_DAMAGE: 2,
  DANCER_LOB_SPEED_PX_PER_SEC: 220,
  DANCER_LOB_RADIUS_PX: 10,

  // Bouncer slam — medium tempo (HIT-THE-BEAT-SPEC §9).
  BOUNCER_WINDUP_MS: 900,
  BOUNCER_RECOVERY_MS: 700,
  BOUNCER_COOLDOWN_MS: 1200,
  BOUNCER_TRIGGER_RANGE_PX: 140,
  BOUNCER_SLAM_DAMAGE: 3,
  BOUNCER_SLAM_RADIUS_PX: 120,
  // Cosmetic only: the slam-ring visual lingers this long after the
  // strike so the impact reads.
  BOUNCER_SLAM_VISUAL_LINGER_MS: 220,
} as const;

// SpawnSystem — escalating edge spawns. Not RunDirector; that brief
// drives the run arc (intro/build/drop/headliner) later. Here it is a
// simple time-based trickle that intensifies.
export const SPAWN = {
  INITIAL_INTERVAL_MS: 1500,
  MIN_INTERVAL_MS: 350,
  // ms shaved off the interval per second of run time.
  INTERVAL_DECAY_MS_PER_SEC: 14,
  // Px just inside the visible arena, so a spawned enemy appears at the
  // edge rather than off-screen invisible.
  EDGE_INSET_PX: 24,
  // Archetype weights — drawn at run-start vs. fully-ramped. Linear
  // interpolation in between. The Bouncer mini-elite is intentionally
  // rare even at full ramp.
  WEIGHTS_INITIAL: { fan: 8, weaver: 2, mosher: 0, dancer: 0, bouncer: 0 },
  WEIGHTS_FULL:    { fan: 5, weaver: 4, mosher: 4, dancer: 3, bouncer: 1 },
  WEIGHT_RAMP_DURATION_SEC: 60,
} as const;
