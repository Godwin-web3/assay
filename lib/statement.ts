/**
 * Dated wallet statement from durable snapshots.
 *
 * Live Solana is only used to see which catalogued mints the wallet
 * holds now. The tape itself is consecutive snapshot diffs — the same
 * quiet fields as lib/events.ts (multiplier, mint authority, freeze
 * authority) plus implied income when vsLastSnapshot accrued.
 */
import type { CatalogToken } from "./catalog";
import { bookEvents } from "./events";
import { impliedIncome, IMPLIED_INCOME_NOTE } from "./impliedIncome";
import {
  loadMintSnapshotsForRange,
  type BookSnapshot,
} from "./book";
import type {
  V1StatementKind,
  V1StatementRow,
  V1StatementValues,
  V1WalletStatementResponse,
} from "./v1";

const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})$/;

export type StatementRange = {
  fromIso: string;
  toIso: string;
};

export type StatementRangeError = {
  error: string;
};

function endOfUtcDay(dateOnly: string): string {
  return `${dateOnly}T23:59:59.999Z`;
}

function startOfUtcDay(dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

function parseBound(
  raw: string,
  bound: "from" | "to"
): { iso: string } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: `${bound} is required (ISO date or datetime)` };
  }

  const dateOnly = DATE_ONLY.exec(trimmed);
  if (dateOnly) {
    const iso =
      bound === "from" ? startOfUtcDay(dateOnly[1]!) : endOfUtcDay(dateOnly[1]!);
    const ms = Date.parse(iso);
    if (!Number.isFinite(ms)) {
      return { error: `${bound} is not a valid ISO date or datetime` };
    }
    return { iso };
  }

  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) {
    return { error: `${bound} is not a valid ISO date or datetime` };
  }
  return { iso: new Date(ms).toISOString() };
}

/**
 * Inclusive range on snapshot as_of.
 * Date-only values cover the whole UTC day (from 00:00:00.000Z, to 23:59:59.999Z).
 */
export function parseStatementRange(
  fromRaw: string | null,
  toRaw: string | null
): StatementRange | StatementRangeError {
  if (fromRaw === null || fromRaw.trim() === "" || toRaw === null || toRaw.trim() === "") {
    return {
      error:
        "from and to are required (ISO date or datetime). Example: ?from=2026-01-01&to=2026-01-31",
    };
  }

  const fromParsed = parseBound(fromRaw, "from");
  if ("error" in fromParsed) return fromParsed;
  const toParsed = parseBound(toRaw, "to");
  if ("error" in toParsed) return toParsed;

  if (Date.parse(fromParsed.iso) > Date.parse(toParsed.iso)) {
    return { error: "from must be on or before to" };
  }

  return { fromIso: fromParsed.iso, toIso: toParsed.iso };
}

export function wantsCsv(req: Request): boolean {
  const url = new URL(req.url);
  const format = (url.searchParams.get("format") ?? "").trim().toLowerCase();
  if (format === "csv") return true;
  if (format === "json") return false;
  const accept = req.headers.get("accept") ?? "";
  return /\btext\/csv\b/i.test(accept);
}

function valuesForKind(
  kind: V1StatementKind,
  snap: BookSnapshot
): V1StatementValues {
  if (kind === "multiplier") {
    return { multiplier: snap.multiplier };
  }
  if (kind === "implied_income") {
    return {
      multiplier: snap.multiplier,
      supplyUi: snap.supplyUi,
      scaledSupply: snap.scaledSupply,
    };
  }
  if (kind === "mint_authority") {
    return { mintAuthority: snap.mintAuthority };
  }
  return { freezeAuthority: snap.freezeAuthority };
}

const KIND_ORDER: V1StatementKind[] = [
  "multiplier",
  "implied_income",
  "mint_authority",
  "freeze_authority",
];

function kindRank(kind: V1StatementKind): number {
  const i = KIND_ORDER.indexOf(kind);
  return i === -1 ? KIND_ORDER.length : i;
}

/**
 * Quiet diffs between consecutive snapshots.
 * The first snapshot is the baseline and does not emit a row by itself.
 * Rows are attributed to the later snapshot's as_of (must be in range).
 */
export function rowsFromSnapshots(args: {
  token: CatalogToken;
  snapshots: BookSnapshot[];
  fromIso: string;
  toIso: string;
}): V1StatementRow[] {
  const { token, snapshots, fromIso, toIso } = args;
  const fromMs = Date.parse(fromIso);
  const toMs = Date.parse(toIso);
  const rows: V1StatementRow[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const previous = snapshots[i - 1]!;
    const current = snapshots[i]!;
    const atMs = Date.parse(current.asOf);
    if (!Number.isFinite(atMs) || atMs < fromMs || atMs > toMs) {
      continue;
    }

    const events = bookEvents({
      asOf: current.asOf,
      live: {
        multiplier: current.multiplier,
        mintAuthority: current.mintAuthority,
        freezeAuthority: current.freezeAuthority,
      },
      previous: {
        multiplier: previous.multiplier,
        mintAuthority: previous.mintAuthority,
        freezeAuthority: previous.freezeAuthority,
      },
    });

    const income = impliedIncome({
      rawUi: current.supplyUi,
      scaledUi: current.scaledSupply,
      multiplier: current.multiplier,
      previousMultiplier: previous.multiplier,
      hasPrevious: true,
    });

    for (const event of events) {
      rows.push({
        at: current.asOf,
        mint: token.mint,
        symbol: token.symbol,
        kind: event.kind,
        label: event.label,
        before: valuesForKind(event.kind, previous),
        after: valuesForKind(event.kind, current),
        impliedIncome: event.kind === "multiplier" ? income : null,
      });
    }

    if (income.vsLastSnapshot !== 0) {
      rows.push({
        at: current.asOf,
        mint: token.mint,
        symbol: token.symbol,
        kind: "implied_income",
        label: `Implied income ${income.vsLastSnapshot} token vs last snapshot. ${IMPLIED_INCOME_NOTE}`,
        before: valuesForKind("implied_income", previous),
        after: valuesForKind("implied_income", current),
        impliedIncome: income,
      });
    }
  }

  return rows;
}

export async function loadStatementRows(args: {
  tokens: CatalogToken[];
  fromIso: string;
  toIso: string;
}): Promise<{ rows: V1StatementRow[]; error: string | null }> {
  const rows: V1StatementRow[] = [];

  for (const token of args.tokens) {
    const loaded = await loadMintSnapshotsForRange({
      mint: token.mint,
      fromIso: args.fromIso,
      toIso: args.toIso,
    });
    if (loaded.error) {
      return { rows: [], error: loaded.error };
    }
    rows.push(
      ...rowsFromSnapshots({
        token,
        snapshots: loaded.snapshots,
        fromIso: args.fromIso,
        toIso: args.toIso,
      })
    );
  }

  return { rows: sortStatementRows(rows), error: null };
}

export function sortStatementRows(rows: V1StatementRow[]): V1StatementRow[] {
  return [...rows].sort((a, b) => {
    const at = a.at.localeCompare(b.at);
    if (at !== 0) return at;
    const mint = a.mint.localeCompare(b.mint);
    if (mint !== 0) return mint;
    return kindRank(a.kind) - kindRank(b.kind);
  });
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function csvJson(value: unknown): string {
  return csvCell(JSON.stringify(value));
}

/**
 * CSV of the same statement object as JSON.
 * Envelope fields repeat on each row so one table is the whole object.
 * Nested before / after / impliedIncome stay JSON (not a second schema).
 */
export function statementToCsv(statement: V1WalletStatementResponse): string {
  const header = [
    "owner",
    "from",
    "to",
    "asOf",
    "at",
    "mint",
    "symbol",
    "kind",
    "label",
    "before",
    "after",
    "impliedIncome",
  ].join(",");

  if (statement.rows.length === 0) {
    return `${header}\n`;
  }

  const lines = statement.rows.map((row) =>
    [
      csvCell(statement.owner),
      csvCell(statement.from),
      csvCell(statement.to),
      csvCell(statement.asOf),
      csvCell(row.at),
      csvCell(row.mint),
      csvCell(row.symbol),
      csvCell(row.kind),
      csvCell(row.label),
      csvJson(row.before),
      csvJson(row.after),
      csvJson(row.impliedIncome),
    ].join(",")
  );

  return `${header}\n${lines.join("\n")}\n`;
}
