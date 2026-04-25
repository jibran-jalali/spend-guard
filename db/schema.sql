create extension if not exists pgcrypto;

DO $$ BEGIN CREATE TYPE public.user_role AS ENUM ('admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'canceled', 'paused'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'quarterly', 'annual'); EXCEPTION WHEN duplicate_object THEN null; END $$;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'USD',
  renewal_window_days integer not null default 30,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'admin',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  accent_color text not null default '#16a34a',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, name)
);

create table if not exists public.subscription_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  accent_color text not null default '#16a34a',
  description text default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, name)
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  logo_key text,
  website text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (business_id, name)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  category_id uuid references public.subscription_categories(id) on delete set null,
  plan_name text not null,
  cost numeric(12, 2) not null check (cost >= 0),
  currency text not null default 'USD',
  billing_cycle public.billing_cycle not null default 'monthly',
  renewal_date date not null,
  next_billing_date date not null,
  status public.subscription_status not null default 'active',
  notes text default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_business_id on public.profiles (business_id);
create index if not exists idx_departments_business_id on public.departments (business_id);
create index if not exists idx_categories_business_id on public.subscription_categories (business_id);
create index if not exists idx_vendors_business_id on public.vendors (business_id);
create index if not exists idx_subscriptions_business_status on public.subscriptions (business_id, status);
create index if not exists idx_subscriptions_business_renewal on public.subscriptions (business_id, renewal_date);
create index if not exists idx_subscriptions_department on public.subscriptions (department_id);
create index if not exists idx_subscriptions_vendor on public.subscriptions (vendor_id);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at before update on public.businesses
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_departments_updated_at on public.departments;
create trigger set_departments_updated_at before update on public.departments
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_subscription_categories_updated_at on public.subscription_categories;
create trigger set_subscription_categories_updated_at before update on public.subscription_categories
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_vendors_updated_at on public.vendors;
create trigger set_vendors_updated_at before update on public.vendors
for each row execute procedure public.handle_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at before update on public.subscriptions
for each row execute procedure public.handle_updated_at();

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid()
$$;

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.subscription_categories enable row level security;
alter table public.vendors enable row level security;
alter table public.subscriptions enable row level security;

create policy "business_select" on public.businesses
for select using (id = public.current_business_id());

create policy "business_update" on public.businesses
for update using (id = public.current_business_id());

create policy "profiles_select" on public.profiles
for select using (business_id = public.current_business_id());

create policy "profiles_update_self" on public.profiles
for update using (id = auth.uid());

create policy "departments_manage" on public.departments
for all using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "categories_manage" on public.subscription_categories
for all using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "vendors_manage" on public.vendors
for all using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());

create policy "subscriptions_manage" on public.subscriptions
for all using (business_id = public.current_business_id())
with check (business_id = public.current_business_id());
