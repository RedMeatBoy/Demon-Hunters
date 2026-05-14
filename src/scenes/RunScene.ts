import Phaser from 'phaser';
import { CAMERA, CANVAS, HUNTER } from '../config/tuning';
import { InputSystem } from '../systems/InputSystem';
import type { Hunter } from '../entities/Hunter';

// The horde run itself. The scaffold wires the fixed-wide camera, the
// InputSystem, and one Player-1 Hunter as a solid-colour square.
// Movement glue is the minimal seam noted in SCAFFOLD-BRIEF — temporary;
// it migrates to CombatSystem (or its own movement system) once that exists.
export class RunScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private p1!: Hunter;

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, CAMERA.WIDTH, CAMERA.HEIGHT);
    this.cameras.main.setBackgroundColor(CANVAS.BACKGROUND_COLOR);

    this.inputSystem = new InputSystem(this);
    this.p1 = this.spawnHunter('P1', CANVAS.WIDTH / 2, CANVAS.HEIGHT / 2, HUNTER.P1_COLOR);
  }

  update(_time: number, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const intent = this.inputSystem.getIntent('P1');
    this.applyMovement(this.p1, intent.move.x, intent.move.y, dt);
    this.inputSystem.endFrame();
  }

  private spawnHunter(id: 'P1' | 'P2', x: number, y: number, color: number): Hunter {
    const sprite = this.add.rectangle(x, y, HUNTER.SQUARE_SIZE_PX, HUNTER.SQUARE_SIZE_PX, color);
    return { id, x, y, sprite };
  }

  private applyMovement(h: Hunter, mx: number, my: number, dt: number): void {
    h.x += mx * HUNTER.MOVE_SPEED_PX_PER_SEC * dt;
    h.y += my * HUNTER.MOVE_SPEED_PX_PER_SEC * dt;
    h.sprite.setPosition(h.x, h.y);
  }
}
