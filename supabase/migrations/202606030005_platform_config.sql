-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Platform configuration table
-- Stores encrypted platform-wide settings (e.g. OpenAI API key).
-- Only users with role='admin' in profiles can read/write.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.platform_config (
  key        text primary key,
  value_enc  text not null,              -- AES-256 encrypted via pgcrypto
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.platform_config enable row level security;

-- Only admins can read
create policy "admin read config"
  on public.platform_config for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can insert
create policy "admin insert config"
  on public.platform_config for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update
create policy "admin update config"
  on public.platform_config for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
