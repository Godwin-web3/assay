import { NextResponse } from "next/server";
import { isBase58Address, recordMintRead, toMintResponse } from "@/lib/book";
import { tokenByMint } from "@/lib/catalog";
import type { V1ErrorResponse, V1MintResponse } from "@/lib/v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ mint: string }> };

export async function GET(
  _req: Request,
  context: RouteContext
): Promise<NextResponse<V1MintResponse | V1ErrorResponse>> {
  const { mint } = await context.params;
  if (!isBase58Address(mint)) {
    return NextResponse.json({ error: "not a Solana mint" }, { status: 400 });
  }
  if (!tokenByMint(mint)) {
    return NextResponse.json({ error: "unknown instrument" }, { status: 404 });
  }

  try {
    const recorded = await recordMintRead(mint);
    return NextResponse.json(toMintResponse(recorded));
  } catch (err) {
    const message = err instanceof Error ? err.message : "mint read failed";
    const status = message === "unknown instrument" ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
