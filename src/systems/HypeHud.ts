import Phaser from 'phaser';
import { CANVAS, HUD } from '../config/tuning';
import type { Hunter, HunterId } from '../entities/Hunter';
import type { ParrySystem } from './ParrySystem';

// HypeHud — per-player Hype meter on the HUD (PARRY-BRIEF §6). The only
// HUD this brief adds. Hunter-HP, score, combo etc. are flagged for a
// later HUD brief and intentionally out of scope here.
//
// Two bars, one per player, position-anchored to the corner matching
// the player's side of the keyboard (P1/WASD → top-left, P2/arrows →
// top-right). Colour matches the hunter's body so the mapping reads
// without a label.
//
// Reads ParrySystem via getHypeFraction / getHypeFlashAlpha each frame.
// The flash overlay's alpha scales with parry precision — a center-of-
// window parry has a bigger jump than an edge parry, per the brief.

interface HudEntry {
  readonly hunter: Hunter;
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly fill: Phaser.GameObjects.Rectangle;
  readonly flash: Phaser.GameObjects.Rectangle;
  readonly fullBorder: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly x: number;
  readonly y: number;
}

export class HypeHud {
  private readonly scene: Phaser.Scene;
  private readonly parry: ParrySystem;
  private readonly entries: HudEntry[] = [];

  constructor(scene: Phaser.Scene, hunters: readonly Hunter[], parry: ParrySystem) {
    this.scene = scene;
    this.parry = parry;
    for (const hunter of hunters) {
      this.entries.push(this.createEntry(hunter));
    }
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  update(): void {
    for (const e of this.entries) {
      const fraction = this.parry.getHypeFraction(e.hunter.id);
      const filledWidth = HUD.HYPE_BAR_WIDTH_PX * fraction;
      e.fill.width = filledWidth;
      // The flash overlay sizes to the FILL — only the populated portion
      // of the bar pulses on a parry, so the empty portion does not
      // mis-read as "the meter just gained".
      e.flash.width = filledWidth;
      e.flash.setAlpha(this.parry.getHypeFlashAlpha(e.hunter.id));

      const ready = fraction >= 1.0;
      e.fullBorder.setVisible(ready);
      e.label.setText(ready ? `${e.hunter.def.name} — READY` : e.hunter.def.name);
      e.label.setColor(ready ? HUD.HYPE_BAR_LABEL_READY_COLOR : HUD.HYPE_BAR_LABEL_COLOR);
    }
  }

  private createEntry(hunter: Hunter): HudEntry {
    const { x, y } = cornerForPlayer(hunter.id);
    const w = HUD.HYPE_BAR_WIDTH_PX;
    const h = HUD.HYPE_BAR_HEIGHT_PX;

    const bg = this.scene.add.rectangle(
      x, y, w, h,
      HUD.HYPE_BAR_BACKGROUND_COLOR,
      HUD.HYPE_BAR_BACKGROUND_ALPHA,
    )
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    const fill = this.scene.add.rectangle(x, y, 0, h, hunter.def.bodyColor)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1001);

    const flash = this.scene.add.rectangle(x, y, w, h, HUD.HYPE_BAR_FULL_FLASH_COLOR, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1002);

    const fullBorder = this.scene.add.rectangle(x, y, w, h)
      .setOrigin(0, 0)
      .setStrokeStyle(HUD.HYPE_BAR_FULL_BORDER_PX, HUD.HYPE_BAR_FULL_BORDER_COLOR)
      .setScrollFactor(0)
      .setDepth(1003)
      .setVisible(false);

    const label = this.scene.add.text(
      x,
      y + h + 4,
      hunter.def.name,
      {
        fontFamily: 'monospace, sans-serif',
        fontSize: `${HUD.HYPE_BAR_LABEL_FONT_PX}px`,
        color: HUD.HYPE_BAR_LABEL_COLOR,
      },
    )
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1004);

    return { hunter, bg, fill, flash, fullBorder, label, x, y };
  }

  private destroy(): void {
    for (const e of this.entries) {
      e.bg.destroy();
      e.fill.destroy();
      e.flash.destroy();
      e.fullBorder.destroy();
      e.label.destroy();
    }
    this.entries.length = 0;
  }
}

function cornerForPlayer(id: HunterId): { x: number; y: number } {
  const pad = HUD.HYPE_BAR_PADDING_PX;
  const w = HUD.HYPE_BAR_WIDTH_PX;
  switch (id) {
    case 'P1': return { x: pad, y: pad };
    case 'P2': return { x: CANVAS.WIDTH - pad - w, y: pad };
  }
}
