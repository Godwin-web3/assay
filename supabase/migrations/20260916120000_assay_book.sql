-- Assay book: durable instruments + snapshots.
-- Solana remains the live source of truth for mint/wallet reads.
-- This schema is the append-only book other products can read.

create table if not exists public.instruments (
  mint text primary key,
  id text not null unique,
  symbol text not null,
  name text not null,
  underlying text not null,
  cash_ticker text,
  issuer text not null,
  kind text not null check (kind in (
    'tracker_certificate',
    'structured_note',
    'share_redeemable',
    'spv_exposure'
  )),
  claim text not null,
  not_the_share text not null,
  docs text not null,
  catalog_group text not null,
  inserted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.instruments is
  'Catalogued claims. Seeded from lib/catalog.ts. Mint is the primary key.';

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  mint text not null references public.instruments(mint) on delete cascade,
  as_of timestamptz not null,
  supply_raw text,
  supply_ui double precision,
  scaled_supply double precision,
  multiplier double precision,
  decimals integer,
  price double precision,
  close double precision,
  close_date text,
  close_ticker text,
  close_source text,
  mint_authority text,
  freeze_authority text,
  program text,
  extensions jsonb not null default '[]'::jsonb,
  -- Events live on the snapshot (mint + as_of). Not a third product surface.
  events jsonb not null default '[]'::jsonb,
  payload jsonb not null,
  previous_snapshot_id uuid references public.snapshots(id) on delete set null,
  implied_income double precision,
  created_at timestamptz not null default now()
);

comment on table public.snapshots is
  'One row per successful v1 read. implied_income is vs previous_snapshot_id for that mint.';

create index if not exists snapshots_by_mint_as_of
  on public.snapshots (mint, as_of desc);

alter table public.instruments enable row level security;
alter table public.snapshots enable row level security;

drop policy if exists "instruments are publicly readable" on public.instruments;
create policy "instruments are publicly readable"
  on public.instruments
  for select
  using (true);

drop policy if exists "snapshots are publicly readable" on public.snapshots;
create policy "snapshots are publicly readable"
  on public.snapshots
  for select
  using (true);

-- Writes go through the service role (bypasses RLS) from Next.js v1 routes.

insert into public.instruments (
  mint, id, symbol, name, underlying, cash_ticker, issuer, kind,
  claim, not_the_share, docs, catalog_group
) values
  (
    'Xs3oZwbHvqis4NYcf4YKWmEia2eC84wSiVrcYcTqpH8',
    'spcxx',
    'SPCXx',
    'SpaceX xStock',
    'SpaceX',
    null,
    'Backed Assets (JE) Limited',
    'tracker_certificate',
    $cat$Jersey tracker certificate from Backed. Economic exposure, not the listed share.$cat$,
    $cat$Holding SPCXx is not holding SpaceX common stock.$cat$,
    'https://docs.xstocks.fi',
    'spacex'
  ),
  (
    'wzAyQTorWyoVXuJKj2x8EqKEGJpS13z6EWE9z5Aondo',
    'spcxon',
    'SPCXon',
    'SpaceX (Ondo Tokenized)',
    'SpaceX',
    null,
    'Ondo Global Markets (BVI) Limited',
    'structured_note',
    $cat$Ondo tokenized note from a BVI SPV. Economic exposure. Not shareholder rights.$cat$,
    $cat$Ondo notes are not shares in the operating company.$cat$,
    'https://docs.ondo.finance',
    'spacex'
  ),
  (
    'SPCXxcqXj6e5dJDVNovHN8744zkbhM2bYudU45BimGb',
    'spcx-backpack',
    'SPCX',
    'SpaceX - Backpack Securities',
    'SpaceX',
    null,
    'Backpack Securities',
    'share_redeemable',
    $cat$US broker-dealer issuance. Redeemable 1:1 for eligible holders.$cat$,
    $cat$Redeemability is gated. A permissionless wallet is not a brokerage account.$cat$,
    'https://learn.backpack.exchange',
    'spacex'
  ),
  (
    'PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh',
    'spcx-pre',
    'PreSpaceX',
    'SpaceX PreStock',
    'SpaceX',
    null,
    'PreStocks',
    'spv_exposure',
    $cat$Pre-listing / SPV-style exposure. Not a listed-share wrapper.$cat$,
    $cat$Do not mark this as the same instrument as a redeemable listed share.$cat$,
    'https://prestocks.com',
    'spacex'
  ),
  (
    'XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp',
    'aaplx',
    'AAPLx',
    'Apple xStock',
    'AAPL',
    'AAPL',
    'Backed Assets (JE) Limited',
    'tracker_certificate',
    $cat$Jersey tracker certificate from Backed. Economic exposure, not the listed share. Scaled UI Amount carries dividends and splits.$cat$,
    $cat$AAPLx is not an Apple share. No vote.$cat$,
    'https://docs.xstocks.fi/developers/multipliers',
    'aapl'
  ),
  (
    '123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo',
    'aaplon',
    'AAPLon',
    'Apple (Ondo Tokenized)',
    'AAPL',
    'AAPL',
    'Ondo Global Markets (BVI) Limited',
    'structured_note',
    $cat$Ondo tokenized note from a BVI SPV. Economic exposure. Not shareholder rights.$cat$,
    $cat$AAPLon is a note. It is not AAPL at the transfer agent.$cat$,
    'https://docs.ondo.finance',
    'aapl'
  ),
  (
    'Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh',
    'nvdax',
    'NVDAx',
    'NVIDIA xStock',
    'NVDA',
    'NVDA',
    'Backed Assets (JE) Limited',
    'tracker_certificate',
    $cat$Jersey tracker certificate from Backed. Economic exposure, not the listed share.$cat$,
    $cat$NVDAx is not an NVIDIA share.$cat$,
    'https://docs.xstocks.fi',
    'nvda'
  ),
  (
    'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB',
    'tslax',
    'TSLAx',
    'Tesla xStock',
    'TSLA',
    'TSLA',
    'Backed Assets (JE) Limited',
    'tracker_certificate',
    $cat$Jersey tracker certificate from Backed. Economic exposure, not the listed share.$cat$,
    $cat$TSLAx is not a Tesla share.$cat$,
    'https://docs.xstocks.fi',
    'tsla'
  ),
  (
    'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W',
    'spyx',
    'SPYx',
    'SP500 xStock',
    'SPY',
    'SPY',
    'Backed Assets (JE) Limited',
    'tracker_certificate',
    $cat$Jersey tracker certificate from Backed. Economic exposure, not the listed share.$cat$,
    $cat$SPYx is not an SPY share.$cat$,
    'https://docs.xstocks.fi',
    'spy'
  )
on conflict (mint) do update set
  id = excluded.id,
  symbol = excluded.symbol,
  name = excluded.name,
  underlying = excluded.underlying,
  cash_ticker = excluded.cash_ticker,
  issuer = excluded.issuer,
  kind = excluded.kind,
  claim = excluded.claim,
  not_the_share = excluded.not_the_share,
  docs = excluded.docs,
  catalog_group = excluded.catalog_group,
  updated_at = now();
