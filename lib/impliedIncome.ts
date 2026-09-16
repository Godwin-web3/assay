/**
 * Implied income vs the previous book snapshot for one mint.
 *
 * Assay does not publish official NAV. This is the book's estimate of
 * income implied by a Scaled UI Amount multiplier step, marked at the
 * current pool print.
 *
 * Formula
 * -------
 * Scaled UI Amount wrappers (xStocks and similar) keep raw units fixed
 * and move `multiplier` for dividends / splits. Display units are:
 *
 *   scaled = raw_ui * multiplier
 *
 * Mint/burn changes raw_ui. Corporate actions change multiplier.
 * Implied income isolates the second effect and marks it in dollars:
 *
 *   extra_scaled    = raw_ui * (multiplier_now - multiplier_prev)
 *   implied_income  = extra_scaled * price_now
 *
 * Where:
 *   raw_ui          — current raw UI amount
 *                     (circulating supply_ui for a mint read;
 *                      the wallet's raw holding for a wallet read)
 *   multiplier_*    — Scaled UI Amount multiplier; missing / non-finite
 *                     is treated as 1 (no scale)
 *   price_now       — current Jupiter pool print
 *
 * Worked example (mint-wide, AAPLx-style):
 *   prev: supply_ui = 1_000_000, multiplier = 1.010, price = 220
 *   now:  supply_ui = 1_000_000, multiplier = 1.014, price = 221
 *   extra_scaled   = 1_000_000 * (1.014 - 1.010) = 4_000
 *   implied_income = 4_000 * 221 = 884_000
 *
 * Wallet holding 10 raw of the same mint:
 *   extra_scaled   = 10 * 0.004 = 0.04
 *   implied_income = 0.04 * 221 = 8.84
 *
 * What this is not
 * ----------------
 * - Not price mark-to-market on the old scaled units
 *   (that would be scaled_prev * (price_now - price_prev)).
 * - Not the raw mint/burn delta
 *   (that would be (raw_now - raw_prev) * multiplier_prev).
 * - Not overnight official NAV.
 *
 * Null vs zero
 * ------------
 * - null: no previous snapshot, or price_now is missing so the extra
 *   units cannot be marked.
 * - 0: there is a prior snapshot and a price, but the multiplier did
 *   not move (or there is no Scaled UI Amount, so both sides are 1).
 */

export type ImpliedIncomeInputs = {
  rawUi: number | null;
  multiplier: number | null;
  previousMultiplier: number | null;
  price: number | null;
  hasPrevious: boolean;
};

export function scaleFactor(multiplier: number | null): number {
  if (multiplier === null || !Number.isFinite(multiplier)) return 1;
  return multiplier;
}

export function impliedIncome(input: ImpliedIncomeInputs): number | null {
  if (!input.hasPrevious) return null;
  if (input.price === null || !Number.isFinite(input.price)) return null;
  if (input.rawUi === null || !Number.isFinite(input.rawUi)) return null;

  const extraScaled =
    input.rawUi *
    (scaleFactor(input.multiplier) - scaleFactor(input.previousMultiplier));
  const marked = extraScaled * input.price;
  if (!Number.isFinite(marked)) return null;
  // 8 dp is enough for scaled-unit dust and strips binary float junk.
  return Math.round(marked * 1e8) / 1e8;
}
