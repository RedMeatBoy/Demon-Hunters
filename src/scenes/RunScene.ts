import Phaser from 'phaser';
import { ARENA, CAMERA, CANVAS, DUMMY, HUNTER, HUNTER_ASSIGNMENT } from '../config/tuning';
import { HUNTERS } from '../config/hunters';
import { InputSystem } from '../systems/InputSystem';
import { CombatSystem } from '../systems/CombatSystem';
import type { Hunter, HunterId } from '../entities/Hunter';
import type { DummyTarget, Target } from '../entities/Demon';

// The horde run itself. Wires the fixed-wide camera, the InputSystem,
// the hunters (with their per-slot HunterDef assigned via tuning.ts),
// the inert dummy targets, and the CombatSystem.
//
// Movement is the same player-agnostic step from the scaffold; CombatSystem
// owns auto-attack on top of it. The dummy targets are inert placeholders —
// SpawnSystem and the five real archetypes are the next brief.
export class RunScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private combatSystem!: CombatSystem;
  private readonly hunters: Hunter[] = [];
  private readonly targets: Target[] = [];

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

    for (const pos of DUMMY.POSITIONS) {
      this.targets.push(this.spawnDummy(pos.x, pos.y));
    }

    this.combatSystem = new CombatSystem(this, this.hunters, this.targets);
  }

  update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const hunter of this.hunters) {
      const intent = this.inputSystem.getIntent(hunter.id);
      this.applyMovement(hunter, intent.move.x, intent.move.y, dt);
    }
    this.combatSystem.update(deltaMs);
  }

  private spawnHunter(id: HunterId, x: number, y: number): Hunter {
    const def = HUNTERS[HUNTER_ASSIGNMENT[id]];
    const sprite = this.add.rectangle(x, y, HUNTER.SQUARE_SIZE_PX, HUNTER.SQUARE_SIZE_PX, def.bodyColor);
    return { id, def, x, y, sprite, attackCooldownMs: 0 };
  }

  private spawnDummy(x: number, y: number): DummyTarget {
    const sprite = this.add.rectangle(x, y, DUMMY.SIZE_PX, DUMMY.SIZE_PX, DUMMY.COLOR);
    return {
      kind: 'dummy',
      x,
      y,
      radius: DUMMY.RADIUS_PX,
      hp: DUMMY.HP,
      maxHp: DUMMY.HP,
      alive: true,
      sprite,
      baseColor: DUMMY.COLOR,
      flashRemainingMs: 0,
    };
  }

  private applyMovement(h: Hunter, mx: number, my: number, dt: number): void {
    h.x += mx * HUNTER.MOVE_SPEED_PX_PER_SEC * dt;
    h.y += my * HUNTER.MOVE_SPEED_PX_PER_SEC * dt;
    const half = HUNTER.SQUARE_SIZE_PX / 2;
    h.x = Math.max(half, Math.min(ARENA.WIDTH - half, h.x));
    h.y = Math.max(half, Math.min(ARENA.HEIGHT - half, h.y));
    h.sprite.setPosition(h.x, h.y);
  }
}
