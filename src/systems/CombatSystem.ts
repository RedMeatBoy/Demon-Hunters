import Phaser from 'phaser';
import { ARENA, COMBAT } from '../config/tuning';
import type { Hunter } from '../entities/Hunter';
import type { Target } from '../entities/Demon';
import type { Projectile, ProjectileTeam } from '../entities/Projectile';

// CombatSystem — owns damage exchange between hunters and targets.
//
// Hunter-side: auto-attack behaviour (nearest-target acquisition, the
// melee-arc and projectile code paths), hit detection, damage, and
// clean death.
// Enemy-side: receives damage application calls from EnemySystem
// (enemy contact + telegraphed attack damage to hunters), owns the
// shared Projectile pool (hunter stars and enemy lobs both live here),
// owns hit-flash visuals on both hunters and targets.
//
// Per CLAUDE.md ECS-flavored conventions: entities are dumb data; this
// system operates on them. Per HUNTER-SPEC §5 + the combat brief:
// per-hunter difference lives in `hunters.ts`; no `if (hunter.id === ...)`
// here. Two hunter-attack code paths (melee-arc, projectile) selected on
// weapon kind, both parameterised by the hunter's data.
//
// Co-op: the system iterates `hunters[]` exactly as the movement step
// does. No P1/P2 branching. Each hunter independently picks its own
// nearest target on its own interval.

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
      if (!hunter.alive) continue;
      this.tickHunter(hunter, deltaMs);
    }
    this.tickProjectiles(deltaMs);
    this.tickTargetFlashes(deltaMs);
    this.tickHunterFlashes(deltaMs);
    this.tickSwingVisuals(deltaMs);
    this.pruneDeadTargets();
  }

  // EnemySystem entry point: a telegraphed-attack or contact hit on a
  // hunter. HP is subtracted here so the flash + zero-HP path live in
  // one place.
  applyHitToHunter(hunter: Hunter, damage: number): void {
    if (!hunter.alive) return;
    hunter.hp -= damage;
    hunter.flashRemainingMs = COMBAT.HIT_FLASH_MS;
    hunter.sprite.setFillStyle(COMBAT.HIT_FLASH_COLOR);
    if (hunter.hp <= 0) {
      this.killHunter(hunter);
    }
  }

  // EnemySystem entry point: spawn an enemy projectile (the Dancer lob)
  // into the shared projectile pool. Hunter-side projectiles use the
  // same pool with team === 'hunter'.
  spawnEnemyProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    radius: number,
    color: number,
    lifetimeMs: number,
  ): void {
    const sprite = this.scene.add.circle(x, y, radius, color);
    this.projectiles.push({
      team: 'enemy',
      x,
      y,
      vx,
      vy,
      damage,
      remainingLifetimeMs: lifetimeMs,
      radius,
      alive: true,
      sprite,
    });
  }

  // Parry-outcome entry point: a Dancer lob reflected by Hit the Beat
  // (HIT-THE-BEAT-SPEC §4). Same pool as Nim's stars — damages any
  // enemy it hits, not only its original Dancer.
  spawnHunterProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    radius: number,
    color: number,
    lifetimeMs: number,
  ): void {
    const sprite = this.scene.add.circle(x, y, radius, color);
    this.projectiles.push({
      team: 'hunter',
      x,
      y,
      vx,
      vy,
      damage,
      remainingLifetimeMs: lifetimeMs,
      radius,
      alive: true,
      sprite,
    });
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
      if (dist > range + target.radius) continue;
      const angleToTarget = Math.atan2(dy, dx);
      const angleDelta = Math.abs(Phaser.Math.Angle.Wrap(angleToTarget - facingAngle));
      if (angleDelta > halfAngle) continue;
      this.applyHitToTarget(target, damage);
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
      team: 'hunter',
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

      // First-overlap hit against the projectile's opposing team.
      if (this.hitProjectile(p)) {
        this.killProjectile(p);
      }
    }

    // Compact in-place.
    let write = 0;
    for (let read = 0; read < this.projectiles.length; read++) {
      if (this.projectiles[read].alive) {
        this.projectiles[write++] = this.projectiles[read];
      }
    }
    this.projectiles.length = write;
  }

  // Returns true if the projectile hit and should despawn.
  private hitProjectile(p: Projectile): boolean {
    const team: ProjectileTeam = p.team;
    if (team === 'hunter') {
      for (const target of this.targets) {
        if (!target.alive) continue;
        if (Math.hypot(target.x - p.x, target.y - p.y) > target.radius + p.radius) continue;
        this.applyHitToTarget(target, p.damage);
        return true;
      }
    } else {
      for (const hunter of this.hunters) {
        if (!hunter.alive) continue;
        // Hunter hit radius approximates the square as a circle around its centre.
        const hunterRadius = hunter.sprite.width / 2;
        if (Math.hypot(hunter.x - p.x, hunter.y - p.y) > hunterRadius + p.radius) continue;
        this.applyHitToHunter(hunter, p.damage);
        return true;
      }
    }
    return false;
  }

  private killProjectile(p: Projectile): void {
    if (!p.alive) return;
    p.alive = false;
    p.sprite.destroy();
  }

  private applyHitToTarget(target: Target, damage: number): void {
    if (!target.alive) return;
    target.hp -= damage;
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

  private killHunter(hunter: Hunter): void {
    if (!hunter.alive) return;
    hunter.alive = false;
    hunter.hp = 0;
    // Minimal handling per ENEMY-BRIEF §5: hide the sprite, don't destroy
    // (so any in-flight references stay stable), don't build a death
    // animation or run-end flow. RunDirector / run-flow is a later brief.
    hunter.sprite.setVisible(false);
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

  private tickTargetFlashes(deltaMs: number): void {
    for (const target of this.targets) {
      if (!target.alive) continue;
      if (target.flashRemainingMs <= 0) continue;
      target.flashRemainingMs -= deltaMs;
      if (target.flashRemainingMs <= 0) {
        target.sprite.setFillStyle(target.baseColor);
      }
    }
  }

  private tickHunterFlashes(deltaMs: number): void {
    for (const hunter of this.hunters) {
      if (!hunter.alive) continue;
      if (hunter.flashRemainingMs <= 0) continue;
      hunter.flashRemainingMs -= deltaMs;
      if (hunter.flashRemainingMs <= 0) {
        hunter.sprite.setFillStyle(hunter.baseColor);
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
