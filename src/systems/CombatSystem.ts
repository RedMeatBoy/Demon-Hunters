import Phaser from 'phaser';
import { ARENA, COMBAT } from '../config/tuning';
import type { Hunter } from '../entities/Hunter';
import type { Target } from '../entities/Demon';
import type { Projectile } from '../entities/Projectile';

// CombatSystem — owns auto-attack behaviour for all hunters: nearest-enemy
// targeting, the melee-arc and projectile attack code paths, hit detection,
// damage, and clean death.
//
// Per CLAUDE.md ECS-flavored conventions: entities are dumb data; this
// system operates on them. Per HUNTER-SPEC §5 + the combat brief:
// per-hunter difference lives in `hunters.ts`; no `if (hunter.id === ...)`
// here. Two code paths (melee-arc, projectile) selected on weapon kind,
// both parameterised by the hunter's data.
//
// Co-op: the system iterates `hunters[]` exactly as the movement step does.
// No P1/P2 branching. Each hunter independently picks its own nearest
// target, on its own interval.

interface SwingVisual {
  remainingMs: number;
  readonly graphics: Phaser.GameObjects.Graphics;
}

export class CombatSystem {
  private readonly scene: Phaser.Scene;
  private readonly hunters: readonly Hunter[];
  private readonly targets: Target[];
  private readonly projectiles: Projectile[] = [];
  private readonly swingVisuals: SwingVisual[] = [];

  constructor(scene: Phaser.Scene, hunters: readonly Hunter[], targets: Target[]) {
    this.scene = scene;
    this.hunters = hunters;
    this.targets = targets;
  }

  update(deltaMs: number): void {
    for (const hunter of this.hunters) {
      this.tickHunter(hunter, deltaMs);
    }
    this.tickProjectiles(deltaMs);
    this.tickFlashes(deltaMs);
    this.tickSwingVisuals(deltaMs);
    this.pruneDeadTargets();
  }

  private tickHunter(hunter: Hunter, deltaMs: number): void {
    if (hunter.attackCooldownMs > 0) {
      hunter.attackCooldownMs -= deltaMs;
      if (hunter.attackCooldownMs > 0) return;
    }

    const range = this.effectiveRange(hunter);
    const target = this.nearestTargetInRange(hunter, range);
    if (!target) {
      // No target in range: clamp the cooldown so it doesn't build up
      // negative debt while the hunter waits — when a target enters range,
      // the attack fires immediately, then the normal cycle resumes.
      // (DESIGN-PILLARS Pillar 1: never punish the floor case.)
      hunter.attackCooldownMs = 0;
      return;
    }

    this.fireAttack(hunter, target, range);
    // Roll the cooldown forward (don't reset to zero) so the cadence is
    // honest under variable frame time.
    hunter.attackCooldownMs += this.effectiveInterval(hunter);
  }

  private fireAttack(hunter: Hunter, target: Target, range: number): void {
    const dx = target.x - hunter.x;
    const dy = target.y - hunter.y;
    const facingAngle = Math.atan2(dy, dx);

    if (hunter.def.weaponKind === 'stars') {
      this.fireProjectile(hunter, facingAngle, range);
    } else {
      // sword + staff both run this melee path. The only difference between
      // Riya and Bex is the data they carry (HUNTER-SPEC §5).
      this.fireMeleeArc(hunter, facingAngle, range);
    }
  }

  private fireMeleeArc(hunter: Hunter, facingAngle: number, range: number): void {
    const damage = this.effectiveDamage(hunter);
    const halfAngle = COMBAT.MELEE_ARC_HALF_ANGLE_RAD;

    for (const target of this.targets) {
      if (!target.alive) continue;
      const dx = target.x - hunter.x;
      const dy = target.y - hunter.y;
      const dist = Math.hypot(dx, dy);
      // Inclusive: a target touching the swing edge still gets hit.
      if (dist > range + target.radius) continue;
      const angleToTarget = Math.atan2(dy, dx);
      const angleDelta = Math.abs(Phaser.Math.Angle.Wrap(angleToTarget - facingAngle));
      if (angleDelta > halfAngle) continue;
      this.applyHit(target, damage);
    }

    this.spawnSwingVisual(hunter, facingAngle, range);
  }

  private fireProjectile(hunter: Hunter, facingAngle: number, range: number): void {
    const speed = COMBAT.PROJECTILE_SPEED_PX_PER_SEC;
    const vx = Math.cos(facingAngle) * speed;
    const vy = Math.sin(facingAngle) * speed;
    // Lifetime carries the hunter's effective range: a star travels exactly
    // `range` px before despawning, independent of speed.
    const lifetimeMs = (range / speed) * 1000;

    const sprite = this.scene.add.circle(
      hunter.x,
      hunter.y,
      COMBAT.PROJECTILE_RADIUS_PX,
      COMBAT.PROJECTILE_COLOR,
    );

    const projectile: Projectile = {
      x: hunter.x,
      y: hunter.y,
      vx,
      vy,
      damage: this.effectiveDamage(hunter),
      remainingLifetimeMs: lifetimeMs,
      radius: COMBAT.PROJECTILE_RADIUS_PX,
      alive: true,
      sprite,
    };
    this.projectiles.push(projectile);
  }

  private tickProjectiles(deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.remainingLifetimeMs -= deltaMs;
      p.sprite.setPosition(p.x, p.y);

      // Arena-bounds despawn — catches the edge case where lifetime would
      // run a star past the play area.
      const outOfArena = p.x < 0 || p.x > ARENA.WIDTH || p.y < 0 || p.y > ARENA.HEIGHT;
      if (p.remainingLifetimeMs <= 0 || outOfArena) {
        this.killProjectile(p);
        continue;
      }

      // First-overlap hit: a projectile damages the first alive target it
      // touches and despawns. No piercing in this brief.
      for (const target of this.targets) {
        if (!target.alive) continue;
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        if (Math.hypot(dx, dy) > target.radius + p.radius) continue;
        this.applyHit(target, p.damage);
        this.killProjectile(p);
        break;
      }
    }

    // Compact the array in-place rather than splicing during iteration.
    let write = 0;
    for (let read = 0; read < this.projectiles.length; read++) {
      if (this.projectiles[read].alive) {
        this.projectiles[write++] = this.projectiles[read];
      }
    }
    this.projectiles.length = write;
  }

  private killProjectile(p: Projectile): void {
    if (!p.alive) return;
    p.alive = false;
    p.sprite.destroy();
  }

  private applyHit(target: Target, damage: number): void {
    if (!target.alive) return;
    target.hp -= damage;
    // Minimal hit feedback (the brief's §5): a brief tint flash. The juice
    // pass — shake, hitstop, particles, floating numbers, combo — is a
    // dedicated later brief.
    target.flashRemainingMs = COMBAT.HIT_FLASH_MS;
    target.sprite.setFillStyle(COMBAT.HIT_FLASH_COLOR);

    if (target.hp <= 0) {
      this.killTarget(target);
    }
  }

  private killTarget(target: Target): void {
    if (!target.alive) return;
    target.alive = false;
    target.hp = 0;
    target.sprite.destroy();
  }

  private pruneDeadTargets(): void {
    let write = 0;
    for (let read = 0; read < this.targets.length; read++) {
      if (this.targets[read].alive) {
        this.targets[write++] = this.targets[read];
      }
    }
    this.targets.length = write;
  }

  private tickFlashes(deltaMs: number): void {
    for (const target of this.targets) {
      if (!target.alive) continue;
      if (target.flashRemainingMs <= 0) continue;
      target.flashRemainingMs -= deltaMs;
      if (target.flashRemainingMs <= 0) {
        target.sprite.setFillStyle(target.baseColor);
      }
    }
  }

  private spawnSwingVisual(hunter: Hunter, facingAngle: number, range: number): void {
    const halfAngle = COMBAT.MELEE_ARC_HALF_ANGLE_RAD;
    const g = this.scene.add.graphics();
    g.fillStyle(hunter.def.bodyColor, 0.32);
    g.beginPath();
    g.moveTo(hunter.x, hunter.y);
    g.arc(hunter.x, hunter.y, range, facingAngle - halfAngle, facingAngle + halfAngle, false);
    g.closePath();
    g.fillPath();
    this.swingVisuals.push({ remainingMs: COMBAT.MELEE_SWING_DURATION_MS, graphics: g });
  }

  private tickSwingVisuals(deltaMs: number): void {
    let write = 0;
    for (let read = 0; read < this.swingVisuals.length; read++) {
      const s = this.swingVisuals[read];
      s.remainingMs -= deltaMs;
      if (s.remainingMs <= 0) {
        s.graphics.destroy();
      } else {
        this.swingVisuals[write++] = s;
      }
    }
    this.swingVisuals.length = write;
  }

  private nearestTargetInRange(hunter: Hunter, range: number): Target | null {
    let nearest: Target | null = null;
    let nearestDist = Infinity;
    for (const target of this.targets) {
      if (!target.alive) continue;
      const dx = target.x - hunter.x;
      const dy = target.y - hunter.y;
      const dist = Math.hypot(dx, dy);
      // Range is centre-to-centre + the target's hit radius so a target
      // touching the range edge still counts.
      if (dist > range + target.radius) continue;
      if (dist < nearestDist) {
        nearest = target;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  private effectiveInterval(hunter: Hunter): number {
    return COMBAT.RIYA_BASELINE_ATTACK_INTERVAL_MS * hunter.def.attackIntervalMultiplier;
  }

  private effectiveRange(hunter: Hunter): number {
    return COMBAT.RIYA_BASELINE_RANGE_PX * hunter.def.rangeMultiplier;
  }

  private effectiveDamage(hunter: Hunter): number {
    return COMBAT.RIYA_BASELINE_DAMAGE * hunter.def.damageMultiplier;
  }
}
