create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('parent', 'caregiver', 'admin');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.caregiver_role as enum ('owner', 'caregiver');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.feeding_type as enum ('breast', 'bottle', 'solid');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.diaper_type as enum ('wet', 'dry', 'both');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.health_type as enum ('symptom', 'medication', 'doctor', 'vaccination');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.invite_status as enum ('pending', 'accepted', 'declined');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.app_users (
  firebase_uid text primary key,
  email text not null unique,
  display_name text,
  photo_url text,
  role public.app_role not null default 'parent',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_firebase_uid text not null references public.app_users(firebase_uid) on delete cascade,
  name text not null,
  birth_date date not null,
  notes text,
  photo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.child_caregivers (
  child_id uuid not null references public.children(id) on delete cascade,
  caregiver_firebase_uid text not null references public.app_users(firebase_uid) on delete cascade,
  role public.caregiver_role not null default 'caregiver',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (child_id, caregiver_firebase_uid)
);

create table if not exists public.feedings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  logged_by_firebase_uid text not null references public.app_users(firebase_uid) on delete restrict,
  occurred_at timestamptz not null,
  type public.feeding_type not null,
  amount numeric(10,2),
  unit text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sleeps (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  logged_by_firebase_uid text not null references public.app_users(firebase_uid) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.diapers (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  logged_by_firebase_uid text not null references public.app_users(firebase_uid) on delete restrict,
  occurred_at timestamptz not null,
  type public.diaper_type not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  logged_by_firebase_uid text not null references public.app_users(firebase_uid) on delete restrict,
  occurred_at timestamptz not null,
  type public.health_type not null,
  title text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  inviter_firebase_uid text not null references public.app_users(firebase_uid) on delete cascade,
  inviter_email text not null,
  invitee_email text not null,
  status public.invite_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  unique (child_id, invitee_email)
);

create index if not exists idx_children_owner_firebase_uid
  on public.children(owner_firebase_uid);

create index if not exists idx_child_caregivers_caregiver_firebase_uid
  on public.child_caregivers(caregiver_firebase_uid);

create index if not exists idx_feedings_child_occurred_at
  on public.feedings(child_id, occurred_at desc);

create index if not exists idx_sleeps_child_start_time
  on public.sleeps(child_id, start_time desc);

create index if not exists idx_diapers_child_occurred_at
  on public.diapers(child_id, occurred_at desc);

create index if not exists idx_health_logs_child_occurred_at
  on public.health_logs(child_id, occurred_at desc);

create index if not exists idx_invites_child_status
  on public.invites(child_id, status, created_at desc);

create index if not exists idx_invites_invitee_email
  on public.invites(invitee_email);

drop trigger if exists set_app_users_updated_at on public.app_users;
create trigger set_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists set_children_updated_at on public.children;
create trigger set_children_updated_at
before update on public.children
for each row
execute function public.set_updated_at();

drop trigger if exists set_invites_updated_at on public.invites;
create trigger set_invites_updated_at
before update on public.invites
for each row
execute function public.set_updated_at();

alter table public.app_users enable row level security;
alter table public.children enable row level security;
alter table public.child_caregivers enable row level security;
alter table public.feedings enable row level security;
alter table public.sleeps enable row level security;
alter table public.diapers enable row level security;
alter table public.health_logs enable row level security;
alter table public.invites enable row level security;

comment on table public.app_users is 'Application users mapped from Firebase Authentication users.';
comment on table public.children is 'Child profiles owned by a Firebase-authenticated parent.';
comment on table public.child_caregivers is 'Many-to-many membership table for child caregiver access.';
comment on table public.feedings is 'Feeding logs for the active TinySteps scope.';
comment on table public.sleeps is 'Sleep logs for naps and bedtime tracking.';
comment on table public.diapers is 'Diaper change logs.';
comment on table public.health_logs is 'Health notes such as symptoms, medication, and doctor visits.';
comment on table public.invites is 'Caregiver invitations managed by backend APIs.';
