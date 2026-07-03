# Modelo de datos (Supabase / PostgreSQL)

Ruta del archivo real: `src/datos/schema.sql` (propiedad de la Parte 1).

```sql
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
```

Notas:

- El índice único en `conversaciones(cliente_id)` refleja la decisión de "una conversación por
  cliente, reutilizada" (ver `docs/FLUJO_ESTADOS.md`) — no se crean filas nuevas al reiniciar por
  inactividad, se actualiza la misma fila.
- El índice en `actualizada_en` existe porque el caso de uso lo consulta en cada mensaje entrante
  para decidir `huboInactividad`.
- `pedidos` es solo un registro de interés — el pedido real lo cierra el humano manualmente. No
  agregar campos de estado de pedido (pendiente/cerrado/etc.) en esta fase.
- `frecuencia de compra` y preferencias del cliente se derivan de `pedidos` en consultas futuras
  (Fase 2 CRM) — no crear campos redundantes en `clientes` para eso ahora.
