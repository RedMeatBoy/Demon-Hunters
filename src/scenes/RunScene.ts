import Phaser from 'phaser';
import { ARENA, CAMERA, CANVAS, HUNTER } from '../config/tuning';
import { InputSystem } from '../systems/InputSystem';
import type { Hunter, HunterId } from '../entities/Hunter';

// The horde run itself. Wires the fixed-wide camera, the InputSystem,
// and the hunters as solid-colour squares. The movement step is
// player-agnostic — each hunter reads its own intent and runs the same
// movement + arena-clamp path. Temporary; it migrates to CombatSystem
// (or its own movement system) once that exists.
export class RunScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private readonly hunters: Hunter[] = [];

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, CAMERA.WIDTH, CAMERA.HEIGHT);
    this.cameras.main.setBackgroundColor(CANVAS.BACKGROUND_COLOR);

    this.inputSystem = new InputSystem(this);

    const cx = ARENA.WIDTH / 2;
    const cy = ARENA.HEIGHT / 2;
    this.hunters.push(this.spawnHunter('P1', cx, cy, HUNTER.P1_COLOR));
  }

  update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const hunter of this.hunters) {
      const intent = this.inputSystem.getIntent(hunter.id);
      this.applyMovement(hunter, intent.move.x, intent.move.y, dt);
    }
  }

  private spawnHunter(id: HunterId, x: number, y: number, color: number): Hunter {
    const sprite = this.add.rectangle(x, y, HUNTER.SQUARE_SIZE_PX, HUNTER.SQUARE_SIZE_PX, color);
    return { id, x, y, sprite };
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
