-- Demo-oriented sample records for SpendGuard.
-- Update the business_id values if you want to connect these rows to a real signed-in user profile.

insert into public.businesses (id, name, currency, renewal_window_days)
values ('11111111-1111-1111-1111-111111111111', 'Northstar Creative', 'USD', 30)
on conflict (id) do nothing;

insert into public.departments (business_id, name, accent_color)
values
  ('11111111-1111-1111-1111-111111111111', 'Operations', '#16a34a'),
  ('11111111-1111-1111-1111-111111111111', 'Marketing', '#f59e0b'),
  ('11111111-1111-1111-1111-111111111111', 'Finance', '#2563eb')
on conflict (business_id, name) do nothing;

insert into public.subscription_categories (business_id, name, accent_color, description)
values
  ('11111111-1111-1111-1111-111111111111', 'Communication', '#16a34a', 'Messaging, calling, and meeting platforms'),
  ('11111111-1111-1111-1111-111111111111', 'Marketing', '#f59e0b', 'Campaign and CRM platforms'),
  ('11111111-1111-1111-1111-111111111111', 'Productivity', '#2563eb', 'Collaboration and planning tools'),
  ('11111111-1111-1111-1111-111111111111', 'Hosting', '#ef4444', 'Cloud and infrastructure services')
on conflict (business_id, name) do nothing;
