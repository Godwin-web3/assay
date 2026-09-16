import { NextRequest, NextResponse } from "next/server";
import { TOKENS, tokenByMint } from "@/lib/catalog";
import { lastCashClose } from "@/lib/close";
import { mintEvents } from "@/lib/events";
import { jupiterPrice, readMint } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");
  const group = req.nextUrl.searchParams.get("group");

  const selected = mint
    ? TOKENS.filter((t) => t.mint === mint)
    : group
      ? TOKENS.filter((t) => t.group === group)
      : TOKENS.filter((t) => t.group === "spacex");

  const closeCache = new Map<string, Awaited<ReturnType<typeof lastCashClose>>>();

  const pages = await Promise.all(
    selected.map(async (token) => {
      try {
        const [mintState, price] = await Promise.all([
          readMint(token.mint),
          jupiterPrice(token.mint),
        ]);
        let close = null;
        if (token.cashTicker) {
          if (!closeCache.has(token.cashTicker)) {
            closeCache.set(token.cashTicker, await lastCashClose(token.cashTicker));
          }
          close = closeCache.get(token.cashTicker) ?? null;
        }
        const vsClose =
          price !== null && close
            ? ((price - close.close) / close.close) * 100
            : null;
        const events = await mintEvents({
          mint: token.mint,
          multiplier: mintState.multiplier,
        });
        return {
          token,
          mintState,
          price,
          close,
          vsClose,
          events,
          error: null as string | null,
        };
      } catch (err) {
        return {
          token,
          mintState: null,
          price: null,
          close: null,
          vsClose: null,
          events: [],
          error: err instanceof Error ? err.message : "read failed",
        };
      }
    })
  );

  const livePrices = pages.map((p) => p.price).filter((n): n is number => n !== null);
  const mid =
    livePrices.length > 0
      ? livePrices.reduce((a, b) => a + b, 0) / livePrices.length
      : null;

  const compared = pages.map((p) => ({
    ...p,
    vsCohort: p.price !== null && mid ? ((p.price - mid) / mid) * 100 : null,
    catalog: tokenByMint(p.token.mint) ?? p.token,
  }));

  return NextResponse.json({
    asOf: new Date().toISOString(),
    sources: {
      chain: "solana jsonParsed mint",
      price: "jupiter pool",
      lastClose: "yahoo or stooq daily close",
      overnightOfficialNav: false,
    },
    pages: compared,
  });
}
