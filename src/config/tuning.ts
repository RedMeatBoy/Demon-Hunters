// The dial board. Every magic number in the prototype lives here.

import type { HunterDefId } from './hunters';

export const CANVAS = {
  WIDTH: 1280,
  HEIGHT: 720,
  BACKGROUND_COLOR: 0x141826,
} as const;

// Fixed-wide shared camera (PROTOTYPE-SCOPE.md): wide enough that neither
// player can scroll the other off-screen. Dynamic zoom is out of scope.
export const CAMERA = {
  WIDTH: 1280,
  HEIGHT: 720,
} as const;

// The arena hunters move within. Sized to the canvas so the fixed-wide
// camera shows the whole play area; hunters are clamped to this box, so
// neither player can wander off-screen (no scrolling, no follow).
export const ARENA = {
  WIDTH: CANVAS.WIDTH,
  HEIGHT: CANVAS.HEIGHT,
} as const;

// Player bindings. Values are KeyboardEvent.code strings so the mapping
// is independent of the user's keyboard layout (CLAUDE.md control map).
export const INPUT = {
  P1: {
    UP: 'KeyW',
    DOWN: 'KeyS',
    LEFT: 'KeyA',
    RIGHT: 'KeyD',
    PARRY: 'Space',
    DASH: 'ControlLeft',
  },
  P2: {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    PARRY: 'Numpad0',
    DASH: 'NumpadEnter',
  },
} as const;

export const HUNTER = {
  MOVE_SPEED_PX_PER_SEC: 240,
  SQUARE_SIZE_PX: 28,
  // Each player spawns this many px horizontally from arena centre.
  SPAWN_OFFSET_X_PX: 80,
  // Identical across the three hunters (HUNTER-SPEC §4 — hard line for
  // the prototype). PROVISIONAL — moves in playtest.
  MAX_HP: 10,
} as const;

// Which HunterDef each player slot plays this run. Swap to demo other
// hunters. A real character-select lives in MenuScene (HUNTER-SPEC §6).
export const HUNTER_ASSIGNMENT: Record<'P1' | 'P2', HunterDefId> = {
  P1: 'bex',
  P2: 'nim',
};

// Combat baseline absolutes — Riya = 1.0× anchor; HUNTER-SPEC §2's
// triangle multipliers in hunters.ts resolve against these.
// PROVISIONAL — moves in playtest, but tuned this brief against real
// enemy HP so the triangle reads.
export const COMBAT = {
  RIYA_BASELINE_ATTACK_INTERVAL_MS: 700,
  RIYA_BASELINE_RANGE_PX: 130,
  RIYA_BASELINE_DAMAGE: 1.0,
  MELEE_ARC_HALF_ANGLE_RAD: Math.PI / 3,
  MELEE_SWING_DURATION_MS: 140,
  // Projectile (Nim's stars). Lifetime = range / speed in code so a star
  // travels exactly its hunter's effective range before despawning.
  PROJECTILE_SPEED_PX_PER_SEC: 520,
  PROJECTILE_RADIUS_PX: 6,
  PROJECTILE_COLOR: 0xF6E5B7,
  // Minimal hit feedback — brief tint flash, on both enemies and hunters.
  // The juice pass (shake, hitstop, particles, floating numbers, combo)
  // is a dedicated later brief.
  HIT_FLASH_MS: 90,
  HIT_FLASH_COLOR: 0xFFFFFF,
} as const;

// Per-archetype stats. PROVISIONAL — first balance pass tuned this brief
// so the weapon triangle reads against the horde (a Fan falls to anyone;
// a Bouncer visibly takes Bex's heavy hits better than Nim's light ones).
// Real balance is a playtest job.
export const ENEMY = {
  // Fan — slow, direct, swarms. 1 HP so any hit clears one.
  FAN_HP: 1,
  FAN_SPEED: 60,
  FAN_CONTACT_DAMAGE: 1,
  FAN_SIZE: 22,

  // Weaver — fast, weaving. 1 HP for the same swarm-clear reason.
  WEAVER_HP: 1,
  WEAVER_SPEED: 130,
  WEAVER_CONTACT_DAMAGE: 1,
  WEAVER_SIZE: 20,
  WEAVER_ANGLE_AMPLITUDE_RAD: 0.6,
  WEAVER_ANGLE_FREQUENCY_RAD_PER_SEC: 4.0,

  // Mosher — windup-and-lunge. 2 HP — a step up.
  MOSHER_HP: 2,
  MOSHER_SPEED: 80,
  MOSHER_CONTACT_DAMAGE: 1,
  MOSHER_SIZE: 28,

  // Dancer — ranged lobber. 1 HP — fragile if you can reach her.
  DANCER_HP: 1,
  DANCER_SPEED: 100,
  DANCER_CONTACT_DAMAGE: 1,
  DANCER_SIZE: 24,
  // Distance the Dancer maintains from her target hunter.
  DANCER_ORBIT_RADIUS_PX: 220,
  DANCER_ORBIT_ANGULAR_SPEED_RAD_PER_SEC: 1.2,
  // How tightly she snaps back to the orbit ring when displaced.
  DANCER_RADIUS_CORRECTION_GAIN: 2.2,

  // Bouncer — big slow slam-elite. 8 HP — Bex feels good, Nim feels slow.
  // Per ENEMY-BRIEF §2's first balance pass aim.
  BOUNCER_HP: 8,
  BOUNCER_SPEED: 55,
  BOUNCER_CONTACT_DAMAGE: 1,
  BOUNCER_SIZE: 44,

  // Contact damage tick — any enemy touching a hunter applies its
  // contact damage at this cadence so contact pressure is graded, not
  // a per-frame instant-kill.
  CONTACT_TICK_INTERVAL_MS: 500,
} as const;

// Attack-specific tuning. HIT-THE-BEAT-SPEC §9 names the windups (slowest
// is the Mosher — teaching attack); the rest is PROVISIONAL.
export const ATTACK = {
  // Mosher lunge — the slowest, most generous windup. The "teaching parry"
  // (HIT-THE-BEAT-SPEC §6) when the parry brief lands.
  MOSHER_WINDUP_MS: 1400,
  MOSHER_RECOVERY_MS: 600,
  MOSHER_COOLDOWN_MS: 0,
  MOSHER_TRIGGER_RANGE_PX: 200,
  MOSHER_LUNGE_DAMAGE: 2,
  MOSHER_LUNGE_DISTANCE_PX: 280,
  MOSHER_LUNGE_SPEED_PX_PER_SEC: 560,
  MOSHER_LUNGE_WIDTH_PX: 32,

  // Backup Dancer lob — medium tempo (HIT-THE-BEAT-SPEC §9).
  DANCER_WINDUP_MS: 900,
  DANCER_RECOVERY_MS: 400,
  DANCER_COOLDOWN_MS: 1800,
  DANCER_LOB_DAMAGE: 2,
  DANCER_LOB_SPEED_PX_PER_SEC: 220,
  DANCER_LOB_RADIUS_PX: 10,

  // Bouncer slam — medium tempo (HIT-THE-BEAT-SPEC §9).
  BOUNCER_WINDUP_MS: 900,
  BOUNCER_RECOVERY_MS: 700,
  BOUNCER_COOLDOWN_MS: 1200,
  BOUNCER_TRIGGER_RANGE_PX: 140,
  BOUNCER_SLAM_DAMAGE: 3,
  BOUNCER_SLAM_RADIUS_PX: 120,
  // Cosmetic only: the slam-ring visual lingers this long after the
  // strike so the impact reads.
  BOUNCER_SLAM_VISUAL_LINGER_MS: 220,
} as const;

// HIT THE BEAT — the parry layer. HIT-THE-BEAT-SPEC §3, §5, §9.
// Per PARRY-BRIEF §3, all three window widths live here as data; the
// widest is hardcoded active for this brief. The difficulty selector
// is deferred to a menu brief.
export const PARRY = {
  // §3 — three difficulty tiers (Soundcheck / Opening Act / Headliner).
  // All three live here so swapping is one constant change for feel-tests.
  WINDOW_WIDEST_MS: 280,
  WINDOW_MEDIUM_MS: 200,
  WINDOW_NARROWEST_MS: 140,
  // The active window — widest tier hardcoded for this brief. Kids-first;
  // the first playtest of parry should err generous.
  ACTIVE_WINDOW_MS: 280,

  // §3 — anti-mash. Must stay shorter than the shortest attack windup so
  // a press is never "stuck" through a telegraph; enforced by an
  // assertion in ParrySystem's constructor.
  LOCKOUT_MS: 250,

  // §5 — per-player Hype. PROVISIONAL: tuned so a competent run reaches
  // full once or twice across its length. Real numbers move in playtest.
  HYPE_CAPACITY: 100,
  // Precision-graded fill: dead-on-beat banks max; window-edge banks min.
  // Linear interpolation between the two; the curve shape itself is
  // tunable later.
  HYPE_PER_PARRY_MAX_AT_CENTER: 35,
  HYPE_PER_PARRY_MIN_AT_EDGE: 12,

  // §1.6 — the in-encounter payoff. Generous enough to feel like a real
  // opening for hunter auto-attacks.
  STAGGER_DURATION_MS: 1500,
  // Stagger tint — unmistakable: the enemy reads as "stunned, hit me".
  // Pale lavender against the dark canvas + saturated body colours.
  STAGGER_TINT_COLOR: 0xE8E4FF,

  // Beat Ring telegraph visual — HIT-THE-BEAT-SPEC §2. Contracts from
  // OUTER → INNER over the visible windup (attack.windupMs).
  BEAT_RING_OUTER_RADIUS_PX: 70,
  BEAT_RING_INNER_RADIUS_PX: 16,
  BEAT_RING_LINE_WIDTH_PX: 4,
  BEAT_RING_COLOR: 0xF6E5B7,
  BEAT_RING_ALPHA: 0.95,
  // After convergence (the late half of the parry window) the ring stays
  // pinned at INNER. A second brighter ring fires at the beat moment to
  // mark "the beat" with shape, not just colour.
  BEAT_FLASH_RADIUS_PX: 28,
  BEAT_FLASH_LINE_WIDTH_PX: 3,
  BEAT_FLASH_COLOR: 0xFFFFFF,
  BEAT_FLASH_DURATION_MS: 180,

  // Minimal hit feedback (brief §9). Visible flash at the attack-resolution
  // point on a successful parry. Hitstop / shake / sound deferred to the
  // juice and audio briefs — known shortcoming called out in the brief.
  HIT_FLASH_RADIUS_PX: 38,
  HIT_FLASH_DURATION_MS: 220,
  HIT_FLASH_COLOR: 0xFFFFFF,
  HIT_FLASH_ALPHA: 0.75,

  // Reflected projectile (§4). Damage matches the source lob so the
  // reflected shot reads as "their attack, sent back". Colour shifts to
  // the hunter-team tint so it is unmistakably "yours now".
  REFLECTED_PROJECTILE_DAMAGE_MULTIPLIER: 1.0,
  REFLECTED_PROJECTILE_COLOR: 0xF6E5B7,
} as const;

// CHARGED RELEASE — the v2.0 hold-and-release verb (HIT-THE-BEAT-SPEC
// v2.0 §3, §6). Holding the parry button pauses the hunter's auto-attack
// and charges a per-character AOE; releasing fires it. The per-hunter
// AOE shape / size / damage multiplier are content and live in
// hunters.ts (HUNTER-SPEC §5); the shared dials live here.
export const CHARGED = {
  // §3 — the anti-spam invariant. A release before this much continuous
  // holding is a silent cancel (no attack, no penalty). Replaces v1.0's
  // post-press lockout. Asserted in ParrySystem against the shortest
  // attack windup so a player can always react-and-hold inside a tell.
  MINIMUM_HOLD_MS: 500,

  // Charged-stance indicator — a ground ring under a hunter who is
  // holding (§3, §8: the hold must be unmistakable, to the player and to
  // a co-op partner). Bright cyan, deliberately NOT the lavender
  // PARRY.STAGGER_TINT_COLOR, so a charging hunter never reads as a
  // staggered enemy.
  STANCE_RING_RADIUS_PX: 27,
  STANCE_RING_LINE_WIDTH_PX: 3,
  STANCE_RING_COLOR: 0x66E0FF,
  STANCE_RING_ALPHA: 0.9,
  STANCE_RING_PULSE_HZ: 2.2,
  STANCE_RING_PULSE_AMPLITUDE_PX: 5,

  // Charged-AOE strike visual — a brief filled shape (wedge / circle /
  // line) tinted the hunter's body colour, fading over this duration.
  // Programmer-art: enough to read as a discrete attack moment.
  AOE_VISUAL_DURATION_MS: 200,
  AOE_VISUAL_FILL_ALPHA: 0.42,
} as const;

// HUD — the Hype meter, the only HUD this brief adds. Two per-player
// bars, position-anchored to the corner matching the player's side of
// the keyboard so the mapping reads at a glance.
export const HUD = {
  HYPE_BAR_WIDTH_PX: 220,
  HYPE_BAR_HEIGHT_PX: 16,
  HYPE_BAR_PADDING_PX: 18,
  HYPE_BAR_BACKGROUND_COLOR: 0x202836,
  HYPE_BAR_BACKGROUND_ALPHA: 0.85,
  // White overlay on top of the fill — alpha pulses on parry, intensity
  // scales with precision. This is the precision-grade feedback channel
  // (brief §6: "center-of-window has a bigger jump than an edge parry").
  HYPE_BAR_FILL_FLASH_DURATION_MS: 260,
  HYPE_BAR_FULL_FLASH_COLOR: 0xFFFFFF,
  // Subtle full-meter glow so the player can tell at a glance the next
  // parry will fire the signature.
  HYPE_BAR_FULL_BORDER_COLOR: 0xFFFFFF,
  HYPE_BAR_FULL_BORDER_PX: 2,
  // Per-player label.
  HYPE_BAR_LABEL_FONT_PX: 14,
  HYPE_BAR_LABEL_COLOR: '#F6E5B7',
  HYPE_BAR_LABEL_READY_COLOR: '#FFFFFF',

  // Full-meter "ready" state (PARRY-V2-BRIEF §7). When Hype is full the
  // next charged release fires the signature instead of a normal charge.
  // The fill swaps to this warm colour and the full border pulses, so a
  // full meter never mis-reads as a routine one — the player must not
  // forget Hype is full and waste it on a plain charge.
  HYPE_BAR_READY_FILL_COLOR: 0xFFE9A8,
  HYPE_BAR_READY_PULSE_HZ: 2.4,
  HYPE_BAR_READY_PULSE_MIN_ALPHA: 0.3,
  HYPE_BAR_READY_PULSE_MAX_ALPHA: 1.0,

  // Signature trigger placeholder (brief §7) — burst + name label
  // centered on the hunter. No damage, no buff: proves the trigger fires
  // at the right moment for the right hunter.
  SIGNATURE_FLASH_RADIUS_PX: 96,
  SIGNATURE_FLASH_DURATION_MS: 520,
  SIGNATURE_FLASH_COLOR: 0xFFFFFF,
  SIGNATURE_FLASH_ALPHA: 0.55,
  SIGNATURE_LABEL_DURATION_MS: 900,
  SIGNATURE_LABEL_FONT_PX: 36,
  SIGNATURE_LABEL_COLOR: '#FFFFFF',
  SIGNATURE_LABEL_RISE_PX: 28,
} as const;

// SpawnSystem — escalating edge spawns. Not RunDirector; that brief
// drives the run arc (intro/build/drop/headliner) later. Here it is a
// simple time-based trickle that intensifies.
export const SPAWN = {
  INITIAL_INTERVAL_MS: 1500,
  MIN_INTERVAL_MS: 350,
  // ms shaved off the interval per second of run time.
  INTERVAL_DECAY_MS_PER_SEC: 14,
  // Px just inside the visible arena, so a spawned enemy appears at the
  // edge rather than off-screen invisible.
  EDGE_INSET_PX: 24,
  // Archetype weights — drawn at run-start vs. fully-ramped. Linear
  // interpolation in between. The Bouncer mini-elite is intentionally
  // rare even at full ramp.
  WEIGHTS_INITIAL: { fan: 8, weaver: 2, mosher: 0, dancer: 0, bouncer: 0 },
  WEIGHTS_FULL:    { fan: 5, weaver: 4, mosher: 4, dancer: 3, bouncer: 1 },
  WEIGHT_RAMP_DURATION_SEC: 60,
} as const;
