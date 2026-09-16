import { NextResponse } from "next/server";
import { isBase58Address } from "@/lib/book";
import { tokenByMint } from "@/lib/catalog";
import { readWalletHoldings } from "@/lib/solana";
import {
  loadStatementRows,
  parseStatementRange,
  statementToCsv,
  wantsCsv,
} from "@/lib/statement";
import { hasSupabase } from "@/lib/supabase";
import type {
  V1ErrorResponse,
  V1WalletStatementResponse,
} from "@/lib/v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ owner: string }> };

const PERSISTENCE_ERROR =
  "Statements require a persisted book. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.";

function jsonError(error: string, status: number): NextResponse<V1ErrorResponse> {
  return NextResponse.json({ error }, { status });
}

export async function GET(
  req: Request,
  context: RouteContext
): Promise<NextResponse<V1WalletStatementResponse | V1ErrorResponse> | NextResponse> {
  const { owner } = await context.params;
  if (!isBase58Address(owner)) {
    return jsonError("not a Solana address", 400);
  }

  const url = new URL(req.url);
  const range = parseStatementRange(
    url.searchParams.get("from"),
    url.searchParams.get("to")
  );
  if ("error" in range) {
    return jsonError(range.error, 400);
  }

  if (!hasSupabase()) {
    return jsonError(PERSISTENCE_ERROR, 503);
  }

  let cataloguedMints: string[];
  try {
    const holdings = await readWalletHoldings(owner);
    cataloguedMints = [
      ...new Set(holdings.map((h) => h.mint).filter((mint) => tokenByMint(mint))),
    ];
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "wallet read failed",
      502
    );
  }

  const tokens = cataloguedMints
    .map((mint) => tokenByMint(mint))
    .filter((token): token is NonNullable<typeof token> => Boolean(token));

  const loaded = await loadStatementRows({
    tokens,
    fromIso: range.fromIso,
    toIso: range.toIso,
  });
  if (loaded.error) {
    if (loaded.error.includes("persisted book")) {
      return jsonError(loaded.error, 503);
    }
    return jsonError(loaded.error, 502);
  }

  const body: V1WalletStatementResponse = {
    owner,
    from: range.fromIso,
    to: range.toIso,
    asOf: new Date().toISOString(),
    rows: loaded.rows,
  };

  if (wantsCsv(req)) {
    const dateFrom = range.fromIso.slice(0, 10);
    const dateTo = range.toIso.slice(0, 10);
    return new NextResponse(statementToCsv(body), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="assay-${owner.slice(0, 8)}-statement-${dateFrom}-${dateTo}.csv"`,
      },
    });
  }

  return NextResponse.json(body);
}
