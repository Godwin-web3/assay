/**
 * Stable v1 objects for protocols.
 *
 * Assay is the book, not a dashboard. Other products read these shapes.
 * Users of this API are people and protocols.
 *
 * Response shapes
 * ---------------
 * GET /v1/mint/:mint
 *   instrument     catalog claim (kind, issuer, notTheShare)
 *   live           Solana jsonParsed mint at asOf (source of truth)
 *   snapshot       durable book row written on this read (when Supabase is configured)
 *   impliedIncome  { vsPar, vsLastSnapshot, unit: "token", note }
 *                    vsPar          = scaledSupply − supplyUi (cumulative tape vs par)
 *                    vsLastSnapshot = extra scaled units from a multiplier step
 *                                     vs the previous snapshot (0 if none / no move)
 *   events         only multiplier / mint_authority / freeze_authority changes
 *                    (or first-snapshot baseline). Not mint-account transfers.
 *
 * GET /v1/wallet/:owner
 *   One row per catalogued token the wallet holds. Each position is
 *   priced on the lot — protocols do not need a second /v1/mint call:
 *     kind, claim, notTheShare, raw, scaled, multiplier, price,
 *     mark (= scaled × pool price), close (last cash close when the
 *     instrument has cashTicker, else null), impliedIncome (object).
 *
 * GET /v1/wallet/:owner/statement?from=&to=
 *   Accountant/vault tape over an inclusive as_of range, built from
 *   durable snapshots — not from one live Solana read. Optional
 *   format=csv or Accept: text/csv serializes the same object.
 *   Persistence (Supabase) is required; 503 if unset.
 */
import type { CatalogGroup, CatalogToken, IssuerKind } from "./catalog";
import type { MintEvent } from "./events";
import type { ImpliedIncome } from "./impliedIncome";
import type { ParsedMint } from "./solana";

/** Catalogued instrument. Mint is the primary key. */
export type V1Instrument = CatalogToken;

export type V1MintState = ParsedMint;

export type V1Close = {
  ticker: string;
  close: number;
  date: string;
  source: string;
} | null;

export type V1Event = MintEvent;

/** Protocol impliedIncome. Always an object — never a bare number. */
export type V1ImpliedIncome = ImpliedIncome;

export type V1Snapshot = {
  id: string | null;
  asOf: string;
  supplyRaw: string | null;
  supplyUi: number | null;
  scaledSupply: number | null;
  multiplier: number | null;
  price: number | null;
  close: V1Close;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  program: string | null;
  extensions: string[];
  previousSnapshotId: string | null;
  /** False when Supabase is unset or the write failed. Live Solana fields are still returned. */
  persisted: boolean;
};

/**
 * GET /v1/mint/:mint
 *
 * instrument    — catalog claim (kind, issuer, not-the-share)
 * live          — Solana jsonParsed mint at asOf (source of truth)
 * snapshot      — durable book row written on this read (when Supabase is configured)
 * impliedIncome — scaled-vs-raw object; vsLastSnapshot is 0 unless the multiplier moved
 * events        — multiplier / authority diffs vs previous snapshot (also stored on the snapshot)
 */
export type V1MintResponse = {
  instrument: V1Instrument;
  live: V1MintState;
  snapshot: V1Snapshot;
  impliedIncome: V1ImpliedIncome;
  events: V1Event[];
  asOf: string;
};

/**
 * GET /v1/wallet/:owner
 *
 * One row per catalogued token the wallet holds. Complete enough to
 * mark the lot without a second mint read.
 */
export type V1WalletPosition = {
  mint: string;
  instrument: V1Instrument;
  kind: IssuerKind;
  claim: string;
  notTheShare: string;
  raw: number;
  scaled: number;
  multiplier: number | null;
  price: number | null;
  /** scaled × current Jupiter pool print. Null if price is missing. */
  mark: number | null;
  /** Last cash close when the instrument has cashTicker; otherwise null. */
  close: V1Close;
  impliedIncome: V1ImpliedIncome;
};

export type V1WalletResponse = {
  owner: string;
  asOf: string;
  positions: V1WalletPosition[];
};

/**
 * GET /v1/wallet/:owner/statement?from=&to=
 *
 * Rows are snapshot diffs for catalogued mints the wallet holds now.
 * Live Solana is only used to list those mints; the tape is consecutive
 * snapshots (plus the latest snapshot before `from` as baseline).
 *
 * kind is the quiet-events set plus implied_income when vsLastSnapshot
 * accrued (scaled-vs-raw step, token units). Transfer noise is omitted.
 *
 * Empty rows (200) when the wallet has no catalogued holdings and/or
 * nothing material moved in range.
 */
export type V1StatementKind =
  | "multiplier"
  | "implied_income"
  | "mint_authority"
  | "freeze_authority";

/** Fields that changed for this row's kind. Extra keys are omitted. */
export type V1StatementValues = {
  multiplier?: number | null;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  supplyUi?: number | null;
  scaledSupply?: number | null;
};

export type V1StatementRow = {
  at: string;
  mint: string;
  symbol: string;
  kind: V1StatementKind;
  label: string;
  before: V1StatementValues;
  after: V1StatementValues;
  impliedIncome: V1ImpliedIncome | null;
};

export type V1WalletStatementResponse = {
  owner: string;
  from: string;
  to: string;
  asOf: string;
  rows: V1StatementRow[];
};

export type V1ErrorResponse = {
  error: string;
};

export type { CatalogGroup, IssuerKind };
