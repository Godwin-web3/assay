import { NextResponse } from "next/server";
import { isBase58Address, recordMintRead } from "@/lib/book";
import { tokenByMint } from "@/lib/catalog";
import { impliedIncome } from "@/lib/impliedIncome";
import { readWalletHoldings } from "@/lib/solana";
import type { V1ErrorResponse, V1WalletPosition, V1WalletResponse } from "@/lib/v1";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ owner: string }> };

export async function GET(
  _req: Request,
  context: RouteContext
): Promise<NextResponse<V1WalletResponse | V1ErrorResponse>> {
  const { owner } = await context.params;
  if (!isBase58Address(owner)) {
    return NextResponse.json({ error: "not a Solana address" }, { status: 400 });
  }

  try {
    const holdings = await readWalletHoldings(owner);
    const known = holdings.filter((h) => tokenByMint(h.mint));
    const asOf = new Date().toISOString();

    const positions: V1WalletPosition[] = [];
    for (const holding of known) {
      try {
        const recorded = await recordMintRead(holding.mint);
        const multiplier = recorded.live.multiplier;
        const scaled =
          multiplier !== null ? holding.rawUi * multiplier : holding.rawUi;
        const income = impliedIncome({
          rawUi: holding.rawUi,
          multiplier,
          previousMultiplier: recorded.previous?.multiplier ?? null,
          price: recorded.snapshot.price,
          hasPrevious: recorded.previous !== null,
        });
        positions.push({
          mint: holding.mint,
          instrument: recorded.instrument,
          kind: recorded.instrument.kind,
          claim: recorded.instrument.claim,
          raw: holding.rawUi,
          scaled,
          price: recorded.snapshot.price,
          impliedIncome: income,
        });
      } catch (err) {
        console.error(
          "wallet mint read failed",
          holding.mint,
          err instanceof Error ? err.message : err
        );
      }
    }

    return NextResponse.json({
      owner,
      asOf,
      positions,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "wallet read failed" },
      { status: 502 }
    );
  }
}
