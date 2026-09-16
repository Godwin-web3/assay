-- Additive catalog rows: NVDAon, TSLAon, SPYon.
-- Existing instruments are unchanged. Mint is the primary key.

insert into public.instruments (
  mint, id, symbol, name, underlying, cash_ticker, issuer, kind,
  claim, not_the_share, docs, catalog_group
) values
  (
    'gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo',
    'nvdaon',
    'NVDAon',
    'NVIDIA (Ondo Tokenized)',
    'NVDA',
    'NVDA',
    'Ondo Global Markets (BVI) Limited',
    'structured_note',
    $cat$Ondo tokenized note from a BVI SPV. Economic exposure. Not shareholder rights.$cat$,
    $cat$NVDAon is a note. It is not NVDA at the transfer agent.$cat$,
    'https://docs.ondo.finance',
    'nvda'
  ),
  (
    'KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo',
    'tslaon',
    'TSLAon',
    'Tesla (Ondo Tokenized)',
    'TSLA',
    'TSLA',
    'Ondo Global Markets (BVI) Limited',
    'structured_note',
    $cat$Ondo tokenized note from a BVI SPV. Economic exposure. Not shareholder rights.$cat$,
    $cat$TSLAon is a note. It is not TSLA at the transfer agent.$cat$,
    'https://docs.ondo.finance',
    'tsla'
  ),
  (
    'k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo',
    'spyon',
    'SPYon',
    'SPDR S&P 500 ETF (Ondo Tokenized)',
    'SPY',
    'SPY',
    'Ondo Global Markets (BVI) Limited',
    'structured_note',
    $cat$Ondo tokenized note from a BVI SPV. Economic exposure. Not shareholder rights.$cat$,
    $cat$SPYon is a note. It is not SPY at the transfer agent.$cat$,
    'https://docs.ondo.finance',
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
