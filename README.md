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

## The book

Assay is a verified position layer other products can read — not a dashboard. The UI is one client; the product is the book. Users are people and protocols.

Protocols read:

- `GET /v1/mint/:mint` — instrument + live Solana mint state + latest snapshot fields + `impliedIncome` vs the previous snapshot + events
- `GET /v1/wallet/:owner` — each catalogued token the wallet holds: `kind`, `raw`, `scaled`, `price`, `impliedIncome`, `claim`

Shapes are in `lib/v1.ts`. Solana (`lib/solana.ts`) remains the live source of truth for mint and wallet reads. Durable rows live in Supabase (`instruments`, `snapshots`). Events are stored as jsonb on the snapshot (keyed by mint + as_of), not a third product.

On every successful v1 read: fetch Solana → append a snapshot → compute implied income vs the prior snapshot for that mint (null if none). Formula is documented in `lib/impliedIncome.ts`.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Optional: `SOLANA_RPC` in `.env.local` if public RPC rate-limits.

## Supabase

Copy `.env.example` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server writes only)

Apply `supabase/migrations/20260916120000_assay_book.sql` (schema + seed of current `TOKENS`). Re-sync the catalog with `npm run seed`.

If those credentials are missing, v1 still returns live Solana data and skips persistence (`snapshot.persisted: false`; `impliedIncome` is null until a prior snapshot exists).

## Repo

https://github.com/Godwin-web3/assay
