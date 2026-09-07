-- Atomic quote number generator. A single UPDATE ... RETURNING takes a row
-- lock on the business row for the duration of the statement, so two
-- concurrent quote creations for the same business cannot be handed the same
-- sequence number (unlike counting existing rows, which has a race window).
--
-- This function is SECURITY DEFINER (it needs to update businesses.next_quote_seq
-- regardless of the caller's own RLS visibility of that row), which means it
-- bypasses RLS - so it explicitly checks that the caller owns the business
-- before touching anything.
create or replace function public.next_quote_number(p_business_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_seq integer;
  v_prefix text;
  v_owner uuid;
begin
  select owner_id into v_owner from public.businesses where id = p_business_id;

  if v_owner is null then
    raise exception 'Business % not found', p_business_id;
  end if;

  if v_owner <> auth.uid() then
    raise exception 'Not authorized for business %', p_business_id;
  end if;

  update public.businesses
    set next_quote_seq = next_quote_seq + 1
    where id = p_business_id
    returning next_quote_seq - 1, quote_prefix into v_seq, v_prefix;

  return v_prefix || lpad(v_seq::text, 4, '0');
end;
$$;

grant execute on function public.next_quote_number(uuid) to authenticated;
