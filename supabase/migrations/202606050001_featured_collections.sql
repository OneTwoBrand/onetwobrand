-- ONE TWO — Featured collections for shop home
-- Allows multiple published collections to appear in the burgundy home spotlight.

alter table public.collections
  add column if not exists featured boolean not null default false,
  add column if not exists featured_order integer not null default 0;

create index if not exists idx_collections_featured_order
  on public.collections (featured, featured_order, sort_order)
  where published_at is not null;

with first_published_collection as (
  select id
  from public.collections
  where published_at is not null
  order by sort_order asc, name asc
  limit 1
)
update public.collections c
set featured = true,
    featured_order = 1
from first_published_collection f
where c.id = f.id
  and not exists (
    select 1
    from public.collections existing
    where existing.published_at is not null
      and existing.featured = true
  );
