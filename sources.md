# Assay sources

The book is primary sources plus live mint state. It is not an official NAV product.

## Demo set

SpaceX quartet. Same name, four claims.

| Symbol | Issuer | Kind | Mint |
| --- | --- | --- | --- |
| SPCXx | Backed Assets (JE) Limited | tracker certificate | `Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8` |
| SPCXon | Ondo Global Markets (BVI) | structured note | `wzAyQTorWyoVXuJKj2x8EqKEGJpS13z6EWE9z5Aondo` |
| SPCX | Backpack Securities | share-redeemable if eligible | `SPCXxcqXj6e5dJDVNovHN8744zkbhM2bYudU45BimGb` |
| PreSpaceX | PreStocks | SPV / pre-listing exposure | `PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh` |

Multiplier path.

| Symbol | Mint |
| --- | --- |
| AAPLx | `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp` |

xStocks Scaled UI Amount: raw amount stays. Multiplier moves. Display is raw × multiplier.
https://docs.xstocks.fi/developers/multipliers

Ondo Token-2022 mints for NVDAon, TSLAon, and SPYon were taken from Ondo `gm-solana-simulator` `constants.rs` plus on-chain Token-2022 `tokenMetadata` (mint authority `9foMHsSDq7nMg4WPusSz9eY7tyxyukqborA8GyU5cUxD`, same as AAPLon) — not Dexscreener.

| Symbol | Issuer | Kind | Mint |
| --- | --- | --- | --- |
| NVDAon | Ondo Global Markets (BVI) | structured note | `gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo` |
| TSLAon | Ondo Global Markets (BVI) | structured note | `KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo` |
| SPYon | Ondo Global Markets (BVI) | structured note | `k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo` |

## Price

Live line: Jupiter pool price.
Not included: Pyth Pro extended-hours / overnight US equity.
Optional later: Hermes Core wrapper feeds (Crypto.AAPLX, Crypto.AAPLON) if the trial key returns them.

## Pyth check

Record pass/fail here after Terminal search.

- Crypto.AAPLX/USD:
- Crypto.AAPLON/USD:
- Equity.US.AAPL after cash close:
