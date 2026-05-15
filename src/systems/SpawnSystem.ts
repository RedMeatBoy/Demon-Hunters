import Phaser from 'phaser';
import { ARENA, SPAWN } from '../config/tuning';
import { ENEMIES, type EnemyDef, type EnemyId } from '../config/enemies';
import type { Demon } from '../entities/Demon';

// SpawnSystem — the simple time-based escalating trickle defined in
// ENEMY-BRIEF §4. NOT RunDirector: this does not own the intro/build/
// drop/headliner arc or any wave structure; it is a flat, gently
// intensifying spawn loop. RunDirector replaces it when that brief
// lands.
//
// Spawn cadence shortens with run time; the archetype mix shifts from
// "early" (mostly Fan, some Weaver) to "full ramp" (Fan/Weaver/Mosher/
// Dancer with rare Bouncer). All dials in tuning.ts.

const EDGE_TOP = 0;
const EDGE_BOTTOM = 1;
const EDGE_LEFT = 2;
const EDGE_RIGHT = 3;

const ENEMY_IDS: readonly EnemyId[] = ['fan', 'weaver', 'mosher', 'dancer', 'bouncer'];

export class SpawnSystem {
  private readonly scene: Phaser.Scene;
  private readonly enemies: Demon[];
  private elapsedSec = 0;
  private nextSpawnInMs = SPAWN.INITIAL_INTERVAL_MS;

  constructor(scene: Phaser.Scene, enemies: Demon[]) {
    this.scene = scene;
    this.enemies = enemies;
  }

  update(deltaMs: number): void {
    this.elapsedSec += deltaMs / 1000;
    this.nextSpawnInMs -= deltaMs;
    if (this.nextSpawnInMs > 0) return;

    const def = ENEMIES[this.pickArchetype()];
    const pos = pickEdgePosition(def.radiusPx);
    this.enemies.push(this.makeDemon(def, pos.x, pos.y));

    this.nextSpawnInMs += this.currentIntervalMs();
  }

  private currentIntervalMs(): number {
    const decayed = SPAWN.INITIAL_INTERVAL_MS - SPAWN.INTERVAL_DECAY_MS_PER_SEC * this.elapsedSec;
    return Math.max(SPAWN.MIN_INTERVAL_MS, decayed);
  }

  private pickArchetype(): EnemyId {
    const t = Math.min(this.elapsedSec / SPAWN.WEIGHT_RAMP_DURATION_SEC, 1);
    let total = 0;
    const weights = ENEMY_IDS.map((id) => {
      const w = SPAWN.WEIGHTS_INITIAL[id] * (1 - t) + SPAWN.WEIGHTS_FULL[id] * t;
      total += w;
      return w;
    });
    let r = Math.random() * total;
    for (let i = 0; i < ENEMY_IDS.length; i++) {
      r -= weights[i];
      if (r <= 0) return ENEMY_IDS[i];
    }
    return ENEMY_IDS[0];
  }

  private makeDemon(def: EnemyDef, x: number, y: number): Demon {
    const sprite = this.scene.add.rectangle(x, y, def.sizePx, def.sizePx, def.bodyColor);
    return {
      def,
      x,
      y,
      radius: def.radiusPx,
      hp: def.maxHp,
      maxHp: def.maxHp,
      alive: true,
      sprite,
      baseColor: def.bodyColor,
      flashRemainingMs: 0,
      // Randomise initial phase so a wave of Weavers doesn't oscillate
      // in lockstep.
      weavePhase: Math.random() * Math.PI * 2,
      orbitAngle: Math.random() * Math.PI * 2,
      state: 'moving',
      stateTimerMs: 0,
      attackCooldownMs: 0,
      lungeDirX: 0,
      lungeDirY: 0,
      lungeRemainingPx: 0,
      lungeHits: new Set(),
      contactCooldownByHunter: { P1: 0, P2: 0 },
      parriedThisAttack: false,
    };
  }
}

function pickEdgePosition(radius: number): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4);
  // Inset by SPAWN.EDGE_INSET_PX plus the enemy's radius so the body
  // is fully on-screen at spawn rather than half-clipped at the edge.
  const inset = SPAWN.EDGE_INSET_PX + radius;
  const w = ARENA.WIDTH;
  const h = ARENA.HEIGHT;
  switch (edge) {
    case EDGE_TOP:    return { x: randomInsideRange(inset, w - inset), y: inset };
    case EDGE_BOTTOM: return { x: randomInsideRange(inset, w - inset), y: h - inset };
    case EDGE_LEFT:   return { x: inset,            y: randomInsideRange(inset, h - inset) };
    case EDGE_RIGHT:  return { x: w - inset,        y: randomInsideRange(inset, h - inset) };
    default:          return { x: w / 2, y: h / 2 };
  }
}

function randomInsideRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
