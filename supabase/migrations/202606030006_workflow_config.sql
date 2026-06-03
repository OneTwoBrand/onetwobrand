-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Workflow configuration table
-- Stores configurable lists: OP statuses, production steps,
-- payment methods, seamstress roles.
-- Read: any authenticated user (components need the values).
-- Write: admin only.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.workflow_config (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

alter table public.workflow_config enable row level security;

-- Any authenticated user can read (status lists needed in all components)
create policy "authenticated read workflow_config"
  on public.workflow_config for select
  using (auth.uid() is not null);

-- Only admins can insert
create policy "admin insert workflow_config"
  on public.workflow_config for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can update
create policy "admin update workflow_config"
  on public.workflow_config for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
