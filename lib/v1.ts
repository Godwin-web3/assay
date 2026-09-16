/**
 * Stable v1 objects for protocols.
 *
 * Assay is the book, not a dashboard. Other products read these shapes.
 * Users of this API are people and protocols.
 */
import type { CatalogGroup, CatalogToken, IssuerKind } from "./catalog";
import type { MintEvent } from "./events";
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
 * instrument  — catalog claim (kind, issuer, not-the-share)
 * live        — Solana jsonParsed mint at asOf (source of truth)
 * snapshot    — durable book row written on this read (when Supabase is configured)
 * impliedIncome — mark of extra scaled units vs the previous snapshot; null if none
 * events      — multiplier note + recent mint-account txs (also stored on the snapshot)
 */
export type V1MintResponse = {
  instrument: V1Instrument;
  live: V1MintState;
  snapshot: V1Snapshot;
  impliedIncome: number | null;
  events: V1Event[];
  asOf: string;
};

/**
 * GET /v1/wallet/:owner
 *
 * One row per catalogued token the wallet holds. Protocols need:
 * kind, raw, scaled, price, impliedIncome, claim.
 */
export type V1WalletPosition = {
  mint: string;
  instrument: V1Instrument;
  kind: IssuerKind;
  claim: string;
  raw: number;
  scaled: number;
  price: number | null;
  impliedIncome: number | null;
};

export type V1WalletResponse = {
  owner: string;
  asOf: string;
  positions: V1WalletPosition[];
};

export type V1ErrorResponse = {
  error: string;
};

export type { CatalogGroup, IssuerKind };
