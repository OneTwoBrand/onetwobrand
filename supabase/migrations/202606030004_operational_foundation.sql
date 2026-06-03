-- ONE TWO — Sprint 1 operational foundation
-- Incremental/idempotent expansion for dashboard, products, stock,
-- finance, seamstresses, embroidery and reports.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'stock_movement_type') then
    create type public.stock_movement_type as enum (
      'entrada',
      'saida',
      'ajuste',
      'producao',
      'venda'
    );
  end if;
end $$;

do $$
begin
  alter type public.payment_method add value if not exists 'debit';
  alter type public.payment_method add value if not exists 'credit';
  alter type public.payment_method add value if not exists 'installment';
exception
  when undefined_object then null;
end $$;

create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  category    text,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.pieces
  add column if not exists collection_id uuid references public.collections(id) on delete set null,
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists cost_price numeric(10,2) not null default 0,
  add column if not exists back_photo_url text,
  add column if not exists detail_photo_url text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.seamstresses
  add column if not exists pix text,
  add column if not exists address text,
  add column if not exists specialty text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.embroidery_shipments
  add column if not exists embroidery_type text,
  add column if not exists value numeric(12,2) not null default 0,
  add column if not exists paid_at date,
  add column if not exists updated_at timestamptz not null default now();

alter table public.payables
  add column if not exists reference_type text,
  add column if not exists reference_id uuid,
  add column if not exists updated_at timestamptz not null default now();

alter table public.receivables
  add column if not exists reference_type text,
  add column if not exists reference_id uuid,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.stock_movements (
  id              uuid primary key default gen_random_uuid(),
  stock_item_id   uuid references public.stock_items(id) on delete set null,
  piece_id        uuid not null references public.pieces(id) on delete restrict,
  size            text not null,
  color           text,
  type            public.stock_movement_type not null,
  qty             integer not null check (qty > 0),
  previous_qty    integer,
  resulting_qty   integer,
  reference_type  text,
  reference_id    uuid,
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_collections_active on public.collections(active);
create index if not exists idx_pieces_collection on public.pieces(collection_id);
create index if not exists idx_pieces_category on public.pieces(category);
create index if not exists idx_stock_movements_piece on public.stock_movements(piece_id, created_at desc);
create index if not exists idx_stock_movements_type on public.stock_movements(type, created_at desc);
create index if not exists idx_shipments_return on public.embroidery_shipments(expected_return_at)
  where status = 'Em Bordagem';

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_collections_updated_at') then
    create trigger trg_collections_updated_at
      before update on public.collections
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_pieces_updated_at') then
    create trigger trg_pieces_updated_at
      before update on public.pieces
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_seamstresses_updated_at') then
    create trigger trg_seamstresses_updated_at
      before update on public.seamstresses
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_shipments_updated_at') then
    create trigger trg_shipments_updated_at
      before update on public.embroidery_shipments
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_payables_updated_at') then
    create trigger trg_payables_updated_at
      before update on public.payables
      for each row execute function public.touch_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_receivables_updated_at') then
    create trigger trg_receivables_updated_at
      before update on public.receivables
      for each row execute function public.touch_updated_at();
  end if;
end $$;

create or replace function public.apply_sale_side_effects()
returns trigger language plpgsql as $$
declare
  item record;
  current_stock public.stock_items%rowtype;
  movement_type public.stock_movement_type := 'venda';
begin
  if (tg_op = 'UPDATE' and new.status = 'paid' and old.status <> 'paid') then
    for item in select * from public.sale_items where sale_id = new.id loop
      current_stock := null;

      select *
        into current_stock
        from public.stock_items
       where piece_id = item.piece_id
         and size = item.size
       order by updated_at desc
       limit 1;

      if current_stock.id is not null then
        update public.stock_items
           set quantity = greatest(0, quantity - item.qty),
               updated_at = now()
         where id = current_stock.id;

        insert into public.stock_movements (
          stock_item_id,
          piece_id,
          size,
          color,
          type,
          qty,
          previous_qty,
          resulting_qty,
          reference_type,
          reference_id,
          notes,
          created_by
        ) values (
          current_stock.id,
          item.piece_id,
          item.size,
          current_stock.color,
          movement_type,
          item.qty,
          current_stock.quantity,
          greatest(0, current_stock.quantity - item.qty),
          'sale',
          new.id,
          'Baixa automatica por venda paga',
          new.sold_by
        );
      end if;
    end loop;

    update public.clients
       set total_pieces = total_pieces + (
             select coalesce(sum(qty), 0)
               from public.sale_items
              where sale_id = new.id
           ),
           total_spent = total_spent + new.total,
           updated_at = now()
     where id = new.client_id;

    insert into public.receivables (
      client_id,
      sale_id,
      amount,
      due_date,
      received_at,
      status,
      reference_type,
      reference_id
    ) values (
      new.client_id,
      new.id,
      new.total,
      current_date,
      current_date,
      'paid',
      'sale',
      new.id
    )
    on conflict do nothing;

    new.paid_at = coalesce(new.paid_at, now());
  end if;

  return new;
end;
$$;

create or replace function public.create_payable_for_finished_embroidery()
returns trigger language plpgsql as $$
declare
  seamstress_name text;
begin
  if (
    tg_op = 'UPDATE'
    and new.status = 'Finalizada'
    and old.status <> 'Finalizada'
    and coalesce(new.value, 0) > 0
  ) then
    select name into seamstress_name
      from public.seamstresses
     where id = new.seamstress_id;

    insert into public.payables (
      supplier,
      category,
      amount,
      due_date,
      reference_type,
      reference_id,
      notes
    ) values (
      coalesce(seamstress_name, 'Bordadeira'),
      'bordagem',
      new.value,
      current_date,
      'embroidery_shipment',
      new.id,
      'Pagamento gerado automaticamente ao finalizar remessa'
    );
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_finished_embroidery_payable') then
    create trigger trg_finished_embroidery_payable
      after update on public.embroidery_shipments
      for each row execute function public.create_payable_for_finished_embroidery();
  end if;
end $$;

alter table public.collections enable row level security;
alter table public.stock_movements enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['collections', 'stock_movements']) loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'authed read'
    ) then
      execute format('create policy "authed read" on public.%I for select using (auth.role() = ''authenticated'')', t);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'authed write'
    ) then
      execute format('create policy "authed write" on public.%I for insert with check (auth.role() = ''authenticated'')', t);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'authed update'
    ) then
      execute format('create policy "authed update" on public.%I for update using (auth.role() = ''authenticated'')', t);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'authed delete'
    ) then
      execute format('create policy "authed delete" on public.%I for delete using (auth.role() = ''authenticated'')', t);
    end if;
  end loop;
end $$;

create or replace view public.v_dashboard_kpis as
select
  (select count(*) from public.production_orders where status = 'Em Produção') as in_production,
  (select count(*) from public.production_orders where status = 'Em Bordagem') as in_embroidery,
  (select coalesce(sum(quantity), 0) from public.stock_items) as stock_total,
  (select count(*) from public.sales where status = 'pending') as pending_orders,
  (select coalesce(sum(total), 0) from public.sales
    where status = 'paid' and created_at >= date_trunc('month', now())) as revenue_month,
  (select coalesce(sum(amount), 0) from public.receivables where status = 'pending') as to_receive,
  (select coalesce(sum(amount), 0) from public.payables where status = 'pending') as to_pay,
  (select coalesce(sum((si.unit_price - coalesce(p.cost_price, 0)) * si.qty), 0)
     from public.sale_items si
     join public.sales s on s.id = si.sale_id and s.status = 'paid'
     join public.pieces p on p.id = si.piece_id
    where s.created_at >= date_trunc('month', now())) as gross_profit_month,
  (
    (select coalesce(sum((si.unit_price - coalesce(p.cost_price, 0)) * si.qty), 0)
       from public.sale_items si
       join public.sales s on s.id = si.sale_id and s.status = 'paid'
       join public.pieces p on p.id = si.piece_id
      where s.created_at >= date_trunc('month', now()))
    -
    (select coalesce(sum(amount), 0)
       from public.payables
      where status = 'paid'
        and coalesce(paid_at, created_at::date) >= date_trunc('month', now())::date)
  ) as net_profit_month,
  (select count(*) from public.production_orders
    where due_date < current_date
      and status not in ('Finalizada', 'Vendida', 'Entregue')) as overdue_ops,
  (select count(*) from public.stock_items where quantity <= low_threshold) as low_stock_skus;

create or replace view public.v_stock_low as
select
  si.id,
  si.piece_id,
  p.name,
  p.category,
  p.collection_id,
  c.name as collection_name,
  si.size,
  si.color,
  si.quantity,
  si.low_threshold,
  p.price,
  p.cost_price
from public.stock_items si
join public.pieces p on p.id = si.piece_id
left join public.collections c on c.id = p.collection_id
where si.quantity <= si.low_threshold
order by si.quantity asc, p.name asc;

create or replace view public.v_sales_report_month as
select
  s.id,
  s.created_at,
  s.status,
  s.payment_method,
  s.total,
  s.discount,
  s.shipping,
  c.name as client_name,
  coalesce(sum(si.qty), 0) as pieces_qty,
  coalesce(sum((si.unit_price - coalesce(p.cost_price, 0)) * si.qty), 0) as gross_profit
from public.sales s
join public.clients c on c.id = s.client_id
left join public.sale_items si on si.sale_id = s.id
left join public.pieces p on p.id = si.piece_id
where s.created_at >= date_trunc('month', now())
group by s.id, c.name
order by s.created_at desc;

create or replace view public.v_financial_summary as
select
  (select coalesce(sum(total), 0) from public.sales
    where status = 'paid' and created_at >= date_trunc('month', now())) as revenue_month,
  (select coalesce(sum(amount), 0) from public.receivables where status = 'pending') as to_receive,
  (select coalesce(sum(amount), 0) from public.payables where status = 'pending') as to_pay,
  (select coalesce(sum(amount), 0) from public.payables
    where status = 'paid' and coalesce(paid_at, created_at::date) >= date_trunc('month', now())::date) as expenses_paid_month,
  (select coalesce(sum((si.unit_price - coalesce(p.cost_price, 0)) * si.qty), 0)
     from public.sale_items si
     join public.sales s on s.id = si.sale_id and s.status = 'paid'
     join public.pieces p on p.id = si.piece_id
    where s.created_at >= date_trunc('month', now())) as gross_profit_month;

create or replace view public.v_production_report as
select
  po.id,
  po.op_number,
  po.status,
  po.qty,
  po.due_date,
  po.created_at,
  po.due_date < current_date
    and po.status not in ('Finalizada', 'Vendida', 'Entregue') as overdue,
  c.name as client_name,
  p.name as piece_name,
  s.name as seamstress_name
from public.production_orders po
join public.clients c on c.id = po.client_id
join public.pieces p on p.id = po.piece_id
left join public.seamstresses s on s.id = po.seamstress_id
order by po.due_date asc;

create or replace view public.v_embroidery_report as
select
  es.id,
  es.code,
  es.status,
  es.qty,
  es.value,
  es.sent_at,
  es.expected_return_at,
  es.returned_at,
  es.expected_return_at < current_date
    and es.status = 'Em Bordagem' as overdue,
  s.name as seamstress_name,
  s.pix as seamstress_pix
from public.embroidery_shipments es
join public.seamstresses s on s.id = es.seamstress_id
order by es.expected_return_at asc;

create or replace view public.v_top_pieces as
select
  p.id,
  p.name,
  coalesce(sum(si.qty) filter (where s.id is not null), 0) as units_sold,
  coalesce(sum(si.qty * si.unit_price) filter (where s.id is not null), 0) as gross
from public.pieces p
left join public.sale_items si on si.piece_id = p.id
left join public.sales s on s.id = si.sale_id
  and s.status = 'paid'
  and s.created_at >= now() - interval '30 days'
group by p.id, p.name
order by units_sold desc, p.name asc;
