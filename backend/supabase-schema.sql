-- PixelPost AI — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard → SQL Editor

-- ─── Enable UUID extension ───────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
create table if not exists users (
  id            text primary key,              -- Firebase UID
  email         text unique not null,
  display_name  text,
  photo_url     text,
  provider      text default 'email',          -- 'email' | 'google.com'
  plan          text default 'free',           -- 'free' | 'pro' | 'enterprise'
  preferences   jsonb default '{}'::jsonb,     -- user preferences JSON
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── Generations (History) ───────────────────────────────────────────────────
create table if not exists generations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text not null references users(id) on delete cascade,
  image_url     text not null,
  platforms     text[] not null,               -- e.g. ['facebook', 'instagram']
  model_used    text,
  outputs       jsonb not null,                -- AI-generated posts array
  created_at    timestamptz default now()
);

-- Index for fast user history queries
create index if not exists idx_generations_user_id on generations(user_id, created_at desc);

-- ─── API Keys (Custom user keys, hashed) ─────────────────────────────────────
create table if not exists api_keys (
  id            uuid primary key default uuid_generate_v4(),
  user_id       text not null references users(id) on delete cascade,
  provider      text not null,                 -- 'openai' | 'anthropic'
  key_hash      text not null,                 -- SHA-256 hash of the key
  key_masked    text not null,                 -- e.g. sk-abc...xyz
  created_at    timestamptz default now(),
  unique(user_id, provider)
);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- NOTE: We use service_role key on backend, so RLS is optional but good practice

alter table users enable row level security;
alter table generations enable row level security;
alter table api_keys enable row level security;

-- Service role bypasses RLS automatically, so backend works fine.
-- Frontend (if ever directly querying) would need policies.

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on users
  for each row execute function update_updated_at();
