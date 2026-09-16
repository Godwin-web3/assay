export type IssuerKind =
  | "tracker_certificate"
  | "structured_note"
  | "share_redeemable"
  | "spv_exposure";

export type CatalogToken = {
  id: string;
  symbol: string;
  name: string;
  mint: string;
  underlying: string;
  issuer: string;
  kind: IssuerKind;
  claim: string;
  notTheShare: string;
  docs: string;
  group: "spacex" | "apple";
};

export const TOKENS: CatalogToken[] = [
  {
    id: "spcxx",
    symbol: "SPCXx",
    name: "SpaceX xStock",
    mint: "Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8",
    underlying: "SpaceX",
    issuer: "Backed Assets (JE) Limited",
    kind: "tracker_certificate",
    claim:
      "Jersey tracker certificate. Economic exposure to SpaceX through a bearer instrument, not a share in SpaceX.",
    notTheShare:
      "Holding SPCXx is not holding SpaceX common stock. Redemption, if any, is cash or the certificate terms, not a transfer agent book-entry.",
    docs: "https://docs.xstocks.fi",
    group: "spacex",
  },
  {
    id: "spcxon",
    symbol: "SPCXon",
    name: "SpaceX (Ondo Tokenized)",
    mint: "wzAyQTorWyoVXuJKj2x8EqKEGJpS13z6EWE9z5Aondo",
    underlying: "SpaceX",
    issuer: "Ondo Global Markets (BVI) Limited",
    kind: "structured_note",
    claim:
      "Tokenized note issued by a BVI SPV. Economic exposure similar to the name. Swiss-law tokenholder terms. Not the listed equity.",
    notTheShare:
      "Ondo tokenized notes are not shares. You do not receive shareholder rights in the operating company.",
    docs: "https://docs.ondo.finance",
    group: "spacex",
  },
  {
    id: "spcx-backpack",
    symbol: "SPCX",
    name: "SpaceX - Backpack Securities",
    mint: "SPCXxcqXj6e5dJDVNovHN8744zkbhM2bYudU45BimGb",
    underlying: "SpaceX",
    issuer: "Backpack Securities",
    kind: "share_redeemable",
    claim:
      "US broker-dealer issuance. Designed as a 1:1 redeemable claim on the share for eligible holders.",
    notTheShare:
      "Redeemability is gated. The token in a permissionless wallet is not automatically a brokerage account.",
    docs: "https://learn.backpack.exchange",
    group: "spacex",
  },
  {
    id: "spcx-pre",
    symbol: "PreSpaceX",
    name: "SpaceX PreStock",
    mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
    underlying: "SpaceX",
    issuer: "PreStocks",
    kind: "spv_exposure",
    claim:
      "Pre-listing / SPV-style exposure. Tracks a private-market name. Different legal stack from a listed-share wrapper.",
    notTheShare:
      "Do not mark this as the same instrument as a redeemable listed-share token.",
    docs: "https://prestocks.com",
    group: "spacex",
  },
  {
    id: "aaplx",
    symbol: "AAPLx",
    name: "Apple xStock",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    underlying: "AAPL",
    issuer: "Backed Assets (JE) Limited",
    kind: "tracker_certificate",
    claim:
      "Token-2022 tracker with Scaled UI Amount. Dividends and splits move the multiplier. Raw token count can stay still while economic units change.",
    notTheShare:
      "AAPLx is not an Apple share. No vote. Multiplier is the corporate-action tape, not a transfer.",
    docs: "https://docs.xstocks.fi/developers/multipliers",
    group: "apple",
  },
];

export const KIND_LABEL: Record<IssuerKind, string> = {
  tracker_certificate: "Tracker certificate",
  structured_note: "Structured note",
  share_redeemable: "Share-redeemable (eligible)",
  spv_exposure: "SPV / pre-listing exposure",
};

export function tokenByMint(mint: string) {
  return TOKENS.find((t) => t.mint === mint);
}

export function tokensByGroup(group: CatalogToken["group"]) {
  return TOKENS.filter((t) => t.group === group);
}
