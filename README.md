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
- `GET /v1/wallet/:owner/statement?from=&to=` — dated statement from snapshot diffs (not a live tape). Requires both `from` and `to` (ISO date or datetime, inclusive on snapshot `as_of`). Optional `format=csv` or `Accept: text/csv` serializes the same object.

Shapes are in `lib/v1.ts`. Solana (`lib/solana.ts`) remains the live source of truth for mint and wallet reads. Durable rows live in Supabase (`instruments`, `snapshots`). Events are stored as jsonb on the snapshot (keyed by mint + as_of), not a third product.

On every successful v1 mint/wallet read: fetch Solana → append a snapshot → compute implied income vs par and vs the prior snapshot for that mint. Formula is documented in `lib/impliedIncome.ts`.

The statement does not append a snapshot and does not rebuild history from one Solana read. Live Solana is used only to list catalogued mints the wallet holds now; rows are consecutive snapshot diffs for those mints (multiplier, implied income, mint/freeze authority). Transfer noise is omitted. Persistence is required (`503` if Supabase is unset). Empty `rows` (`200`) when nothing catalogued was held and/or nothing material moved in range.

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

### Statement

`GET /v1/wallet/:owner/statement?from=&to=` is the dated book for a wallet. Rows are snapshot diffs, not a dump of current lots. The existing `/api/statement` CSV remains the live point-in-time download from the site.

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

If those credentials are missing, v1 mint/wallet still return live Solana data and skip persistence (`snapshot.persisted: false`; `impliedIncome.vsLastSnapshot` is `0` until a prior snapshot exists). `GET /v1/wallet/:owner/statement` cannot: it needs the snapshot table and returns `503`.

## Repo

https://github.com/Godwin-web3/assay
