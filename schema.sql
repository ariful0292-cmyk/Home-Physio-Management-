-- Supabase database for Home Physio Management
-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.therapists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  phone text,
  specialization text,
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  phone text,
  age int,
  gender text,
  address text,
  diagnosis text,
  referred_by text,
  emergency_contact text,
  treatment_plan text,
  created_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete restrict,
  visit_date timestamptz not null,
  fee numeric(12,2) not null default 0,
  paid numeric(12,2) not null default 0,
  status text not null default 'Scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  payment_date date not null default current_date,
  amount numeric(12,2) not null check(amount > 0),
  method text not null default 'Cash',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.treatment_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table public.therapists enable row level security;
alter table public.patients enable row level security;
alter table public.visits enable row level security;
alter table public.payments enable row level security;
alter table public.treatment_notes enable row level security;

drop policy if exists therapists_all on public.therapists;
drop policy if exists patients_all on public.patients;
drop policy if exists visits_all on public.visits;
drop policy if exists payments_all on public.payments;
drop policy if exists notes_all on public.treatment_notes;

create policy therapists_all on public.therapists for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy patients_all on public.patients for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy visits_all on public.visits for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy payments_all on public.payments for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy notes_all on public.treatment_notes for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- Starter therapists: after creating your Supabase user, run these.
-- insert into public.therapists(name,specialization) values
-- ('Md Ariful Islam PT','Physiotherapy'),
-- ('Most. Sargina Akter PT','Physiotherapy');
