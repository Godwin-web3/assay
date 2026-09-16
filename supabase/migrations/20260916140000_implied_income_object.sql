-- Document implied_income: vsLastSnapshot in token units.
-- Full object { vsPar, vsLastSnapshot, unit, note } lives in payload JSON.
-- No column type change — keep the existing double.

comment on column public.snapshots.implied_income is
  'vsLastSnapshot in token units (extra scaled vs previous multiplier). Full impliedIncome object is in payload.';

comment on table public.snapshots is
  'One row per successful v1 read. events are multiplier/authority diffs (or first-snapshot baseline), not mint-account transfers.';
