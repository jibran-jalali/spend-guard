create extension if not exists pgcrypto;

insert into public.vendors (business_id, name, logo_key, website)
select distinct
  s.business_id,
  trim(s.tool_name),
  lower(regexp_replace(trim(s.tool_name), '[^a-zA-Z0-9]+', '', 'g')),
  ''
from public.subscriptions s
where s.vendor_id is null
  and nullif(trim(s.tool_name), '') is not null
on conflict (business_id, name) do nothing;

update public.subscriptions s
set vendor_id = v.id
from public.vendors v
where s.vendor_id is null
  and v.business_id = s.business_id
  and lower(v.name) = lower(trim(s.tool_name));

do $$
declare
  missing_count integer;
begin
  select count(*) into missing_count
  from public.subscriptions
  where vendor_id is null;

  if missing_count > 0 then
    raise exception 'Cannot migrate subscriptions: % rows still have no vendor_id.', missing_count;
  end if;
end $$;

alter table public.subscriptions
  drop column if exists tool_name,
  drop column if exists usage_status,
  drop column if exists auto_renew,
  drop column if exists seats;

alter table public.subscriptions
  alter column vendor_id set not null;

alter table public.subscriptions
  drop constraint if exists subscriptions_vendor_id_fkey;

alter table public.subscriptions
  add constraint subscriptions_vendor_id_fkey
  foreign key (vendor_id)
  references public.vendors(id)
  on delete restrict;

create index if not exists idx_subscriptions_vendor on public.subscriptions (vendor_id);

drop table if exists public.ai_analyses;
drop table if exists public.alerts;
drop table if exists public.payments;

drop type if exists public.alert_severity;
drop type if exists public.alert_type;
drop type if exists public.payment_status;
drop type if exists public.usage_status;
