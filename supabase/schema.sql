-- 오늘도 이상무! DB schema (사양서 v2.0 section 4)
-- 지금 이 슬라이스는 stores.workerPin / ownerPin을 src/lib/dummyData.js에
-- 가상 데이터로 고정해서 씁니다. 관리자 CRUD 슬라이스에서 이 스키마로
-- 실제 Supabase 연동으로 교체하면 됩니다.

create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  store_name text not null,
  worker_pin text not null,
  owner_pin text not null,
  latitude double precision,
  longitude double precision,
  allowed_radius integer not null default 50,
  created_at timestamptz not null default now()
);

create unique index if not exists stores_worker_pin_idx on stores (worker_pin);
create unique index if not exists stores_owner_pin_idx on stores (owner_pin);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  title text not null,
  category text,
  is_photo_required boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists attendance_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  worker_name text not null,
  clock_in_time timestamptz not null default now(),
  clock_out_time timestamptz,
  total_hours double precision
);

create table if not exists closing_logs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores (id) on delete cascade,
  attendance_id uuid references attendance_logs (id) on delete set null,
  worker_name text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists closing_details (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references closing_logs (id) on delete cascade,
  task_id uuid not null references tasks (id) on delete cascade,
  is_completed boolean not null default false,
  photo_url text
);

insert into stores (store_name, worker_pin, owner_pin, allowed_radius)
values ('테스트 매장', '1234', '0000', 50)
on conflict do nothing;
