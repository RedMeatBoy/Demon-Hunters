import type Phaser from 'phaser';
import type { HunterDef } from '../config/hunters';

// Hunter — player entity (dumb data per CLAUDE.md's ECS-flavored rule).
// No methods; no input reading; no movement or combat logic. x/y is
// simulation state; `sprite` is the rendering handle the simulation
// syncs to each frame; `def` is the per-hunter content (HUNTER-SPEC §5).
// `attackCooldownMs` is the timer CombatSystem ticks down; a swing fires
// when it reaches 0 and a valid target is in range. `hp` becomes real
// in the enemy brief — enemies deal contact and attack damage now.
//
// HunterId is the player slot (P1/P2). It is intentionally the same type
// as PlayerId for now — HUNTER-SPEC §6 flags they only need to diverge
// if a non-player hunter is ever introduced.
export type HunterId = 'P1' | 'P2';

export interface Hunter {
  readonly id: HunterId;
  readonly def: HunterDef;
  x: number;
  y: number;
  readonly sprite: Phaser.GameObjects.Rectangle;
  attackCooldownMs: number;
  hp: number;
  readonly maxHp: number;
  alive: boolean;
  readonly baseColor: number;
  flashRemainingMs: number;
}
