// Hunter — player entity (dumb data per CLAUDE.md's ECS-flavored rule).
// Stub for the scaffold task; real shape + movement seam land in the
// "Hunter + one input-driven moving square" commit.
export type HunterId = 'P1' | 'P2';

export interface Hunter {
  readonly id: HunterId;
}
