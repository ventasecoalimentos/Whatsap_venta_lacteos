-- Seguro de re-ejecutar completo cuantas veces haga falta (todo usa "if not exists"), para que
-- aplicar cambios de schema no requiera separar manualmente "lo nuevo" cada vez.

create table if not exists clientes (
  id                 uuid primary key default gen_random_uuid(),
  telefono           text unique not null,
  nombre             text,
  ciudad             text,
  fecha_registro     timestamptz default now(),
  ultima_interaccion timestamptz
);

-- Habeas Data (Ley 1581 de 2012) — el cliente autoriza (o no) el tratamiento de sus datos antes
-- de que el bot continúe; mientras sea false, se le vuelve a preguntar en cada conversación nueva
-- (ver ESPERANDO_CONSENTIMIENTO_DATOS en docs/FLUJO_ESTADOS.md).
alter table clientes
  add column if not exists acepto_tratamiento_datos boolean not null default false;

-- Datos del PQRSF (ver ESPERANDO_PQRSF_IDENTIFICACION/CORREO en docs/FLUJO_ESTADOS.md) — el
-- nombre usa la columna `nombre` de arriba (mismo campo que Ventas/saludo, ver
-- ESPERANDO_PQRSF_NOMBRE). Viven en `clientes`, no en `servicio_cliente`: son atributos del
-- cliente, no de cada registro puntual (evita duplicar identidad en cada fila).
alter table clientes
  add column if not exists identificacion  text,
  add column if not exists correo          text;

-- NOTA: `nombre_completo` (columna separada para el nombre del PQRSF) se quitó del alcance — se
-- fusionó con `nombre` (decisión del cliente: un solo campo de nombre, no dos). Si ya la creaste
-- en tu proyecto de Supabase, corre manualmente (irreversible, borra los datos que tenga):
--   alter table clientes drop column if exists nombre_completo;

create table if not exists conversaciones (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete cascade,
  estado_actual   text not null default 'INICIO',
  contexto        jsonb not null default '{}',
  iniciada_en     timestamptz default now(),
  actualizada_en  timestamptz default now()
);

-- Si ya se envió el aviso de "mucha demanda" en la estadía actual de HANDOFF_HUMANO (ver
-- src/application/avisoDemanda.ts) — se reinicia a false cada vez que se (re)entra a handoff.
alter table conversaciones
  add column if not exists aviso_demanda_enviado boolean not null default false;

create table if not exists pedidos (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid references clientes(id) on delete cascade,
  producto_interes text,
  ciudad           text,
  creado_en        timestamptz default now()
);

-- Columna agregada después de la primera versión del schema — "add column if not exists" para
-- que quede aplicada aunque la tabla ya existiera sin ella.
alter table pedidos
  add column if not exists canal text not null default 'detal' check (canal in ('detal', 'distribucion'));

-- 'negocio' se agregó como 3ra categoría de Ventas (ya no se restringe a detal/distribuidor) —
-- hay que tumbar y volver a crear el check porque Postgres no permite alterar su condición in place.
alter table pedidos drop constraint if exists pedidos_canal_check;
alter table pedidos add constraint pedidos_canal_check check (canal in ('detal', 'distribucion', 'negocio'));

-- Registros de Servicio al cliente (PQR, Sugerencia y Facturación) — se llamaba `quejas`, pero ya
-- no son solo quejas desde que Facturación vive aquí también.
create table if not exists servicio_cliente (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid references clientes(id) on delete cascade,
  descripcion      text,
  creado_en        timestamptz default now()
);

-- NOTA: si tu proyecto de Supabase todavía tiene la tabla vieja `quejas` (antes de este cambio),
-- renómbrala en vez de perder los datos:
--   alter table if exists quejas rename to servicio_cliente;
--   alter index if exists quejas_pkey rename to servicio_cliente_pkey;
--   alter table servicio_cliente rename constraint quejas_cliente_id_fkey to servicio_cliente_cliente_id_fkey;

-- Clasificación elegida en Servicio al cliente — sí es por-registro (no por-cliente como
-- nombre_completo/identificacion/correo), cada PQRSF/Facturación puede tener un tipo distinto.
alter table servicio_cliente
  add column if not exists tipo text not null default 'PQR' check (tipo in ('PQR', 'Sugerencia'));

-- 'Facturacion' se agregó como 3ra opción de Servicio al cliente (mismo motivo que pedidos.canal
-- arriba: hay que tumbar y volver a crear el check).
alter table servicio_cliente drop constraint if exists quejas_tipo_check;
alter table servicio_cliente drop constraint if exists servicio_cliente_tipo_check;
alter table servicio_cliente add constraint servicio_cliente_tipo_check check (tipo in ('PQR', 'Sugerencia', 'Facturacion'));

-- Índices (nombrados explícitamente para poder usar "if not exists")
create unique index if not exists conversaciones_cliente_id_key on conversaciones (cliente_id); -- una sola conversación por cliente (upsert), ya cubre búsquedas por cliente_id
create index if not exists conversaciones_actualizada_en_idx on conversaciones (actualizada_en); -- soporta el chequeo de reinicio por inactividad
create index if not exists pedidos_cliente_id_idx on pedidos (cliente_id);
create index if not exists servicio_cliente_cliente_id_idx on servicio_cliente (cliente_id);

-- Row Level Security: el backend accede siempre con la service_role key (bypasea RLS), así que
-- esto no cambia el comportamiento actual. Se habilita como defensa en profundidad para que, si
-- en el futuro (ej. panel CRM de Fase 2) algo se conecta con la key `anon`, las tablas queden
-- cerradas por defecto en vez de expuestas — no se definen políticas porque nadie las necesita
-- todavía. "enable row level security" no falla si ya estaba habilitado.
alter table clientes enable row level security;
alter table conversaciones enable row level security;
alter table pedidos enable row level security;
alter table servicio_cliente enable row level security;

-- NOTA: la tabla `mensajes` (log de mensajes in/out) se quitó del alcance — no se usaba en
-- ningún lado (era solo auditoría, sin lectores). Si ya la creaste en tu proyecto de Supabase y
-- quieres limpiarla, corre manualmente (irreversible, borra los datos que tenga):
--   drop table if exists mensajes;
