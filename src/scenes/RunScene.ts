import Phaser from 'phaser';
import { ARENA, CAMERA, CANVAS, HUNTER, HUNTER_ASSIGNMENT } from '../config/tuning';
import { HUNTERS } from '../config/hunters';
import { InputSystem } from '../systems/InputSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { ParrySystem } from '../systems/ParrySystem';
import { HypeHud } from '../systems/HypeHud';
import type { Hunter, HunterId } from '../entities/Hunter';
import type { Demon } from '../entities/Demon';

// The horde run itself. Wires the fixed-wide camera, InputSystem, the
// hunters (with their per-slot HunterDef from tuning.ts), and the
// runtime systems: SpawnSystem feeds new enemies in from the edges,
// EnemySystem ticks their movement + state machine, ParrySystem
// resolves Hit-the-Beat presses against open windows, CombatSystem
// resolves damage in both directions and owns the shared projectile
// pool, and HypeHud renders per-player meter state.
//
// Update order:
//   1. Hunter movement (intent → position)
//   2. SpawnSystem    (push new Demon into the shared enemies array)
//   3. ParrySystem    (read parry presses, resolve against any open
//                      windup window, set parriedThisAttack flag —
//                      runs BEFORE EnemySystem so a press on the very
//                      last frame of a window is honoured by the same
//                      frame's endWindup transition)
//   4. EnemySystem    (move enemies, advance attack state machines,
//                      apply contact/strike damage via CombatSystem;
//                      endWindup reads the parried flag here)
//   5. CombatSystem   (tick hunter auto-attacks, projectiles, flashes,
//                      prune dead targets)
//   6. HypeHud        (read fresh hype state, render bars)
export class RunScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private combatSystem!: CombatSystem;
  private enemySystem!: EnemySystem;
  private spawnSystem!: SpawnSystem;
  private parrySystem!: ParrySystem;
  private hypeHud!: HypeHud;
  private readonly hunters: Hunter[] = [];
  private readonly enemies: Demon[] = [];

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, CAMERA.WIDTH, CAMERA.HEIGHT);
    this.cameras.main.setBackgroundColor(CANVAS.BACKGROUND_COLOR);

    this.inputSystem = new InputSystem(this);

    const cx = ARENA.WIDTH / 2;
    const cy = ARENA.HEIGHT / 2;
    this.hunters.push(this.spawnHunter('P1', cx - HUNTER.SPAWN_OFFSET_X_PX, cy));
    this.hunters.push(this.spawnHunter('P2', cx + HUNTER.SPAWN_OFFSET_X_PX, cy));

    this.combatSystem = new CombatSystem(this, this.hunters, this.enemies, this.inputSystem);
    this.enemySystem = new EnemySystem(this, this.enemies, this.hunters, this.combatSystem);
    this.spawnSystem = new SpawnSystem(this, this.enemies);
    this.parrySystem = new ParrySystem(this, this.hunters, this.enemies, this.inputSystem);
    this.hypeHud = new HypeHud(this, this.hunters, this.parrySystem);
  }

  update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const hunter of this.hunters) {
      if (!hunter.alive) continue;
      const intent = this.inputSystem.getIntent(hunter.id);
      this.applyMovement(hunter, intent.move.x, intent.move.y, dt);
    }
    this.spawnSystem.update(deltaMs);
    this.parrySystem.update(deltaMs);
    this.enemySystem.update(deltaMs);
    this.combatSystem.update(deltaMs);
    this.hypeHud.update();
  }

  private spawnHunter(id: HunterId, x: number, y: number): Hunter {
    const def = HUNTERS[HUNTER_ASSIGNMENT[id]];
    const sprite = this.add.rectangle(x, y, HUNTER.SQUARE_SIZE_PX, HUNTER.SQUARE_SIZE_PX, def.bodyColor);
    return {
      id,
      def,
      x,
      y,
      // Start facing toward arena centre (P1 spawns left, P2 right) so a
      // charged release fired before the hunter ever moves aims inward.
      facingX: x < ARENA.WIDTH / 2 ? 1 : -1,
      facingY: 0,
      sprite,
      attackCooldownMs: 0,
      hp: HUNTER.MAX_HP,
      maxHp: HUNTER.MAX_HP,
      alive: true,
      baseColor: def.bodyColor,
      flashRemainingMs: 0,
    };
  }

  private applyMovement(h: Hunter, mx: number, my: number, dt: number): void {
    // Track facing from the move intent — the intent vector is already
    // unit-length (InputSystem normalises diagonals). A stationary
    // hunter keeps its last facing.
    if (mx !== 0 || my !== 0) {
      h.facingX = mx;
      h.facingY = my;
    }
    h.x += mx * HUNTER.MOVE_SPEED_PX_PER_SEC * dt;
    h.y += my * HUNTER.MOVE_SPEED_PX_PER_SEC * dt;
    const half = HUNTER.SQUARE_SIZE_PX / 2;
    h.x = Math.max(half, Math.min(ARENA.WIDTH - half, h.x));
    h.y = Math.max(half, Math.min(ARENA.HEIGHT - half, h.y));
    h.sprite.setPosition(h.x, h.y);
  }
}
