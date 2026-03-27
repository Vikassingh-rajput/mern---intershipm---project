create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  role text not null default 'cashier' check (role in ('admin', 'cashier')),
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique not null,
  barcode text unique,
  price numeric(12, 2) not null default 0,
  cost numeric(12, 2) not null default 0,
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  category_id uuid references public.categories(id) on delete set null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  change_type text not null check (change_type in ('sale', 'purchase', 'manual')),
  quantity_change integer not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid not null references public.users(id),
  subtotal numeric(12, 2) not null,
  discount_type text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  created_at timestamptz default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  cost_price numeric(12, 2) not null,
  line_total numeric(12, 2) not null,
  created_at timestamptz default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'ordered', 'received')),
  created_by uuid references public.users(id),
  received_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null,
  unit_cost numeric(12, 2) not null default 0,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

create or replace function public.current_role()
returns text
language sql
stable
as $$
  select coalesce((select role from public.users where id = auth.uid()), 'cashier');
$$;

create policy "admin users all" on public.users for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin categories all" on public.categories for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin suppliers all" on public.suppliers for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin products all" on public.products for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin inventory logs all" on public.inventory_logs for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin sales all" on public.sales for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin sale items all" on public.sale_items for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin po all" on public.purchase_orders for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "admin po items all" on public.purchase_order_items for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy "cashier read products" on public.products for select using (public.current_role() in ('admin', 'cashier'));
create policy "cashier update products" on public.products for update using (public.current_role() in ('admin', 'cashier')) with check (public.current_role() in ('admin', 'cashier'));
create policy "cashier insert sales" on public.sales for insert with check (auth.uid() = cashier_id and public.current_role() in ('admin', 'cashier'));
create policy "cashier read sales" on public.sales for select using (public.current_role() = 'admin' or cashier_id = auth.uid());
create policy "cashier insert sale items" on public.sale_items for insert with check (public.current_role() in ('admin', 'cashier'));
create policy "cashier read sale items" on public.sale_items for select using (public.current_role() in ('admin', 'cashier'));
create policy "cashier inventory logs insert" on public.inventory_logs for insert with check (public.current_role() in ('admin', 'cashier'));
create policy "cashier inventory logs read" on public.inventory_logs for select using (public.current_role() in ('admin', 'cashier'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.users(id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'role', 'cashier'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
