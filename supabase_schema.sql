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

-- ============================================================
-- Training & Course Registrations Table
-- ============================================================
create table if not exists public.course_registrations (
  id text primary key,
  candidate_id text unique not null,
  name text not null,
  contact_number text not null,
  father_name text not null,
  id_type text not null check (id_type in ('AADHAAR', 'PAN')),
  id_number text not null,
  email text not null,
  course text not null default 'Full stack web development course',
  scanned boolean not null default false,
  scanned_at timestamptz,
  scan_lat double precision,
  scan_long double precision,
  scan_count integer not null default 0,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Scanned', 'Verified', 'Completed', 'Cancelled')),
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists course_reg_created_at_idx on public.course_registrations(created_at desc);
create index if not exists course_reg_candidate_id_idx on public.course_registrations(candidate_id);
create index if not exists course_reg_status_idx on public.course_registrations(payment_status);

alter table public.course_registrations enable row level security;
create policy "Allow public course submissions" on public.course_registrations for insert with check (true);
create policy "Allow public course updates" on public.course_registrations for update using (true) with check (true);
create policy "Allow public course select" on public.course_registrations for select using (true);
create policy "Allow service_role full course access" on public.course_registrations for all using (true) with check (true);

-- ============================================================
-- Course QR Scans Audit Log Table
-- ============================================================
create table if not exists public.course_scans (
  id text primary key,
  candidate_id text not null,
  scanned_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  user_agent text,
  ip_address text
);

create index if not exists course_scans_cand_idx on public.course_scans(candidate_id);
create index if not exists course_scans_time_idx on public.course_scans(scanned_at desc);

alter table public.course_scans enable row level security;
create policy "Allow public scan submissions" on public.course_scans for insert with check (true);
create policy "Allow service_role full scans access" on public.course_scans for all using (true) with check (true);

