-- Records when a customer accepted or declined a quote via the public quote
-- page. Spec section 19: "acceptance can simply record the customer's
-- acceptance and timestamp" - no legally binding e-signature in V1.
alter table public.quotes
  add column if not exists responded_at timestamptz;
