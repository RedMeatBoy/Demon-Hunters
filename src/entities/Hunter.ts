import type Phaser from 'phaser';

// Hunter — player entity (dumb data per CLAUDE.md's ECS-flavored rule).
// No methods; no input reading; no movement logic. x/y is simulation state;
// `sprite` is the rendering handle the simulation syncs to each frame.
export type HunterId = 'P1' | 'P2';

export interface Hunter {
  readonly id: HunterId;
  x: number;
  y: number;
  readonly sprite: Phaser.GameObjects.Rectangle;
}
