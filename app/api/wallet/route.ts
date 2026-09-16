import { NextRequest, NextResponse } from "next/server";
import { KIND_LABEL, tokenByMint } from "@/lib/catalog";
import { jupiterPrice, readMint, readWalletHoldings } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const owner = (req.nextUrl.searchParams.get("owner") ?? "").trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(owner)) {
    return NextResponse.json({ error: "not a Solana address" }, { status: 400 });
  }

  try {
    const holdings = await readWalletHoldings(owner);
    const known = holdings.filter((h) => tokenByMint(h.mint));
    const otherCount = holdings.length - known.length;

    const lines = await Promise.all(
      known.map(async (h) => {
        const token = tokenByMint(h.mint)!;
        const [mintState, price] = await Promise.all([
          readMint(h.mint),
          jupiterPrice(h.mint),
        ]);
        const scaled =
          mintState.multiplier !== null
            ? h.rawUi * mintState.multiplier
            : h.rawUi;
        return {
          token,
          kindLabel: KIND_LABEL[token.kind],
          rawUi: h.rawUi,
          scaledUi: scaled,
          multiplier: mintState.multiplier,
          price,
          mark: price !== null ? scaled * price : null,
          extensions: mintState.extensions,
        };
      })
    );

    return NextResponse.json({
      owner,
      asOf: new Date().toISOString(),
      lines,
      otherTokenAccounts: otherCount,
      note: "Scaled units use the mint multiplier. A transfer history would miss that change.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "wallet read failed" },
      { status: 500 }
    );
  }
}
