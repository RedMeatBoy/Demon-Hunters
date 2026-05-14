import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { RunScene } from './scenes/RunScene';
import { ResultsScene } from './scenes/ResultsScene';
import { CANVAS } from './config/tuning';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: CANVAS.WIDTH,
  height: CANVAS.HEIGHT,
  backgroundColor: CANVAS.BACKGROUND_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  scene: [BootScene, MenuScene, RunScene, ResultsScene],
};

new Phaser.Game(config);
