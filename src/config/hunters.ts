// The 3 hunters as data. Source of truth for per-hunter identity and
// triangle values; CombatSystem reads from here, never branches on id.
// HUNTER-SPEC.md §5 owns this shape.

export type HunterDefId = 'riya' | 'bex' | 'nim';
export type SongLine = 'melody' | 'rhythm' | 'harmony';

// Weapon kind selects the attack code path in CombatSystem:
// sword + staff → melee-arc; stars → projectile.
// Two implementations, three hunters, no per-id branching.
export type WeaponKind = 'sword' | 'staff' | 'stars';

export type SignaturePowerId = 'breakdown' | 'drop' | 'bridge';

// HUNTER-SPEC §3 + HIT-THE-BEAT-SPEC §5: signatures are owned by ParrySystem
// and not built in this brief. The registry exists so a hunter's `signature`
// is referenced-but-not-implemented in an explicit, typed way — never a
// silent gap. Status flips to 'implemented' (and gains a handler) when the
// parry brief lands.
export type SignatureStatus = 'stub' | 'implemented';

export const SIGNATURE_POWERS: Record<SignaturePowerId, { readonly status: SignatureStatus }> = {
  breakdown: { status: 'stub' },
  drop:      { status: 'stub' },
  bridge:    { status: 'stub' },
};

// Charged-AOE shape — the held-and-released charged attack, shaped per
// character (HIT-THE-BEAT-SPEC v2.0 §6, HUNTER-SPEC §5). Three shape
// kinds; CombatSystem runs one general behaviour per kind, selected on
// `shape` — never on hunter id. Damage multipliers stay roughly equal
// across hunters so identity lives in the shape, not the number.
export type ChargedAoeShape = 'wedge' | 'radial' | 'line';

interface ChargedAoeBase {
  // Damage dealt = the hunter's normal hit damage × this multiplier,
  // a single burst on all enemies in the AOE. PROVISIONAL (~1.5–2×).
  readonly damageMultiplier: number;
}

// Riya — a forward arc/wedge: wider, shorter than her sword swing.
export interface WedgeAoe extends ChargedAoeBase {
  readonly shape: 'wedge';
  readonly radiusPx: number;
  readonly halfAngleRad: number;
}

// Bex — a radial slam: full circle around her.
export interface RadialAoe extends ChargedAoeBase {
  readonly shape: 'radial';
  readonly radiusPx: number;
}

// Nim — a piercing line forward through her facing direction.
export interface LineAoe extends ChargedAoeBase {
  readonly shape: 'line';
  readonly lengthPx: number;
  readonly widthPx: number;
}

export type ChargedAoeDef = WedgeAoe | RadialAoe | LineAoe;

// All triangle values are multipliers off Riya = 1.0, per HUNTER-SPEC §2.
// The baseline absolutes (Riya's interval ms, range px, damage) live in
// tuning.ts as COMBAT.RIYA_BASELINE_* — change the triangle by editing here,
// rescale the whole roster by editing tuning.ts.
export interface HunterDef {
  readonly id: HunterDefId;
  readonly name: string;
  readonly songLine: SongLine;
  readonly weaponKind: WeaponKind;
  readonly attackIntervalMultiplier: number;
  readonly rangeMultiplier: number;
  readonly damageMultiplier: number;
  readonly signature: SignaturePowerId;
  // The per-character charged release (HIT-THE-BEAT-SPEC v2.0 §6).
  readonly chargedAoe: ChargedAoeDef;
  readonly bodyColor: number;
}

export const HUNTERS: Record<HunterDefId, HunterDef> = {
  riya: {
    id: 'riya',
    name: 'Riya',
    songLine: 'melody',
    weaponKind: 'sword',
    attackIntervalMultiplier: 1.0,
    rangeMultiplier: 1.0,
    damageMultiplier: 1.0,
    signature: 'breakdown',
    // Wedge: wider angle, shorter reach than her 130px / 60° sword swing.
    chargedAoe: {
      shape: 'wedge',
      damageMultiplier: 1.8,
      radiusPx: 104,
      halfAngleRad: 1.4,
    },
    bodyColor: 0xE94F37,
  },
  bex: {
    id: 'bex',
    name: 'Bex',
    songLine: 'rhythm',
    weaponKind: 'staff',
    attackIntervalMultiplier: 1.5,
    rangeMultiplier: 1.0,
    damageMultiplier: 2.0,
    signature: 'drop',
    // Radial: a big bruiser body-slam, full circle around her.
    chargedAoe: {
      shape: 'radial',
      damageMultiplier: 1.8,
      radiusPx: 150,
    },
    bodyColor: 0xF6C453,
  },
  nim: {
    id: 'nim',
    name: 'Nim',
    songLine: 'harmony',
    weaponKind: 'stars',
    attackIntervalMultiplier: 0.6,
    rangeMultiplier: 1.5,
    damageMultiplier: 0.5,
    signature: 'bridge',
    // Line: a piercing volley of stars forward through her facing.
    chargedAoe: {
      shape: 'line',
      damageMultiplier: 1.8,
      lengthPx: 340,
      widthPx: 46,
    },
    bodyColor: 0x44BBA4,
  },
};
