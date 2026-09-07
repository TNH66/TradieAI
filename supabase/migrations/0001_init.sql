-- TradieAI V1 schema
-- Run via: supabase db push  (or paste into the Supabase SQL editor)

-- ========== EXTENSIONS ==========
create extension if not exists "pgcrypto";

-- ========== ENUMS ==========
create type trade_type as enum (
  'plumbing', 'electrical', 'hvac', 'building', 'carpentry', 'other'
);

create type job_status as enum (
  'new', 'scheduled', 'in_progress', 'completed', 'cancelled'
);

create type quote_status as enum (
  'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'
);

create type invoice_status as enum (
  'draft', 'sent', 'paid', 'overdue', 'cancelled'
);

-- ========== PROFILES ==========
-- One row per auth.users user. Created automatically by trigger on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null,
  last_name text not null,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== BUSINESSES ==========
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  abn text,
  phone text,
  email text,
  address text,
  suburb text,
  state text,
  postcode text,
  trade trade_type not null default 'plumbing',
  gst_registered boolean not null default false,
  prices_include_gst boolean not null default true,
  default_labour_rate numeric(10, 2) not null default 0,
  default_callout_fee numeric(10, 2) not null default 0,
  default_quote_valid_days integer not null default 30,
  default_payment_terms_days integer not null default 7,
  quote_prefix text not null default 'Q-',
  invoice_prefix text not null default 'INV-',
  next_quote_seq integer not null default 1,
  next_invoice_seq integer not null default 1,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index businesses_owner_id_idx on public.businesses (owner_id);

-- ========== CUSTOMERS ==========
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  first_name text not null,
  last_name text,
  company text,
  phone text,
  email text,
  address text,
  suburb text,
  state text,
  postcode text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_business_id_idx on public.customers (business_id);

-- ========== JOBS ==========
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  job_number text not null,
  title text not null,
  description text,
  status job_status not null default 'new',
  scheduled_at timestamptz,
  assigned_to uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, job_number)
);

create index jobs_business_id_idx on public.jobs (business_id);
create index jobs_customer_id_idx on public.jobs (customer_id);

-- ========== JOB PHOTOS ==========
create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index job_photos_job_id_idx on public.job_photos (job_id);

-- ========== QUOTES ==========
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  job_id uuid references public.jobs (id) on delete set null,
  quote_number text not null,
  status quote_status not null default 'draft',
  title text,
  description text,
  subtotal numeric(10, 2) not null default 0,
  gst numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  valid_until date,
  notes text,
  public_id uuid not null default gen_random_uuid(),
  ai_assumptions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, quote_number),
  unique (public_id)
);

create index quotes_business_id_idx on public.quotes (business_id);
create index quotes_customer_id_idx on public.quotes (customer_id);
create index quotes_public_id_idx on public.quotes (public_id);

-- ========== QUOTE ITEMS ==========
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  sort_order integer not null default 0
);

create index quote_items_quote_id_idx on public.quote_items (quote_id);

-- ========== INVOICES ==========
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  job_id uuid references public.jobs (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  invoice_number text not null,
  status invoice_status not null default 'draft',
  subtotal numeric(10, 2) not null default 0,
  gst numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  due_date date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create index invoices_business_id_idx on public.invoices (business_id);
create index invoices_customer_id_idx on public.invoices (customer_id);

-- ========== INVOICE ITEMS ==========
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(10, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  sort_order integer not null default 0
);

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- ========== updated_at trigger helper ==========
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.businesses
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.customers
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.jobs
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.quotes
  for each row execute procedure public.set_updated_at();
create trigger set_updated_at before update on public.invoices
  for each row execute procedure public.set_updated_at();

-- ========== ROW LEVEL SECURITY ==========
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.customers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_photos enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- profiles: a user can only see/edit their own profile row
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- businesses: owner-only access (V1 = single owner per business, no team members yet)
create policy "businesses_all_owner" on public.businesses
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Helper pattern used below: a row is visible if its business_id belongs to the caller.
create policy "customers_all_via_business" on public.customers
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  ) with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "jobs_all_via_business" on public.jobs
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  ) with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "job_photos_all_via_job" on public.job_photos
  for all using (
    job_id in (
      select j.id from public.jobs j
      join public.businesses b on b.id = j.business_id
      where b.owner_id = auth.uid()
    )
  ) with check (
    job_id in (
      select j.id from public.jobs j
      join public.businesses b on b.id = j.business_id
      where b.owner_id = auth.uid()
    )
  );

create policy "quotes_all_via_business" on public.quotes
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  ) with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "quote_items_all_via_quote" on public.quote_items
  for all using (
    quote_id in (
      select q.id from public.quotes q
      join public.businesses b on b.id = q.business_id
      where b.owner_id = auth.uid()
    )
  ) with check (
    quote_id in (
      select q.id from public.quotes q
      join public.businesses b on b.id = q.business_id
      where b.owner_id = auth.uid()
    )
  );

create policy "invoices_all_via_business" on public.invoices
  for all using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  ) with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

create policy "invoice_items_all_via_invoice" on public.invoice_items
  for all using (
    invoice_id in (
      select i.id from public.invoices i
      join public.businesses b on b.id = i.business_id
      where b.owner_id = auth.uid()
    )
  ) with check (
    invoice_id in (
      select i.id from public.invoices i
      join public.businesses b on b.id = i.business_id
      where b.owner_id = auth.uid()
    )
  );

-- ========== PUBLIC QUOTE VIEW ==========
-- The public quote page (/quote/[public_id]) must work for anonymous visitors,
-- but must only ever expose the single quote matched by its public_id (a random
-- uuid, unguessable), never the full quotes table.
-- We do NOT add a blanket anonymous SELECT policy on public.quotes (that would
-- let anyone enumerate every quote). Instead the public page reads through a
-- restricted view + a security-definer function scoped to one public_id.

create view public.public_quote_view as
select
  q.public_id,
  q.quote_number,
  q.status,
  q.title,
  q.description,
  q.subtotal,
  q.gst,
  q.total,
  q.valid_until,
  q.notes,
  q.created_at,
  b.name as business_name,
  b.abn as business_abn,
  b.phone as business_phone,
  b.email as business_email,
  b.logo_url as business_logo_url,
  c.first_name as customer_first_name,
  c.last_name as customer_last_name
from public.quotes q
join public.businesses b on b.id = q.business_id
left join public.customers c on c.id = q.customer_id;

-- Server code should query this view with the service role key (server-only),
-- filtering by public_id, rather than granting anon direct table access.
