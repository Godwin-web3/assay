/**
 * Implied income on the book: scaled-UI tape versus par, plus the
 * extra scaled units since the last snapshot.
 *
 * Assay does not publish official NAV. This is the book's estimate of
 * income implied by Scaled UI Amount — in **token units**, not dollars.
 * Protocols already have `price` / `mark` on the same object if they
 * need a dollar print.
 *
 * Shape (mint and wallet)
 * -----------------------
 *   {
 *     vsPar: number,
 *     vsLastSnapshot: number,
 *     unit: "token",
 *     note: "Scaled UI Amount versus raw. Not a transfer."
 *   }
 *
 * vsPar
 * -----
 * Cumulative scaled − raw (the dividend / scaled-UI tape versus par).
 *
 *   mint:   live.scaledSupply − live.supplyUi
 *   wallet: holder scaled − holder raw
 *           (same idea at position size: raw * (multiplier − 1) when a
 *           Scaled UI Amount multiplier is present)
 *
 * vsLastSnapshot
 * --------------
 * Extra scaled units from a multiplier step versus the previous book
 * snapshot. Same isolation as before (mint/burn does not count):
 *
 *   extra_scaled = raw_ui * (multiplier_now − multiplier_prev)
 *
 * Where:
 *   raw_ui          — circulating supply_ui for a mint read;
 *                     the wallet's raw holding for a wallet read
 *   multiplier_*    — Scaled UI Amount multiplier; missing / non-finite
 *                     is treated as 1 (no scale)
 *
 * Worked example (mint-wide, AAPLx-style):
 *   prev: supply_ui = 1_000_000, multiplier = 1.010
 *   now:  supply_ui = 1_000_000, multiplier = 1.014
 *   vsLastSnapshot = 1_000_000 * 0.004 = 4_000
 *   vsPar          = 1_000_000 * 1.014 − 1_000_000 = 14_000
 *
 * Wallet holding 10 raw of the same mint:
 *   vsLastSnapshot = 10 * 0.004 = 0.04
 *   vsPar          = 10 * 1.014 − 10 = 0.14
 *
 * Zero vs null
 * ------------
 * The object is always returned (never a bare number). vsLastSnapshot is
 * 0 when there is no previous snapshot, or the multiplier did not move.
 * vsPar still carries the cumulative scaled-vs-raw amount protocols need.
 *
 * What this is not
 * ----------------
 * - Not a transfer. Scaled UI Amount is a mint-side scale.
 * - Not price mark-to-market on the old scaled units.
 * - Not the raw mint/burn delta.
 * - Not overnight official NAV.
 * - Not a dollar mark (older snapshots stored extra_scaled * price in
 *   the `implied_income` double). New rows store vsLastSnapshot there
 *   in token units; the full object lives in payload JSON.
 */

export const IMPLIED_INCOME_NOTE =
  "Scaled UI Amount versus raw. Not a transfer." as const;

export type ImpliedIncome = {
  vsPar: number;
  vsLastSnapshot: number;
  unit: "token";
  note: typeof IMPLIED_INCOME_NOTE;
};

export type ImpliedIncomeInputs = {
  rawUi: number | null;
  scaledUi: number | null;
  multiplier: number | null;
  previousMultiplier: number | null;
  hasPrevious: boolean;
};

export function scaleFactor(multiplier: number | null): number {
  if (multiplier === null || !Number.isFinite(multiplier)) return 1;
  return multiplier;
}

/** 8 dp is enough for scaled-unit dust and strips binary float junk. */
export function roundToken(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

export function vsPar(scaledUi: number | null, rawUi: number | null): number {
  if (
    scaledUi === null ||
    rawUi === null ||
    !Number.isFinite(scaledUi) ||
    !Number.isFinite(rawUi)
  ) {
    return 0;
  }
  return roundToken(scaledUi - rawUi);
}

export function vsLastSnapshot(input: ImpliedIncomeInputs): number {
  if (!input.hasPrevious) return 0;
  if (input.rawUi === null || !Number.isFinite(input.rawUi)) return 0;

  const extraScaled =
    input.rawUi *
    (scaleFactor(input.multiplier) - scaleFactor(input.previousMultiplier));
  if (!Number.isFinite(extraScaled)) return 0;
  return roundToken(extraScaled);
}

export function impliedIncome(input: ImpliedIncomeInputs): ImpliedIncome {
  return {
    vsPar: vsPar(input.scaledUi, input.rawUi),
    vsLastSnapshot: vsLastSnapshot(input),
    unit: "token",
    note: IMPLIED_INCOME_NOTE,
  };
}
