import Phaser from 'phaser';

// Load, init, hand off. Goes straight to RunScene for now;
// MenuScene/ResultsScene own the handoff flow once they're built.
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.scene.start('RunScene');
  }
}
