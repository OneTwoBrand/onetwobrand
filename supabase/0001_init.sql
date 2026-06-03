-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Supabase schema
-- ════════════════════════════════════════════════════════════════════
-- Versão inicial. Cole em supabase/migrations/0001_init.sql.
-- Pressupõe Supabase com extensão pgcrypto + auth schema padrão.
-- ────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────
-- ENUMs
-- ────────────────────────────────────────────────────────────────────
create type op_status as enum (
  'Aberta',
  'Aguardando Material',
  'Em Produção',
  'Em Bordagem',
  'Em Revisão',
  'Finalizada',
  'Vendida',
  'Entregue'
);

create type seamstress_role as enum (
  'Costureira-chefe',
  'Costureira',
  'Bordadeira',
  'Atelier · QA'
);

create type shipment_status as enum ('Em Bordagem', 'Finalizada');

create type sale_status as enum ('pending', 'paid', 'cancelled');

create type payment_method as enum ('pix', 'card', 'cash', 'transfer');

create type op_history_type as enum (
  'Corte', 'Costura', 'Bordagem', 'Revisão', 'Entrega', 'Sistema', 'Observação'
);

create type payable_status as enum ('pending', 'paid', 'overdue');

create type ai_feature as enum ('chat', 'fill', 'summarize', 'voice', 'analysis');

create type ai_operation_result as enum ('success', 'insufficient_data', 'error');

-- ────────────────────────────────────────────────────────────────────
-- profiles — extende auth.users
-- ────────────────────────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  role          text not null default 'admin',  -- admin | atelier | viewer
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- trigger to insert profile when user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────
-- clients
-- ────────────────────────────────────────────────────────────────────
create table public.clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  city          text,
  state         char(2),
  phone         text,
  email         text,
  vip           boolean not null default false,
  notes         text,
  total_pieces  integer not null default 0,
  total_spent   numeric(12,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_clients_name on public.clients using gin (to_tsvector('portuguese', name));
create index idx_clients_vip on public.clients (vip) where vip = true;

-- ────────────────────────────────────────────────────────────────────
-- pieces — catálogo de peças
-- ────────────────────────────────────────────────────────────────────
create table public.pieces (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  fabric        text,
  color         text,
  sizes         text[] not null default '{}',   -- ex: '{P,M,G}'
  price         numeric(10,2) not null,
  photo_url     text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────
-- stock_items — saldo por SKU (peça + tamanho)
-- ────────────────────────────────────────────────────────────────────
create table public.stock_items (
  id              uuid primary key default gen_random_uuid(),
  piece_id        uuid not null references public.pieces(id) on delete cascade,
  size            text not null,
  color           text,
  quantity        integer not null default 0 check (quantity >= 0),
  low_threshold   integer not null default 3,
  updated_at      timestamptz not null default now(),
  unique (piece_id, size, color)
);
create index idx_stock_low on public.stock_items (piece_id) where quantity <= low_threshold;

-- ────────────────────────────────────────────────────────────────────
-- seamstresses
-- ────────────────────────────────────────────────────────────────────
create table public.seamstresses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  role            seamstress_role not null,
  phone           text,
  avg_lead_days   integer,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────
-- production_orders
-- ────────────────────────────────────────────────────────────────────
create table public.production_orders (
  id                uuid primary key default gen_random_uuid(),
  op_number         text not null unique,        -- "0241"
  client_id         uuid not null references public.clients(id) on delete restrict,
  piece_id          uuid not null references public.pieces(id) on delete restrict,
  qty               integer not null check (qty > 0),
  seamstress_id     uuid references public.seamstresses(id) on delete set null,
  due_date          date not null,
  status            op_status not null default 'Aberta',
  fabric_used       text,
  embroidery_notes  text,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index idx_op_status on public.production_orders (status);
create index idx_op_due on public.production_orders (due_date) where status not in ('Finalizada', 'Vendida', 'Entregue');

-- auto-generate next OP number (0001, 0002, ...)
create sequence if not exists op_number_seq start 240;

create or replace function public.next_op_number()
returns text language sql as $$
  select lpad(nextval('op_number_seq')::text, 4, '0');
$$;

-- ────────────────────────────────────────────────────────────────────
-- op_history — feed de eventos por OP
-- ────────────────────────────────────────────────────────────────────
create table public.op_history (
  id          uuid primary key default gen_random_uuid(),
  op_id       uuid not null references public.production_orders(id) on delete cascade,
  actor_id    uuid references public.profiles(id),     -- null = system
  type        op_history_type not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index idx_op_history_op on public.op_history (op_id, created_at desc);

-- trigger: ao mudar status, insere história
create or replace function public.log_op_status_change()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.op_history (op_id, type, note)
    values (new.id, 'Sistema', 'Status alterado: ' || old.status::text || ' → ' || new.status::text);
  end if;
  return new;
end;
$$;

create trigger trg_log_op_status_change
  after update on public.production_orders
  for each row execute function public.log_op_status_change();

-- ────────────────────────────────────────────────────────────────────
-- op_attachments
-- ────────────────────────────────────────────────────────────────────
create table public.op_attachments (
  id          uuid primary key default gen_random_uuid(),
  op_id       uuid not null references public.production_orders(id) on delete cascade,
  url         text not null,
  filename    text,
  mime_type   text,
  uploaded_by uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────
-- embroidery_shipments — remessas externas
-- ────────────────────────────────────────────────────────────────────
create table public.embroidery_shipments (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique,        -- "BD-118"
  seamstress_id       uuid not null references public.seamstresses(id) on delete restrict,
  sent_at             date not null,
  expected_return_at  date not null,
  returned_at         date,
  qty                 integer not null check (qty > 0),
  status              shipment_status not null default 'Em Bordagem',
  notes               text,
  created_at          timestamptz not null default now()
);
create index idx_shipments_active on public.embroidery_shipments (status) where status = 'Em Bordagem';

-- relaciona OPs a remessas (uma OP pode estar em uma remessa)
create table public.shipment_items (
  shipment_id   uuid not null references public.embroidery_shipments(id) on delete cascade,
  op_id         uuid not null references public.production_orders(id) on delete cascade,
  primary key (shipment_id, op_id)
);

-- ────────────────────────────────────────────────────────────────────
-- sales + sale_items
-- ────────────────────────────────────────────────────────────────────
create table public.sales (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete restrict,
  total             numeric(12,2) not null check (total >= 0),
  discount          numeric(12,2) not null default 0,
  shipping          numeric(12,2) not null default 0,
  payment_method    payment_method not null,
  status            sale_status not null default 'pending',
  notes             text,
  sold_by           uuid references public.profiles(id),
  created_at        timestamptz not null default now(),
  paid_at           timestamptz
);
create index idx_sales_client on public.sales (client_id, created_at desc);
create index idx_sales_status on public.sales (status);

create table public.sale_items (
  id            uuid primary key default gen_random_uuid(),
  sale_id       uuid not null references public.sales(id) on delete cascade,
  piece_id      uuid not null references public.pieces(id) on delete restrict,
  size          text not null,
  qty           integer not null check (qty > 0),
  unit_price    numeric(10,2) not null
);
create index idx_sale_items_sale on public.sale_items (sale_id);

-- trigger: ao confirmar venda, decrementar estoque + atualizar totais do cliente
create or replace function public.apply_sale_side_effects()
returns trigger language plpgsql as $$
declare
  item record;
begin
  if (tg_op = 'UPDATE' and new.status = 'paid' and old.status <> 'paid') then
    for item in select * from public.sale_items where sale_id = new.id loop
      update public.stock_items
        set quantity = greatest(0, quantity - item.qty), updated_at = now()
       where piece_id = item.piece_id and size = item.size;
    end loop;

    update public.clients
       set total_pieces = total_pieces + (select coalesce(sum(qty),0) from public.sale_items where sale_id = new.id),
           total_spent  = total_spent + new.total,
           updated_at   = now()
     where id = new.client_id;

    new.paid_at = now();
  end if;
  return new;
end;
$$;

create trigger trg_sale_paid
  before update on public.sales
  for each row execute function public.apply_sale_side_effects();

-- ────────────────────────────────────────────────────────────────────
-- payables / receivables
-- ────────────────────────────────────────────────────────────────────
create table public.payables (
  id          uuid primary key default gen_random_uuid(),
  supplier    text not null,
  category    text,                   -- "fornecedor", "aluguel", "bordagem"...
  amount      numeric(12,2) not null check (amount >= 0),
  due_date    date not null,
  paid_at     date,
  status      payable_status not null default 'pending',
  notes       text,
  created_at  timestamptz not null default now()
);
create index idx_payables_due on public.payables (due_date) where status = 'pending';

create table public.receivables (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  sale_id     uuid references public.sales(id) on delete set null,
  amount      numeric(12,2) not null check (amount >= 0),
  due_date    date not null,
  received_at date,
  status      payable_status not null default 'pending',
  created_at  timestamptz not null default now()
);
create index idx_receivables_due on public.receivables (due_date) where status = 'pending';

-- ────────────────────────────────────────────────────────────────────
-- ai_usage_logs — auditoria futura do OneTwo Assistant
-- ────────────────────────────────────────────────────────────────────
create table public.ai_usage_logs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id) on delete set null,
  feature            ai_feature not null,
  calls              integer not null default 1 check (calls > 0),
  input_tokens       integer check (input_tokens is null or input_tokens >= 0),
  output_tokens      integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost     numeric(12,6) check (estimated_cost is null or estimated_cost >= 0),
  result             ai_operation_result not null,
  operation_summary  text,
  created_at         timestamptz not null default now()
);
create index idx_ai_usage_logs_user on public.ai_usage_logs (user_id, created_at desc);
create index idx_ai_usage_logs_feature on public.ai_usage_logs (feature, created_at desc);

-- ════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ════════════════════════════════════════════════════════════════════
-- Por enquanto: qualquer usuário autenticado pode CRUD em tudo
-- (refine conforme roles na profiles.role).
-- ────────────────────────────────────────────────────────────────────

alter table public.profiles              enable row level security;
alter table public.clients                enable row level security;
alter table public.pieces                 enable row level security;
alter table public.stock_items            enable row level security;
alter table public.seamstresses           enable row level security;
alter table public.production_orders      enable row level security;
alter table public.op_history             enable row level security;
alter table public.op_attachments         enable row level security;
alter table public.embroidery_shipments   enable row level security;
alter table public.shipment_items         enable row level security;
alter table public.sales                  enable row level security;
alter table public.sale_items             enable row level security;
alter table public.payables               enable row level security;
alter table public.receivables            enable row level security;
alter table public.ai_usage_logs          enable row level security;

-- Helper: every authenticated user has full access (atelier is single-tenant)
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','clients','pieces','stock_items','seamstresses',
    'production_orders','op_history','op_attachments',
    'embroidery_shipments','shipment_items',
    'sales','sale_items','payables','receivables','ai_usage_logs'
  ]) loop
    execute format('create policy "authed read"  on public.%I for select  using (auth.role() = ''authenticated'')', t);
    execute format('create policy "authed write" on public.%I for insert with check (auth.role() = ''authenticated'')', t);
    execute format('create policy "authed update" on public.%I for update using (auth.role() = ''authenticated'')', t);
    execute format('create policy "authed delete" on public.%I for delete using (auth.role() = ''authenticated'')', t);
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- Views agregadas (para dashboard / relatórios)
-- ════════════════════════════════════════════════════════════════════

create or replace view public.v_dashboard_kpis as
select
  (select count(*) from public.production_orders where status = 'Em Produção')                       as in_production,
  (select count(*) from public.production_orders where status = 'Em Bordagem')                       as in_embroidery,
  (select coalesce(sum(quantity), 0) from public.stock_items)                                        as stock_total,
  (select count(*) from public.sales where status = 'pending')                                       as pending_orders,
  (select coalesce(sum(total), 0) from public.sales
    where status = 'paid' and created_at >= date_trunc('month', now()))                              as revenue_month,
  (select coalesce(sum(amount), 0) from public.receivables where status = 'pending')                 as to_receive,
  (select coalesce(sum(amount), 0) from public.payables    where status = 'pending')                 as to_pay;

create or replace view public.v_top_pieces as
select
  p.id, p.name,
  sum(si.qty) as units_sold,
  sum(si.qty * si.unit_price) as gross
from public.sale_items si
join public.sales s on s.id = si.sale_id and s.status = 'paid'
join public.pieces p on p.id = si.piece_id
where s.created_at >= now() - interval '30 days'
group by p.id, p.name
order by units_sold desc;
