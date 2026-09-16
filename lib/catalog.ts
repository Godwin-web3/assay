export type IssuerKind =
  | "tracker_certificate"
  | "structured_note"
  | "share_redeemable"
  | "spv_exposure";

export type CatalogGroup = "spacex" | "aapl" | "nvda" | "tsla" | "spy";

export type CatalogToken = {
  id: string;
  symbol: string;
  name: string;
  mint: string;
  underlying: string;
  cashTicker: string | null;
  issuer: string;
  kind: IssuerKind;
  claim: string;
  notTheShare: string;
  docs: string;
  group: CatalogGroup;
};

const TRACKER =
  "Jersey tracker certificate from Backed. Economic exposure, not the listed share.";
const NOTE =
  "Ondo tokenized note from a BVI SPV. Economic exposure. Not shareholder rights.";

export const TOKENS: CatalogToken[] = [
  {
    id: "spcxx",
    symbol: "SPCXx",
    name: "SpaceX xStock",
    mint: "Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8",
    underlying: "SpaceX",
    cashTicker: null,
    issuer: "Backed Assets (JE) Limited",
    kind: "tracker_certificate",
    claim: TRACKER,
    notTheShare: "Holding SPCXx is not holding SpaceX common stock.",
    docs: "https://docs.xstocks.fi",
    group: "spacex",
  },
  {
    id: "spcxon",
    symbol: "SPCXon",
    name: "SpaceX (Ondo Tokenized)",
    mint: "wzAyQTorWyoVXuJKj2x8EqKEGJpS13z6EWE9z5Aondo",
    underlying: "SpaceX",
    cashTicker: null,
    issuer: "Ondo Global Markets (BVI) Limited",
    kind: "structured_note",
    claim: NOTE,
    notTheShare: "Ondo notes are not shares in the operating company.",
    docs: "https://docs.ondo.finance",
    group: "spacex",
  },
  {
    id: "spcx-backpack",
    symbol: "SPCX",
    name: "SpaceX - Backpack Securities",
    mint: "SPCXxcqXj6e5dJDVNovHN8744zkbhM2bYudU45BimGb",
    underlying: "SpaceX",
    cashTicker: null,
    issuer: "Backpack Securities",
    kind: "share_redeemable",
    claim: "US broker-dealer issuance. Redeemable 1:1 for eligible holders.",
    notTheShare: "Redeemability is gated. A permissionless wallet is not a brokerage account.",
    docs: "https://learn.backpack.exchange",
    group: "spacex",
  },
  {
    id: "spcx-pre",
    symbol: "PreSpaceX",
    name: "SpaceX PreStock",
    mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
    underlying: "SpaceX",
    cashTicker: null,
    issuer: "PreStocks",
    kind: "spv_exposure",
    claim: "Pre-listing / SPV-style exposure. Not a listed-share wrapper.",
    notTheShare: "Do not mark this as the same instrument as a redeemable listed share.",
    docs: "https://prestocks.com",
    group: "spacex",
  },
  {
    id: "aaplx",
    symbol: "AAPLx",
    name: "Apple xStock",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    underlying: "AAPL",
    cashTicker: "AAPL",
    issuer: "Backed Assets (JE) Limited",
    kind: "tracker_certificate",
    claim: TRACKER + " Scaled UI Amount carries dividends and splits.",
    notTheShare: "AAPLx is not an Apple share. No vote.",
    docs: "https://docs.xstocks.fi/developers/multipliers",
    group: "aapl",
  },
  {
    id: "aaplon",
    symbol: "AAPLon",
    name: "Apple (Ondo Tokenized)",
    mint: "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo",
    underlying: "AAPL",
    cashTicker: "AAPL",
    issuer: "Ondo Global Markets (BVI) Limited",
    kind: "structured_note",
    claim: NOTE,
    notTheShare: "AAPLon is a note. It is not AAPL at the transfer agent.",
    docs: "https://docs.ondo.finance",
    group: "aapl",
  },
  {
    id: "nvdax",
    symbol: "NVDAx",
    name: "NVIDIA xStock",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    underlying: "NVDA",
    cashTicker: "NVDA",
    issuer: "Backed Assets (JE) Limited",
    kind: "tracker_certificate",
    claim: TRACKER,
    notTheShare: "NVDAx is not an NVIDIA share.",
    docs: "https://docs.xstocks.fi",
    group: "nvda",
  },
  {
    id: "tslax",
    symbol: "TSLAx",
    name: "Tesla xStock",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    underlying: "TSLA",
    cashTicker: "TSLA",
    issuer: "Backed Assets (JE) Limited",
    kind: "tracker_certificate",
    claim: TRACKER,
    notTheShare: "TSLAx is not a Tesla share.",
    docs: "https://docs.xstocks.fi",
    group: "tsla",
  },
  {
    id: "spyx",
    symbol: "SPYx",
    name: "SP500 xStock",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    underlying: "SPY",
    cashTicker: "SPY",
    issuer: "Backed Assets (JE) Limited",
    kind: "tracker_certificate",
    claim: TRACKER,
    notTheShare: "SPYx is not an SPY share.",
    docs: "https://docs.xstocks.fi",
    group: "spy",
  },
];

export const KIND_LABEL: Record<IssuerKind, string> = {
  tracker_certificate: "Tracker certificate",
  structured_note: "Structured note",
  share_redeemable: "Share-redeemable (eligible)",
  spv_exposure: "SPV / pre-listing exposure",
};

export const GROUPS: { id: CatalogGroup; label: string }[] = [
  { id: "spacex", label: "SpaceX four claims" },
  { id: "aapl", label: "AAPL" },
  { id: "nvda", label: "NVDA" },
  { id: "tsla", label: "TSLA" },
  { id: "spy", label: "SPY" },
];

export function tokenByMint(mint: string) {
  return TOKENS.find((t) => t.mint === mint);
}

/** Row shape for the instruments table (durable book). */
export function instrumentRow(token: CatalogToken) {
  return {
    mint: token.mint,
    id: token.id,
    symbol: token.symbol,
    name: token.name,
    underlying: token.underlying,
    cash_ticker: token.cashTicker,
    issuer: token.issuer,
    kind: token.kind,
    claim: token.claim,
    not_the_share: token.notTheShare,
    docs: token.docs,
    catalog_group: token.group,
  };
}
