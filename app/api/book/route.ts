import { NextRequest, NextResponse } from "next/server";
import { TOKENS, tokenByMint } from "@/lib/catalog";
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

  const pages = await Promise.all(
    selected.map(async (token) => {
      try {
        const [mintState, price] = await Promise.all([
          readMint(token.mint),
          jupiterPrice(token.mint),
        ]);
        return { token, mintState, price, error: null as string | null };
      } catch (err) {
        return {
          token,
          mintState: null,
          price: null,
          error: err instanceof Error ? err.message : "read failed",
        };
      }
    })
  );

  const livePrices = pages
    .map((p) => (p.price !== null ? p.price : null))
    .filter((n): n is number => n !== null);
  const mid =
    livePrices.length > 0
      ? livePrices.reduce((a, b) => a + b, 0) / livePrices.length
      : null;

  const compared = pages.map((p) => ({
    ...p,
    vsCohort:
      p.price !== null && mid ? ((p.price - mid) / mid) * 100 : null,
    catalog: tokenByMint(p.token.mint) ?? p.token,
  }));

  return NextResponse.json({
    asOf: new Date().toISOString(),
    sources: {
      chain: "solana jsonParsed mint",
      price: "jupiter",
      overnightOfficialNav: false,
    },
    pages: compared,
  });
}
