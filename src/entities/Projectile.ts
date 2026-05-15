import type Phaser from 'phaser';

// Projectile — Nim's thrown stars (and future reflected projectiles).
// Dumb data per CLAUDE.md's ECS-flavored rule. CombatSystem owns spawn,
// per-frame movement, hit detection, and cleanup; the entity itself
// carries only state + its rendering handle.
export interface Projectile {
  x: number;
  y: number;
  // Velocity, px/sec. Set at spawn from the firing direction; never
  // changed — projectiles fly straight in this prototype.
  readonly vx: number;
  readonly vy: number;
  readonly damage: number;
  // Encodes per-hunter range as range / speed at spawn time so a star
  // travels exactly its hunter's effective range before despawning.
  remainingLifetimeMs: number;
  readonly radius: number;
  alive: boolean;
  readonly sprite: Phaser.GameObjects.Arc;
}
