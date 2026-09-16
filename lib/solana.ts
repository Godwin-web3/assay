const RPC =
  process.env.SOLANA_RPC ?? "https://api.mainnet-beta.solana.com";

type RpcResult<T> = { result?: T; error?: { message: string } };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  const json = (await res.json()) as RpcResult<T>;
  if (json.error) throw new Error(json.error.message);
  if (!json.result) throw new Error(`${method} returned empty`);
  return json.result;
}

export type ParsedMint = {
  mint: string;
  decimals: number | null;
  supplyRaw: string | null;
  supplyUi: number | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  program: string | null;
  extensions: string[];
  multiplier: number | null;
  scaledSupply: number | null;
};

export async function readMint(mint: string): Promise<ParsedMint> {
  const account = await rpc<{
    value?: {
      owner?: string;
      data?: {
        program?: string;
        parsed?: {
          info?: {
            decimals?: number;
            supply?: string;
            mintAuthority?: string;
            freezeAuthority?: string;
            extensions?: Array<{
              extension?: string;
              state?: {
                multiplier?: string | number;
                newMultiplier?: string | number;
              };
            }>;
          };
        };
      };
    };
  }>("getAccountInfo", [mint, { encoding: "jsonParsed" }]);

  const info = account.value?.data?.parsed?.info;
  const program = account.value?.data?.program ?? account.value?.owner ?? null;
  const extensions = (info?.extensions ?? [])
    .map((e) => e.extension)
    .filter((x): x is string => Boolean(x));

  const scaled = (info?.extensions ?? []).find(
    (e) => e.extension === "scaledUiAmountConfig"
  );
  const multiplierRaw =
    scaled?.state?.multiplier ?? scaled?.state?.newMultiplier ?? null;
  const multiplier =
    multiplierRaw === null || multiplierRaw === undefined
      ? null
      : Number(multiplierRaw);

  const decimals = info?.decimals ?? null;
  const supplyRaw = info?.supply ?? null;
  const supplyUi =
    supplyRaw && decimals !== null
      ? Number(supplyRaw) / 10 ** decimals
      : null;

  return {
    mint,
    decimals,
    supplyRaw,
    supplyUi,
    mintAuthority: info?.mintAuthority ?? null,
    freezeAuthority: info?.freezeAuthority ?? null,
    program,
    extensions,
    multiplier: Number.isFinite(multiplier) ? multiplier : null,
    scaledSupply:
      supplyUi !== null && multiplier !== null && Number.isFinite(multiplier)
        ? supplyUi * multiplier
        : supplyUi,
  };
}

export async function jupiterPrice(mint: string): Promise<number | null> {
  const urls = [
    `https://lite-api.jup.ag/price/v3?ids=${mint}`,
    `https://api.jup.ag/price/v2?ids=${mint}`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        data?: Record<string, { price?: string | number }>;
        [k: string]: unknown;
      };
      const row = json.data?.[mint] ?? (json as Record<string, { usdPrice?: number }>)[mint];
      const price =
        (row as { price?: string | number })?.price ??
        (row as { usdPrice?: number })?.usdPrice;
      if (price !== undefined) return Number(price);
    } catch {
      continue;
    }
  }
  return null;
}
