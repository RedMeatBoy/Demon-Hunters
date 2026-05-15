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
// P2 bindings are seeded; no P2 entity exists in the scaffold task —
// the co-op consumer is the very next task.
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
} as const;

// Which HunterDef each player slot plays this run. Swap to demo other
// hunters. A real character-select lives in MenuScene (HUNTER-SPEC §6).
export const HUNTER_ASSIGNMENT: Record<'P1' | 'P2', HunterDefId> = {
  P1: 'bex',
  P2: 'nim',
};

// Combat baseline absolutes — Riya = 1.0× anchor; HUNTER-SPEC §2's
// triangle multipliers in hunters.ts resolve against these.
// PROVISIONAL — retune against real enemy HP (enemy brief). Set against
// the placeholder dummy; do not balance against these until real enemies
// exist.
export const COMBAT = {
  RIYA_BASELINE_ATTACK_INTERVAL_MS: 700,
  RIYA_BASELINE_RANGE_PX: 130,
  RIYA_BASELINE_DAMAGE: 1.0,
  // Melee arc: a wedge around the facing direction. Range check is the
  // same number used by targeting. Half-angle = each side of facing, so
  // total arc = 2× this. PI/3 → 120° total swing coverage.
  MELEE_ARC_HALF_ANGLE_RAD: Math.PI / 3,
  // How long the swing visual lingers after the hit lands. Cosmetic only;
  // damage is applied instantaneously when the swing fires.
  MELEE_SWING_DURATION_MS: 140,
  // Projectile (Nim's stars). Range is encoded as lifetime so a projectile
  // travels exactly its hunter's effective range before despawning:
  // lifetime = range / speed, resolved in code.
  PROJECTILE_SPEED_PX_PER_SEC: 520,
  PROJECTILE_RADIUS_PX: 6,
  PROJECTILE_COLOR: 0xF6E5B7,
  // Minimal hit feedback — not the juice task. A brief tint flash, that's it.
  // FeedbackSystem (shake, hitstop, particles, floating numbers, combo) is
  // a future brief.
  HIT_FLASH_MS: 90,
  HIT_FLASH_COLOR: 0xFFFFFF,
} as const;

// PROVISIONAL — placeholder values for the inert dummy target.
// The real enemy archetypes and their HP land in the enemy brief.
export const DUMMY = {
  HP: 6,
  SIZE_PX: 36,
  COLOR: 0x9A6FB0,
  // Hit-circle radius for overlap math; matches the visual square's reach.
  RADIUS_PX: 18,
  // Two dummies, well-separated, so each hunter has its own nearest target
  // and co-op targeting is visibly independent.
  POSITIONS: [
    { x: 360, y: 240 },
    { x: 920, y: 480 },
  ],
} as const;
