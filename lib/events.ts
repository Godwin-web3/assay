const RPC =
  process.env.SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";

export type MintEvent = {
  kind: "multiplier" | "mint_tx";
  label: string;
  at: string | null;
  signature?: string;
};

export async function mintEvents(args: {
  mint: string;
  multiplier: number | null;
}): Promise<MintEvent[]> {
  const out: MintEvent[] = [];
  if (args.multiplier !== null && args.multiplier !== 1) {
    const extra = ((args.multiplier - 1) * 100).toFixed(3);
    out.push({
      kind: "multiplier",
      label: `Scaled UI Amount is ${args.multiplier}. Raw units understate economic units by ${extra}%.`,
      at: null,
    });
  } else {
    out.push({
      kind: "multiplier",
      label:
        args.multiplier === 1
          ? "Multiplier is 1. No scaled corporate action is applied right now."
          : "No Scaled UI Amount on this mint.",
      at: null,
    });
  }

  try {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [args.mint, { limit: 8 }],
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as {
      result?: Array<{
        signature: string;
        blockTime?: number | null;
        err?: unknown;
      }>;
    };
    for (const row of json.result ?? []) {
      if (row.err) continue;
      out.push({
        kind: "mint_tx",
        label: "Transaction touching the mint account",
        at: row.blockTime
          ? new Date(row.blockTime * 1000).toISOString()
          : null,
        signature: row.signature,
      });
    }
  } catch {
    // keep multiplier row
  }
  return out;
}
