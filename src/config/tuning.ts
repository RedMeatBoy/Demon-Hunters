// The dial board. Every magic number in the prototype lives here.

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
  P1_COLOR: 0xE94F37,
  P2_COLOR: 0x44BBA4,
} as const;
