# Assay

A tokenized stock is a claim. Assay reads the mint and refuses to treat the ticker as the share.

Built for STOCKLANA. Kept after STOCKLANA.

## What it does now

- Classifies four SpaceX wrappers as four different instruments
- Reads Token-2022 mint authority, freeze, extensions, Scaled UI Amount
- Shows raw supply versus scaled supply on AAPLx
- Compares live Jupiter prices across the cohort
- States, in plain language, that the token is not the share

## What it does not do

- It does not publish official overnight NAV
- It does not require Pyth Pro
- It does not execute a swap

## Run

```bash
npm install
npm run dev
```

Optional: `SOLANA_RPC` in `.env.local` if public RPC rate-limits.

## Repo

https://github.com/Godwin-web3/assay
