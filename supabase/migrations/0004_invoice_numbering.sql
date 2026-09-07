-- Same pattern as next_quote_number (migration 0002) - a single UPDATE ...
-- RETURNING row-locks the business record so concurrent invoice creation
-- can't collide on the same number, and ownership is checked explicitly
-- since this is SECURITY DEFINER and therefore bypasses RLS.
create or replace function public.next_invoice_number(p_business_id uuid)
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
    set next_invoice_seq = next_invoice_seq + 1
    where id = p_business_id
    returning next_invoice_seq - 1, invoice_prefix into v_seq, v_prefix;

  return v_prefix || lpad(v_seq::text, 4, '0');
end;
$$;

grant execute on function public.next_invoice_number(uuid) to authenticated;
