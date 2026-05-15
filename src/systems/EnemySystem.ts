import Phaser from 'phaser';
import { ATTACK, ENEMY, HUNTER } from '../config/tuning';
import type { AttackDef, LobAttack, SlamAttack } from '../config/enemies';
import type { Demon } from '../entities/Demon';
import type { Hunter } from '../entities/Hunter';
import type { CombatSystem } from './CombatSystem';

// EnemySystem — enemy movement and the windup → strike → recovery state
// machine. Five data-selected movement behaviours (one per movementKind);
// three data-selected attack behaviours (lunge, lob, slam). Body-animation
// windup tells are applied here (sprite fill swaps to def.windupTintColor
// during 'windup' and restores at end of windup).
//
// Damage is applied via CombatSystem (the system that owns the
// hunters-take-damage path and the shared projectile pool). EnemySystem
// is the source of enemy-side intent; CombatSystem is the resolver.
//
// Co-op: each enemy independently targets its nearest hunter. No P1/P2
// branching — iterate hunters[], pick nearest. Different enemies may
// target different hunters in the same frame.
//
// Per CLAUDE.md no per-id branching: behaviour selects on `movementKind`
// (and `attack.kind` when an attack exists), never on `enemy.def.id`.

interface SlamRingVisual {
  remainingMs: number;
  readonly visual: Phaser.GameObjects.Arc;
}

export class EnemySystem {
  private readonly scene: Phaser.Scene;
  private readonly enemies: Demon[];
  private readonly hunters: readonly Hunter[];
  private readonly combat: CombatSystem;
  // Slam-ring visuals are decoupled from their owner enemy. A Bouncer
  // can be killed mid-slam-recovery without leaking its ring; the pool
  // outlives the enemy.
  private readonly slamVisuals: SlamRingVisual[] = [];

  constructor(
    scene: Phaser.Scene,
    enemies: Demon[],
    hunters: readonly Hunter[],
    combat: CombatSystem,
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.hunters = hunters;
    this.combat = combat;
  }

  update(deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      this.tickEnemy(enemy, deltaMs, dt);
    }
    this.tickSlamVisuals(deltaMs);
  }

  private tickEnemy(enemy: Demon, deltaMs: number, dt: number): void {
    // 1. Tick timers.
    if (enemy.attackCooldownMs > 0) enemy.attackCooldownMs -= deltaMs;
    if (enemy.contactCooldownByHunter.P1 > 0) enemy.contactCooldownByHunter.P1 -= deltaMs;
    if (enemy.contactCooldownByHunter.P2 > 0) enemy.contactCooldownByHunter.P2 -= deltaMs;

    // 2. State machine.
    switch (enemy.state) {
      case 'moving':
        this.tickMoving(enemy, dt);
        this.maybeEnterWindup(enemy);
        break;
      case 'windup':
        enemy.stateTimerMs -= deltaMs;
        if (enemy.stateTimerMs <= 0) {
          this.endWindup(enemy);
        }
        break;
      case 'striking':
        this.tickStriking(enemy, deltaMs, dt);
        break;
      case 'recovery':
        enemy.stateTimerMs -= deltaMs;
        if (enemy.stateTimerMs <= 0) {
          enemy.state = 'moving';
        }
        break;
    }

    // 3. Contact damage (any state — the body is solid).
    this.applyContactDamage(enemy);

    // 4. Sync visual to position.
    enemy.sprite.setPosition(enemy.x, enemy.y);
  }

  // ---- Movement ---------------------------------------------------------

  private tickMoving(enemy: Demon, dt: number): void {
    const target = this.nearestHunter(enemy);
    if (!target) return;
    const speed = enemy.def.moveSpeedPxPerSec;
    switch (enemy.def.movementKind) {
      case 'direct':
      case 'big-direct':
      case 'approach-lunge':
        this.moveDirect(enemy, target, speed, dt);
        break;
      case 'weave':
        this.moveWeave(enemy, target, speed, dt);
        break;
      case 'circle-strafe':
        this.moveCircleStrafe(enemy, target, speed, dt);
        break;
    }
  }

  private moveDirect(enemy: Demon, target: Hunter, speed: number, dt: number): void {
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    enemy.x += (dx / len) * speed * dt;
    enemy.y += (dy / len) * speed * dt;
  }

  private moveWeave(enemy: Demon, target: Hunter, speed: number, dt: number): void {
    enemy.weavePhase += ENEMY.WEAVER_ANGLE_FREQUENCY_RAD_PER_SEC * dt;
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const baseAngle = Math.atan2(dy, dx);
    const angle = baseAngle + Math.sin(enemy.weavePhase) * ENEMY.WEAVER_ANGLE_AMPLITUDE_RAD;
    enemy.x += Math.cos(angle) * speed * dt;
    enemy.y += Math.sin(angle) * speed * dt;
  }

  private moveCircleStrafe(enemy: Demon, target: Hunter, speed: number, dt: number): void {
    // Orbit at the preferred radius around `target`. Advance the orbit
    // angle from the enemy's current angular position so she keeps
    // moving around the ring even from any starting position.
    const fromTargetX = enemy.x - target.x;
    const fromTargetY = enemy.y - target.y;
    const currentAngle = Math.atan2(fromTargetY, fromTargetX);
    enemy.orbitAngle = currentAngle + ENEMY.DANCER_ORBIT_ANGULAR_SPEED_RAD_PER_SEC * dt;

    const desiredX = target.x + Math.cos(enemy.orbitAngle) * ENEMY.DANCER_ORBIT_RADIUS_PX;
    const desiredY = target.y + Math.sin(enemy.orbitAngle) * ENEMY.DANCER_ORBIT_RADIUS_PX;
    const ddx = desiredX - enemy.x;
    const ddy = desiredY - enemy.y;
    const ddist = Math.hypot(ddx, ddy) || 1;
    const step = Math.min(ddist, speed * dt);
    enemy.x += (ddx / ddist) * step;
    enemy.y += (ddy / ddist) * step;
  }

  // ---- State machine ----------------------------------------------------

  private maybeEnterWindup(enemy: Demon): void {
    const attack = enemy.def.attack;
    if (!attack) return;
    if (enemy.attackCooldownMs > 0) return;

    const target = this.nearestHunter(enemy);
    if (!target) return;

    let triggered = false;
    if (attack.trigger === 'in-range') {
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      triggered = Math.hypot(dx, dy) <= attack.triggerRangePx;
    } else {
      // 'on-cooldown' — Dancer fires whenever cooldown is ready.
      triggered = true;
    }
    if (!triggered) return;

    this.enterWindup(enemy, attack, target);
  }

  private enterWindup(enemy: Demon, attack: AttackDef, target: Hunter): void {
    enemy.state = 'windup';
    enemy.stateTimerMs = attack.windupMs;
    // Body-animation tell. Per ENEMY-BRIEF §3: must be unmistakable.
    enemy.sprite.setFillStyle(enemy.def.windupTintColor);

    if (attack.kind === 'lunge') {
      // Lock direction at windup-start so the hunter can sidestep the
      // telegraphed line during the windup — that is the dodge floor
      // (HIT-THE-BEAT-SPEC §1.1 + §1.3 made literal here).
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const len = Math.hypot(dx, dy) || 1;
      enemy.lungeDirX = dx / len;
      enemy.lungeDirY = dy / len;
      enemy.lungeRemainingPx = attack.lungeDistancePx;
      enemy.lungeHits.clear();
    }
  }

  private endWindup(enemy: Demon): void {
    const attack = enemy.def.attack;
    if (!attack) return;
    // Restore base body colour — the windup tell ends.
    enemy.sprite.setFillStyle(enemy.def.bodyColor);

    switch (attack.kind) {
      case 'lunge':
        // Lunge has a real continuous striking state — the corridor sweep.
        enemy.state = 'striking';
        enemy.stateTimerMs = (attack.lungeDistancePx / attack.lungeSpeedPxPerSec) * 1000;
        break;
      case 'slam':
        this.executeSlam(enemy, attack);
        this.enterRecovery(enemy, attack);
        break;
      case 'lob':
        this.executeLob(enemy, attack);
        this.enterRecovery(enemy, attack);
        break;
    }
  }

  private tickStriking(enemy: Demon, deltaMs: number, dt: number): void {
    const attack = enemy.def.attack;
    if (!attack || attack.kind !== 'lunge') {
      // Defensive — slam/lob never enter 'striking' continuously.
      enemy.state = 'recovery';
      return;
    }
    enemy.stateTimerMs -= deltaMs;

    const lunge = attack;
    const step = lunge.lungeSpeedPxPerSec * dt;
    enemy.x += enemy.lungeDirX * step;
    enemy.y += enemy.lungeDirY * step;
    enemy.lungeRemainingPx -= step;

    // Damage hunters caught in the corridor sweep. One hit per hunter
    // per lunge (lungeHits guards re-entry).
    const reach = enemy.radius + lunge.lungeWidthPx / 2 + HUNTER.SQUARE_SIZE_PX / 2;
    for (const hunter of this.hunters) {
      if (!hunter.alive) continue;
      if (enemy.lungeHits.has(hunter.id)) continue;
      const dx = hunter.x - enemy.x;
      const dy = hunter.y - enemy.y;
      if (Math.hypot(dx, dy) > reach) continue;
      this.combat.applyHitToHunter(hunter, lunge.damage);
      enemy.lungeHits.add(hunter.id);
    }

    if (enemy.lungeRemainingPx <= 0 || enemy.stateTimerMs <= 0) {
      this.enterRecovery(enemy, lunge);
    }
  }

  private enterRecovery(enemy: Demon, attack: AttackDef): void {
    enemy.state = 'recovery';
    enemy.stateTimerMs = attack.recoveryMs;
    enemy.attackCooldownMs = attack.cooldownMs;
    enemy.sprite.setFillStyle(enemy.def.bodyColor);
  }

  // ---- Strike execution -------------------------------------------------

  private executeSlam(enemy: Demon, slam: SlamAttack): void {
    const reach = slam.slamRadiusPx + HUNTER.SQUARE_SIZE_PX / 2;
    for (const hunter of this.hunters) {
      if (!hunter.alive) continue;
      const dx = hunter.x - enemy.x;
      const dy = hunter.y - enemy.y;
      if (Math.hypot(dx, dy) > reach) continue;
      this.combat.applyHitToHunter(hunter, slam.damage);
    }
    // Slam-ring visual lingers so the impact is legible. Pooled so it
    // outlives the Bouncer if she dies mid-recovery.
    const ring = this.scene.add.circle(
      enemy.x,
      enemy.y,
      slam.slamRadiusPx,
      slam.slamRingColor,
      0.28,
    );
    this.slamVisuals.push({
      remainingMs: ATTACK.BOUNCER_SLAM_VISUAL_LINGER_MS,
      visual: ring,
    });
  }

  private executeLob(enemy: Demon, lob: LobAttack): void {
    const target = this.nearestHunter(enemy);
    if (!target) return;
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    const vx = (dx / dist) * lob.projectileSpeedPxPerSec;
    const vy = (dy / dist) * lob.projectileSpeedPxPerSec;
    // Lifetime: enough to reach the target's current position with
    // generous margin (projectile is slow + hunter may move).
    const lifetimeMs = (dist / lob.projectileSpeedPxPerSec) * 1000 * 1.6;
    this.combat.spawnEnemyProjectile(
      enemy.x,
      enemy.y,
      vx,
      vy,
      lob.damage,
      lob.projectileRadiusPx,
      lob.projectileColor,
      lifetimeMs,
    );
  }

  // ---- Contact damage ---------------------------------------------------

  private applyContactDamage(enemy: Demon): void {
    const reach = enemy.radius + HUNTER.SQUARE_SIZE_PX / 2;
    for (const hunter of this.hunters) {
      if (!hunter.alive) continue;
      if (enemy.contactCooldownByHunter[hunter.id] > 0) continue;
      const dx = hunter.x - enemy.x;
      const dy = hunter.y - enemy.y;
      if (Math.hypot(dx, dy) > reach) continue;
      this.combat.applyHitToHunter(hunter, enemy.def.contactDamage);
      enemy.contactCooldownByHunter[hunter.id] = ENEMY.CONTACT_TICK_INTERVAL_MS;
    }
  }

  // ---- Helpers ----------------------------------------------------------

  private nearestHunter(enemy: Demon): Hunter | null {
    let nearest: Hunter | null = null;
    let bestDist = Infinity;
    for (const hunter of this.hunters) {
      if (!hunter.alive) continue;
      const dx = hunter.x - enemy.x;
      const dy = hunter.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      if (dist < bestDist) {
        bestDist = dist;
        nearest = hunter;
      }
    }
    return nearest;
  }

  private tickSlamVisuals(deltaMs: number): void {
    let write = 0;
    for (let read = 0; read < this.slamVisuals.length; read++) {
      const s = this.slamVisuals[read];
      s.remainingMs -= deltaMs;
      if (s.remainingMs <= 0) {
        s.visual.destroy();
      } else {
        this.slamVisuals[write++] = s;
      }
    }
    this.slamVisuals.length = write;
  }
}

