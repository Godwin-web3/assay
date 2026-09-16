import type { CatalogToken } from "./catalog";
import { instrumentRow, tokenByMint } from "./catalog";
import type { MintEvent } from "./events";
import { mintEvents } from "./events";
import { impliedIncome } from "./impliedIncome";
import { lastCashClose, type LastClose } from "./close";
import { jupiterPrice, readMint } from "./solana";
import { supabaseAdmin } from "./supabase";
import type { V1Instrument, V1MintResponse, V1Snapshot } from "./v1";

export type PreviousSnapshot = {
  id: string;
  asOf: string;
  multiplier: number | null;
  supplyUi: number | null;
  scaledSupply: number | null;
  price: number | null;
};

export type RecordedMint = V1MintResponse & {
  previous: PreviousSnapshot | null;
};

type SnapshotInsert = {
  mint: string;
  as_of: string;
  supply_raw: string | null;
  supply_ui: number | null;
  scaled_supply: number | null;
  multiplier: number | null;
  decimals: number | null;
  price: number | null;
  close: number | null;
  close_date: string | null;
  close_ticker: string | null;
  close_source: string | null;
  mint_authority: string | null;
  freeze_authority: string | null;
  program: string | null;
  extensions: string[];
  events: MintEvent[];
  payload: Record<string, unknown>;
  previous_snapshot_id: string | null;
  implied_income: number | null;
};

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function instrumentFromCatalog(token: CatalogToken): V1Instrument {
  return token;
}

async function upsertInstrument(token: CatalogToken): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;
  const { error } = await db.from("instruments").upsert(instrumentRow(token), {
    onConflict: "mint",
  });
  if (error) {
    console.error("instruments upsert failed", error.message);
  }
}

async function latestSnapshot(mint: string): Promise<PreviousSnapshot | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("snapshots")
    .select("id, as_of, multiplier, supply_ui, scaled_supply, price")
    .eq("mint", mint)
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("snapshots lookup failed", error.message);
    return null;
  }
  if (!data) return null;
  return {
    id: data.id as string,
    asOf: data.as_of as string,
    multiplier: asNumber(data.multiplier),
    supplyUi: asNumber(data.supply_ui),
    scaledSupply: asNumber(data.scaled_supply),
    price: asNumber(data.price),
  };
}

async function insertSnapshot(row: SnapshotInsert): Promise<string | null> {
  const db = supabaseAdmin();
  if (!db) return null;
  const { data, error } = await db
    .from("snapshots")
    .insert(row)
    .select("id")
    .single();
  if (error) {
    console.error("snapshots insert failed", error.message);
    return null;
  }
  return (data?.id as string | undefined) ?? null;
}

/**
 * Live Solana read, then append a snapshot to the book.
 * Writes are skipped when Supabase env is missing; the live payload is still returned.
 */
export async function recordMintRead(mint: string): Promise<RecordedMint> {
  const token = tokenByMint(mint);
  if (!token) {
    throw new Error("unknown instrument");
  }

  const instrument = instrumentFromCatalog(token);
  const [live, price] = await Promise.all([
    readMint(token.mint),
    jupiterPrice(token.mint),
  ]);

  const close: LastClose | null = token.cashTicker
    ? await lastCashClose(token.cashTicker)
    : null;

  const events = await mintEvents({
    mint: token.mint,
    multiplier: live.multiplier,
  });

  await upsertInstrument(token);
  const previous = await latestSnapshot(token.mint);
  const asOf = new Date().toISOString();

  const income = impliedIncome({
    rawUi: live.supplyUi,
    multiplier: live.multiplier,
    previousMultiplier: previous?.multiplier ?? null,
    price,
    hasPrevious: previous !== null,
  });

  const payload: Record<string, unknown> = {
    instrument,
    live,
    price,
    close,
    events,
    impliedIncome: income,
    previousSnapshotId: previous?.id ?? null,
  };

  const snapshotId = await insertSnapshot({
    mint: token.mint,
    as_of: asOf,
    supply_raw: live.supplyRaw,
    supply_ui: live.supplyUi,
    scaled_supply: live.scaledSupply,
    multiplier: live.multiplier,
    decimals: live.decimals,
    price,
    close: close?.close ?? null,
    close_date: close?.date ?? null,
    close_ticker: close?.ticker ?? null,
    close_source: close?.source ?? null,
    mint_authority: live.mintAuthority,
    freeze_authority: live.freezeAuthority,
    program: live.program,
    extensions: live.extensions,
    events,
    payload,
    previous_snapshot_id: previous?.id ?? null,
    implied_income: income,
  });

  const snapshot: V1Snapshot = {
    id: snapshotId,
    asOf,
    supplyRaw: live.supplyRaw,
    supplyUi: live.supplyUi,
    scaledSupply: live.scaledSupply,
    multiplier: live.multiplier,
    price,
    close,
    mintAuthority: live.mintAuthority,
    freezeAuthority: live.freezeAuthority,
    program: live.program,
    extensions: live.extensions,
    previousSnapshotId: previous?.id ?? null,
    persisted: snapshotId !== null,
  };

  return {
    instrument,
    live,
    snapshot,
    impliedIncome: income,
    events,
    asOf,
    previous,
  };
}

export function isBase58Address(value: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
}

export function toMintResponse(recorded: RecordedMint): V1MintResponse {
  const { previous: _previous, ...rest } = recorded;
  return rest;
}
