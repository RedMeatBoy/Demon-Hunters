import type Phaser from 'phaser';

// Demon — enemy entity; the 5 archetypes are data-driven. Stub for the
// scaffold task; filled in by the enemy brief (Fan / Weaver / Mosher /
// Backup Dancer / Bouncer).
export interface Demon {
  readonly id: string;
}

// Target — the minimum shape CombatSystem's targeting + hit detection
// reads. Lives here so the enemy brief's archetypes can conform to it
// without rewriting CombatSystem. Deliberately narrow: position, hit
// radius, HP, alive flag, sprite handle, and the small amount of tint
// state CombatSystem needs to restore the body colour after a hit flash.
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

// DummyTarget — the inert placeholder this combat brief verifies against.
// Stationary, no AI, no attacks; it exists so the auto-attacks have
// something to target, hit, and kill. Thrown away (or absorbed) by the
// enemy brief.
export interface DummyTarget extends Target {
  readonly kind: 'dummy';
}
