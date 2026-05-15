import type Phaser from 'phaser';

// Projectile — Nim's thrown stars + the Backup Dancer's lobs (and future
// reflected projectiles). Dumb data per CLAUDE.md's ECS-flavored rule.
// CombatSystem owns spawn, per-frame movement, hit detection, cleanup;
// the entity itself carries only state + its rendering handle.
//
// A projectile damages the *opposite* team from its owner: a 'hunter'
// projectile hits enemies, an 'enemy' projectile hits hunters. The
// single Projectile shape covers both rather than a per-team duplicate.
export type ProjectileTeam = 'hunter' | 'enemy';

export interface Projectile {
  readonly team: ProjectileTeam;
  x: number;
  y: number;
  // Velocity, px/sec. Set at spawn from the firing direction; never
  // changed — projectiles fly straight in this prototype.
  readonly vx: number;
  readonly vy: number;
  readonly damage: number;
  // Lifetime carries a per-shot range — for Nim's stars this is set to
  // range / speed so a star travels exactly its hunter's effective
  // range; for the Dancer's lob it gates the projectile's reach.
  remainingLifetimeMs: number;
  readonly radius: number;
  alive: boolean;
  readonly sprite: Phaser.GameObjects.Arc;
}
