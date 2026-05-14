import Phaser from 'phaser';
import { CAMERA, CANVAS } from '../config/tuning';

// The horde run itself. This scaffold sets up the fixed-wide camera and
// a flat background; entities and systems are wired in later commits.
export class RunScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, CAMERA.WIDTH, CAMERA.HEIGHT);
    this.cameras.main.setBackgroundColor(CANVAS.BACKGROUND_COLOR);
  }
}
