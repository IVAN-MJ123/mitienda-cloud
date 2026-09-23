-- ============================================================
-- MiTienda Cloud - Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Tabla de usuarios (extiende auth.users de Supabase)
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre_negocio text,
  licencia text not null default 'basica' check (licencia in ('basica', 'premium')),
  creado_en timestamptz default now()
);

-- Tabla de productos
create table productos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete cascade,
  nombre text not null,
  codigo_barras text,
  precio numeric not null default 0,
  costo numeric default 0,
  stock numeric not null default 0,
  unidad text not null default 'Unidad', -- Unidad, Libra, Kilo, Caja
  creado_en timestamptz default now()
);
create index idx_productos_usuario on productos(usuario_id);
create index idx_productos_codigo on productos(codigo_barras);

-- Tabla de clientes (para fiados)
create table clientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete cascade,
  nombre text not null,
  telefono text,
  saldo_pendiente numeric not null default 0,
  creado_en timestamptz default now()
);
create index idx_clientes_usuario on clientes(usuario_id);

-- Tabla de ventas (encabezado)
create table ventas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references usuarios(id) on delete cascade,
  cliente_id uuid references clientes(id),
  total numeric not null default 0,
  metodo_pago text not null default 'efectivo' check (metodo_pago in ('efectivo', 'fiado')),
  fecha timestamptz default now()
);
create index idx_ventas_usuario_fecha on ventas(usuario_id, fecha);

-- Detalle de cada venta (líneas de productos vendidos)
create table detalle_ventas (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid references ventas(id) on delete cascade,
  producto_id uuid references productos(id),
  cantidad numeric not null,
  precio_unitario numeric not null
);

-- Abonos a cuentas fiadas
create table abonos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  usuario_id uuid references usuarios(id) on delete cascade,
  monto numeric not null,
  fecha timestamptz default now()
);

-- ============================================================
-- Función RPC: incrementa el saldo pendiente de un cliente
-- (se usa al confirmar una venta fiada)
-- ============================================================
create or replace function incrementar_fiado(p_cliente_id uuid, p_monto numeric)
returns void as $$
begin
  update clientes set saldo_pendiente = saldo_pendiente + p_monto where id = p_cliente_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Vista: productos más vendidos (para el módulo de Informes)
-- ============================================================
create view vista_productos_mas_vendidos as
select
  v.usuario_id,
  p.id as producto_id,
  p.nombre,
  sum(dv.cantidad) as cantidad_vendida
from detalle_ventas dv
join ventas v on v.id = dv.venta_id
join productos p on p.id = dv.producto_id
group by v.usuario_id, p.id, p.nombre
order by cantidad_vendida desc;

-- ============================================================
-- Row Level Security (RLS): cada usuario solo ve sus propios datos
-- ============================================================
alter table usuarios enable row level security;
alter table productos enable row level security;
alter table clientes enable row level security;
alter table ventas enable row level security;
alter table detalle_ventas enable row level security;
alter table abonos enable row level security;

create policy "usuarios ven su propio perfil" on usuarios for select using (auth.uid() = id);
create policy "usuarios actualizan su propio perfil" on usuarios for update using (auth.uid() = id);
create policy "usuarios insertan su propio perfil" on usuarios for insert with check (auth.uid() = id);

create policy "productos propios" on productos for all using (auth.uid() = usuario_id);
create policy "clientes propios" on clientes for all using (auth.uid() = usuario_id);
create policy "ventas propias" on ventas for all using (auth.uid() = usuario_id);
create policy "abonos propios" on abonos for all using (auth.uid() = usuario_id);

create policy "detalle de ventas propias" on detalle_ventas for all using (
  exists (select 1 from ventas v where v.id = detalle_ventas.venta_id and v.usuario_id = auth.uid())
);
