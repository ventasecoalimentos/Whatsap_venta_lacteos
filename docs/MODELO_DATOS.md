# Modelo de datos (Supabase / PostgreSQL)

Ruta del archivo real: `src/datos/schema.sql` (propiedad de la Parte 1).

```sql
create table if not exists clientes (
  id                 uuid primary key default gen_random_uuid(),
  telefono           text unique not null,
  nombre             text,
  ciudad             text,
  fecha_registro     timestamptz default now(),
  ultima_interaccion timestamptz
);

-- Habeas Data (Ley 1581 de 2012) — ver ESPERANDO_CONSENTIMIENTO_DATOS en docs/FLUJO_ESTADOS.md.
alter table clientes
  add column if not exists acepto_tratamiento_datos boolean not null default false;

create table if not exists conversaciones (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete cascade,
  estado_actual   text not null default 'INICIO',
  contexto        jsonb not null default '{}',
  iniciada_en     timestamptz default now(),
  actualizada_en  timestamptz default now()
);

create table if not exists pedidos (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid references clientes(id) on delete cascade,
  producto_interes text,
  ciudad           text,
  creado_en        timestamptz default now()
);

alter table pedidos
  add column if not exists canal text not null default 'detal' check (canal in ('detal', 'distribucion'));

create table if not exists quejas (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid references clientes(id) on delete cascade,
  descripcion      text,
  creado_en        timestamptz default now()
);

-- Índices (nombrados explícitamente para poder usar "if not exists")
create unique index if not exists conversaciones_cliente_id_key on conversaciones (cliente_id); -- una sola conversación por cliente (upsert), ya cubre búsquedas por cliente_id
create index if not exists conversaciones_actualizada_en_idx on conversaciones (actualizada_en); -- soporta el chequeo de reinicio por inactividad
create index if not exists pedidos_cliente_id_idx on pedidos (cliente_id);
create index if not exists quejas_cliente_id_idx on quejas (cliente_id);

-- Row Level Security (defensa en profundidad, ver nota abajo) — no falla si ya estaba habilitado.
alter table clientes enable row level security;
alter table conversaciones enable row level security;
alter table pedidos enable row level security;
alter table quejas enable row level security;

-- NOTA: la tabla `mensajes` (log de mensajes in/out) se quitó del alcance — no tenía ningún
-- lector, era solo auditoría sin usar. Si ya la creaste y quieres limpiarla:
--   drop table if exists mensajes;
```

Todo el script usa `if not exists` / `add column if not exists` a propósito — es seguro volver a
correr el archivo completo cada vez que cambie (no hace falta separar manualmente "solo lo
nuevo"), ya que no hay un sistema formal de migraciones en este proyecto.

Notas:

- El índice único en `conversaciones(cliente_id)` refleja la decisión de "una conversación por
  cliente, reutilizada" (ver `docs/FLUJO_ESTADOS.md`) — no se crean filas nuevas al reiniciar por
  inactividad, se actualiza la misma fila.
- El índice en `actualizada_en` existe porque el caso de uso lo consulta en cada mensaje entrante
  para decidir `huboInactividad`.
- No hay tabla de log de mensajes (`mensajes`) — se decidió no usarla: el motor no depende de ella
  para nada, WhatsApp ya conserva el historial completo del chat (coexistencia), y no había ningún
  lector de esos datos en Fase 1. Si en el futuro se necesita (ej. panel CRM de Fase 2 mostrando
  transcripciones), se puede agregar entonces.
- `pedidos` es solo un registro de interés — el pedido real lo cierra el humano manualmente. No
  agregar campos de estado de pedido (pendiente/cerrado/etc.) en esta fase.
- `pedidos.canal` (`detal` | `distribucion`) refleja la rama Detal/Distribución del flujo ampliado
  (ver `docs/FLUJO_ESTADOS.md`) — reemplaza la antigua distinción de catálogo por cobertura de
  ciudad.
- `quejas` es una tabla separada de `pedidos` (decisión confirmada) — evita mezclar interés de
  compra con quejas/reclamos en las mismas métricas de ventas.
- `frecuencia de compra` y preferencias del cliente se derivan de `pedidos` en consultas futuras
  (Fase 2 CRM) — no crear campos redundantes en `clientes` para eso ahora.
- `clientes.acepto_tratamiento_datos` (default `false`): autorización de Habeas Data (Ley 1581 de
  2012). Mientras sea `false` (cliente nunca preguntado, o preguntado y declinó), el bot vuelve a
  mostrar el mensaje de consentimiento en cada conversación nueva — ver `ESPERANDO_CONSENTIMIENTO_DATOS`
  en `docs/FLUJO_ESTADOS.md`. Si declina, se guarda igual el contacto (teléfono, y el nombre de
  perfil de WhatsApp si vino en el mensaje) pero el bot nunca lo saluda personalizado ni le pide el
  nombre explícitamente mientras el campo siga en `false`.
- **RLS**: el backend siempre usa la `service_role` key, que bypasea RLS — hoy esto no cambia el
  comportamiento. Se habilita como defensa en profundidad: si en el futuro (panel CRM de Fase 2)
  algo se conecta con la key `anon`, las tablas quedan cerradas por defecto en vez de expuestas.
  No se definen políticas (`create policy`) porque nadie las necesita mientras solo se use
  `service_role` — si Fase 2 agrega acceso directo desde cliente, ahí sí habrá que escribirlas.
