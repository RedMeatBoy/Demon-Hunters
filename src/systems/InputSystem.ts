import Phaser from 'phaser';
import { INPUT } from '../config/tuning';

export type PlayerId = 'P1' | 'P2';

export interface MoveVector {
  readonly x: number;
  readonly y: number;
}

// One intent per player per frame. Parry and dash fields are defined now
// so the consumer surface is stable for the next tasks (co-op, then the
// parry layer per HIT-THE-BEAT-SPEC) — they are unconsumed in this task.
export interface PlayerIntent {
  readonly move: MoveVector;
  readonly parryHeld: boolean;
  readonly parryPressed: boolean;
  readonly dashHeld: boolean;
  readonly dashPressed: boolean;
}

interface PlayerBindings {
  readonly UP: string;
  readonly DOWN: string;
  readonly LEFT: string;
  readonly RIGHT: string;
  readonly PARRY: string;
  readonly DASH: string;
}

// The ONLY place raw keyboard state is read (CLAUDE.md). Consumers call
// getIntent(playerId) — they never see a key. A second player and a
// future gamepad source are additive: more bindings, more intent
// producers, same intent shape.
export class InputSystem {
  private readonly held = new Set<string>();
  private pressedThisFrame = new Set<string>();
  private readonly bindingsByPlayer: Record<PlayerId, PlayerBindings>;
  private readonly ownedKeys: ReadonlySet<string>;
  private readonly onKeyDown: (e: KeyboardEvent) => void;
  private readonly onKeyUp: (e: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene) {
    this.bindingsByPlayer = { P1: INPUT.P1, P2: INPUT.P2 };
    this.ownedKeys = new Set<string>([
      ...Object.values(INPUT.P1),
      ...Object.values(INPUT.P2),
    ]);

    this.onKeyDown = (e: KeyboardEvent) => {
      if (!this.ownedKeys.has(e.code)) return;
      // Space scrolls the page; Ctrl-combos hit browser shortcuts.
      e.preventDefault();
      if (!this.held.has(e.code)) this.pressedThisFrame.add(e.code);
      this.held.add(e.code);
    };

    this.onKeyUp = (e: KeyboardEvent) => {
      if (!this.ownedKeys.has(e.code)) return;
      e.preventDefault();
      this.held.delete(e.code);
    };

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroy());
  }

  getIntent(player: PlayerId): PlayerIntent {
    const b = this.bindingsByPlayer[player];
    const up = this.held.has(b.UP) ? 1 : 0;
    const down = this.held.has(b.DOWN) ? 1 : 0;
    const left = this.held.has(b.LEFT) ? 1 : 0;
    const right = this.held.has(b.RIGHT) ? 1 : 0;

    let x = right - left;
    let y = down - up;

    // Normalise diagonals so a kid on WASD doesn't move sqrt(2) faster diagonally.
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }

    return {
      move: { x, y },
      parryHeld: this.held.has(b.PARRY),
      parryPressed: this.pressedThisFrame.has(b.PARRY),
      dashHeld: this.held.has(b.DASH),
      dashPressed: this.pressedThisFrame.has(b.DASH),
    };
  }

  // Edge-triggered flags are valid for one frame; clear after consumers read.
  endFrame(): void {
    this.pressedThisFrame.clear();
  }

  private destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.held.clear();
    this.pressedThisFrame.clear();
  }
}
