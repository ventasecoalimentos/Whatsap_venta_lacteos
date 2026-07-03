create table clientes (
  id                 uuid primary key default gen_random_uuid(),
  telefono           text unique not null,
  nombre             text,
  ciudad             text,
  fecha_registro     timestamptz default now(),
  ultima_interaccion timestamptz
);

create table conversaciones (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete cascade,
  estado_actual   text not null default 'INICIO',
  contexto        jsonb not null default '{}',
  iniciada_en     timestamptz default now(),
  actualizada_en  timestamptz default now()
);

create table pedidos (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid references clientes(id) on delete cascade,
  producto_interes text,
  ciudad           text,
  creado_en        timestamptz default now()
);

create table mensajes (
  id               uuid primary key default gen_random_uuid(),
  conversacion_id  uuid references conversaciones(id) on delete cascade,
  direccion        text not null check (direccion in ('in', 'out')),
  contenido        text,
  timestamp        timestamptz default now()
);

-- Índices
create unique index on conversaciones (cliente_id); -- una sola conversación por cliente (upsert), ya cubre búsquedas por cliente_id
create index on conversaciones (actualizada_en); -- soporta el chequeo de reinicio por inactividad
create index on pedidos (cliente_id);
create index on mensajes (conversacion_id);
