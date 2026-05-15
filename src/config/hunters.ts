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
    bodyColor: 0x44BBA4,
  },
};
