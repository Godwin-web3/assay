export type LastClose = {
  ticker: string;
  close: number;
  date: string;
  source: string;
};

export async function lastCashClose(
  ticker: string
): Promise<LastClose | null> {
  const yahoo = await fromYahoo(ticker);
  if (yahoo) return yahoo;
  return fromStooq(ticker);
}

async function fromYahoo(ticker: string): Promise<LastClose | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      ticker
    )}?interval=1d&range=10d`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { "user-agent": "assay/0.1" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          meta?: { regularMarketPrice?: number };
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }>;
      };
    };
    const result = json.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const times = result?.timestamp ?? [];
    for (let i = closes.length - 1; i >= 0; i--) {
      const close = closes[i];
      const ts = times[i];
      if (close && ts) {
        return {
          ticker,
          close,
          date: new Date(ts * 1000).toISOString().slice(0, 10),
          source: "yahoo daily close",
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function fromStooq(ticker: string): Promise<LastClose | null> {
  try {
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(
      ticker.toLowerCase()
    )}.us&i=d`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split("\n");
    const last = lines[lines.length - 1];
    const parts = last.split(",");
    if (parts.length < 5) return null;
    const date = parts[0];
    const close = Number(parts[4]);
    if (!Number.isFinite(close)) return null;
    return { ticker, close, date, source: "stooq daily close" };
  } catch {
    return null;
  }
}
