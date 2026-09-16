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

- `GET /v1/mint/:mint` — instrument + live Solana mint state + latest snapshot + `impliedIncome` object + quiet events
- `GET /v1/wallet/:owner` — each catalogued holding, complete enough to mark the lot without a second mint call

Shapes are in `lib/v1.ts`. Solana (`lib/solana.ts`) remains the live source of truth for mint and wallet reads. Durable rows live in Supabase (`instruments`, `snapshots`). Events are stored as jsonb on the snapshot (keyed by mint + as_of), not a third product.

On every successful v1 read: fetch Solana → append a snapshot → compute implied income vs par and vs the prior snapshot for that mint. Formula is documented in `lib/impliedIncome.ts`.

### impliedIncome

Always an object (never a bare number). Unit is **token**.

```json
{
  "vsPar": 0.00000599,
  "vsLastSnapshot": 0,
  "unit": "token",
  "note": "Scaled UI Amount versus raw. Not a transfer."
}
```

- `vsPar` — scaled − raw (mint: scaledSupply − supplyUi; wallet: holder scaled − holder raw)
- `vsLastSnapshot` — extra scaled units from a multiplier change vs the previous snapshot. `0` if the multiplier did not move or there is no prior snapshot. `vsPar` still carries the cumulative tape.

The `snapshots.implied_income` double stores `vsLastSnapshot`. The full object is in `payload.impliedIncome`.

### Wallet position

Each `/v1/wallet/:owner` holding includes: `kind`, `claim`, `notTheShare`, `raw`, `scaled`, `multiplier`, `price`, `mark` (scaled × pool price), `close` (last cash close when the instrument has a `cashTicker`, else `null`), `impliedIncome`.

### Events

Only `multiplier`, `mint_authority`, and `freeze_authority` — when they changed vs the previous snapshot, or as a first-snapshot baseline. Mint-account transfers are not events.

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

Apply `supabase/migrations/` in order (schema + seed of current `TOKENS`). Re-sync the catalog with `npm run seed`.

If those credentials are missing, v1 still returns live Solana data and skips persistence (`snapshot.persisted: false`; `impliedIncome.vsLastSnapshot` is `0` until a prior snapshot exists).

## Repo

https://github.com/Godwin-web3/assay
