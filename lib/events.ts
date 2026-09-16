/**
 * Book events: only multiplier / mint authority / freeze authority.
 *
 * Transfer signatures on the mint account are not events. They do not
 * change the claim. The book records a row when one of the three
 * material fields moved versus the previous snapshot, or on the first
 * snapshot as a baseline.
 */
export type MintEventKind =
  | "multiplier"
  | "mint_authority"
  | "freeze_authority";

export type MintEvent = {
  kind: MintEventKind;
  label: string;
  at: string | null;
};

export type EventAuthorities = {
  multiplier: number | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
};

function authorityLabel(value: string | null): string {
  return value ?? "none";
}

function multipliersEqual(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 1e-12;
}

function multiplierStatusLabel(multiplier: number | null): string {
  if (multiplier !== null && multiplier !== 1) {
    const extra = ((multiplier - 1) * 100).toFixed(3);
    return `Scaled UI Amount is ${multiplier}. Raw units understate economic units by ${extra}%.`;
  }
  if (multiplier === 1) {
    return "Multiplier is 1. No scaled corporate action is applied right now.";
  }
  return "No Scaled UI Amount on this mint.";
}

/**
 * Homepage /api/book: current multiplier status only.
 * Does not fetch mint-account transfers.
 */
export function mintStatusEvents(multiplier: number | null): MintEvent[] {
  return [
    {
      kind: "multiplier",
      label: multiplierStatusLabel(multiplier),
      at: null,
    },
  ];
}

/**
 * Snapshot events for the book.
 * First snapshot: baseline of multiplier + both authorities.
 * Later snapshots: only fields that changed.
 */
export function bookEvents(args: {
  asOf: string;
  live: EventAuthorities;
  previous: EventAuthorities | null;
}): MintEvent[] {
  const { asOf, live, previous } = args;

  if (previous === null) {
    return [
      {
        kind: "multiplier",
        label: `Baseline: ${multiplierStatusLabel(live.multiplier)}`,
        at: asOf,
      },
      {
        kind: "mint_authority",
        label: `Baseline mint authority ${authorityLabel(live.mintAuthority)}.`,
        at: asOf,
      },
      {
        kind: "freeze_authority",
        label: `Baseline freeze authority ${authorityLabel(live.freezeAuthority)}.`,
        at: asOf,
      },
    ];
  }

  const out: MintEvent[] = [];

  if (!multipliersEqual(live.multiplier, previous.multiplier)) {
    out.push({
      kind: "multiplier",
      label: `Multiplier ${previous.multiplier ?? "none"} → ${live.multiplier ?? "none"}.`,
      at: asOf,
    });
  }

  if (live.mintAuthority !== previous.mintAuthority) {
    out.push({
      kind: "mint_authority",
      label: `Mint authority ${authorityLabel(previous.mintAuthority)} → ${authorityLabel(live.mintAuthority)}.`,
      at: asOf,
    });
  }

  if (live.freezeAuthority !== previous.freezeAuthority) {
    out.push({
      kind: "freeze_authority",
      label: `Freeze authority ${authorityLabel(previous.freezeAuthority)} → ${authorityLabel(live.freezeAuthority)}.`,
      at: asOf,
    });
  }

  return out;
}
