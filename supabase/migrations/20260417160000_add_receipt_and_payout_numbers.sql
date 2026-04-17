-- ============================================================
-- Sprace — Receipt + payout-statement numbering (Fas 7e.1)
-- ============================================================
-- Adds sequential, unique, year-prefixed numbers to payments so
-- every captured payment carries a traceable receipt reference and
-- every transferred payout carries a statement reference.
--
-- Format:
--   Business receipt:          SPR-R-<yyyy>-<seq>  (e.g. SPR-R-2026-000001)
--   Creator payout statement:  SPR-P-<yyyy>-<seq>  (e.g. SPR-P-2026-000001)
--
-- Numbers are assigned by SECURITY DEFINER functions that update
-- the corresponding payment row atomically. Functions are
-- idempotent — if a number already exists for the given row, the
-- existing value is returned and no new number is consumed.
--
-- Design notes:
--  * Sequences survive rollbacks (they are not transactional), so
--    a failed PDF render will "burn" a number. That is acceptable
--    under Swedish bookkeeping law as long as we can account for
--    gaps (sequence audit trail) and retained source data allows
--    regeneration.
--  * RLS is not relaxed — the generator functions run as definer
--    to allow the webhook/payout action to assign a number, while
--    normal read/update policies remain unchanged.
-- ============================================================

-- ---------- Columns ----------
alter table public.payments
  add column if not exists receipt_number text unique,
  add column if not exists receipt_issued_at timestamptz,
  add column if not exists payout_statement_number text unique,
  add column if not exists payout_statement_issued_at timestamptz;

-- ---------- Sequences ----------
create sequence if not exists public.receipt_number_seq
  as bigint start with 1 minvalue 1 no cycle;

create sequence if not exists public.payout_statement_number_seq
  as bigint start with 1 minvalue 1 no cycle;

revoke all on sequence public.receipt_number_seq from public;
revoke all on sequence public.payout_statement_number_seq from public;

-- ---------- Generator functions ----------
create or replace function public.assign_receipt_number(p_payment_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing text;
  v_number text;
begin
  select receipt_number into v_existing
    from public.payments
   where id = p_payment_id
   for update;

  if v_existing is not null then
    return v_existing;
  end if;

  v_number := 'SPR-R-'
    || to_char(now() at time zone 'utc', 'YYYY')
    || '-'
    || lpad(nextval('public.receipt_number_seq')::text, 6, '0');

  update public.payments
     set receipt_number = v_number,
         receipt_issued_at = now()
   where id = p_payment_id;

  return v_number;
end;
$$;

create or replace function public.assign_payout_statement_number(p_payment_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing text;
  v_number text;
begin
  select payout_statement_number into v_existing
    from public.payments
   where id = p_payment_id
   for update;

  if v_existing is not null then
    return v_existing;
  end if;

  v_number := 'SPR-P-'
    || to_char(now() at time zone 'utc', 'YYYY')
    || '-'
    || lpad(nextval('public.payout_statement_number_seq')::text, 6, '0');

  update public.payments
     set payout_statement_number = v_number,
         payout_statement_issued_at = now()
   where id = p_payment_id;

  return v_number;
end;
$$;

-- Only the service role (and admins via is_admin() elsewhere) needs
-- to call these. Grant execute to authenticated so server actions
-- acting on behalf of a participant can also invoke.
revoke all on function public.assign_receipt_number(uuid) from public;
revoke all on function public.assign_payout_statement_number(uuid) from public;
grant execute on function public.assign_receipt_number(uuid) to service_role, authenticated;
grant execute on function public.assign_payout_statement_number(uuid) to service_role, authenticated;
