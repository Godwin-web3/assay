import { NextRequest, NextResponse } from "next/server";
import { KIND_LABEL, tokenByMint } from "@/lib/catalog";
import { jupiterPrice, readMint, readWalletHoldings } from "@/lib/solana";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const owner = (req.nextUrl.searchParams.get("owner") ?? "").trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(owner)) {
    return new NextResponse("not a Solana address", { status: 400 });
  }

  const holdings = await readWalletHoldings(owner);
  const known = holdings.filter((h) => tokenByMint(h.mint));
  const asOf = new Date().toISOString();
  const rows = [
    ["as_of","owner","symbol","kind","issuer","mint","raw","scaled","multiplier","pool_price","mark"].join(","),
  ];

  for (const h of known) {
    const token = tokenByMint(h.mint)!;
    const [mintState, price] = await Promise.all([
      readMint(h.mint),
      jupiterPrice(h.mint),
    ]);
    const scaled =
      mintState.multiplier !== null ? h.rawUi * mintState.multiplier : h.rawUi;
    const mark = price !== null ? scaled * price : "";
    rows.push(
      [
        asOf,
        owner,
        token.symbol,
        KIND_LABEL[token.kind],
        `"${token.issuer}"`,
        token.mint,
        h.rawUi,
        scaled,
        mintState.multiplier ?? "",
        price ?? "",
        mark,
      ].join(",")
    );
  }

  return new NextResponse(rows.join("\n") + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="assay-${owner.slice(0, 8)}-${asOf.slice(0, 10)}.csv"`,
    },
  });
}
