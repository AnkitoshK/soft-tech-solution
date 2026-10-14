-- Soft Tech Solution database
create extension if not exists pgcrypto;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  service text,
  message text,
  status text not null default 'New' check (status in ('New','Contacted','Qualified','Converted','Closed')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists enquiries_created_at_idx on public.enquiries(created_at desc);
create index if not exists enquiries_status_idx on public.enquiries(status);

alter table public.enquiries enable row level security;
-- Allow anonymous/public visitors to insert enquiries from website
create policy "Allow public lead submissions" on public.enquiries for insert with check (true);
-- Allow service_role full management access
create policy "Allow service_role full access" on public.enquiries for all using (true) with check (true);
