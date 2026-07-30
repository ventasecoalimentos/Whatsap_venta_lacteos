# Modelo de datos (Supabase / PostgreSQL)

Ruta del archivo real: `src/datos/schema.sql` — es la fuente de verdad; este documento explica el
porqué de cada pieza, no la duplica en detalle.

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

-- Datos del PQRSF/Facturación — el nombre usa la columna `nombre` de arriba (mismo campo que
-- Ventas/saludo). Viven en `clientes`, no en `servicio_cliente`: son atributos del cliente, no de
-- cada registro puntual.
alter table clientes
  add column if not exists identificacion  text,
  add column if not exists correo          text;

create table if not exists conversaciones (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete cascade,
  estado_actual   text not null default 'INICIO',
  contexto        jsonb not null default '{}',
  iniciada_en     timestamptz default now(),
  actualizada_en  timestamptz default now()
);

-- Última vez que se envió el aviso de "mucha demanda" en la estadía actual de HANDOFF_HUMANO — ver
-- docs/FLUJO_ESTADOS.md → "Aviso de mucha demanda". null = no se ha enviado ninguno todavía.
alter table conversaciones
  add column if not exists ultimo_aviso_demanda_en timestamptz;

create table if not exists pedidos (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid references clientes(id) on delete cascade,
  producto_interes text,
  ciudad           text,
  creado_en        timestamptz default now()
);

alter table pedidos
  add column if not exists canal text not null default 'detal' check (canal in ('detal', 'distribucion'));

-- 'negocio' se agregó como 3ra categoría de Ventas — hay que tumbar y volver a crear el check
-- porque Postgres no permite alterar su condición in place.
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

alter table servicio_cliente
  add column if not exists tipo text not null default 'PQR' check (tipo in ('PQR', 'Sugerencia'));

-- 'Facturacion' se agregó como 3ra opción — mismo motivo que pedidos.canal arriba.
alter table servicio_cliente drop constraint if exists servicio_cliente_tipo_check;
alter table servicio_cliente add constraint servicio_cliente_tipo_check check (tipo in ('PQR', 'Sugerencia', 'Facturacion'));

-- Índices (nombrados explícitamente para poder usar "if not exists")
create unique index if not exists conversaciones_cliente_id_key on conversaciones (cliente_id);
create index if not exists conversaciones_actualizada_en_idx on conversaciones (actualizada_en);
create index if not exists pedidos_cliente_id_idx on pedidos (cliente_id);
create index if not exists servicio_cliente_cliente_id_idx on servicio_cliente (cliente_id);

-- Row Level Security: defensa en profundidad, ver nota abajo.
alter table clientes enable row level security;
alter table conversaciones enable row level security;
alter table pedidos enable row level security;
alter table servicio_cliente enable row level security;
```

El script completo (con los comentarios y notas de migración) vive en `src/datos/schema.sql` — este
extracto omite algunas notas de migración puntuales para legibilidad. Úsalo siempre desde el
archivo real al aplicar cambios en Supabase.

Todo el script usa `if not exists` / `add column if not exists` a propósito — es seguro volver a
correr el archivo completo cada vez que cambie (no hace falta separar manualmente "solo lo
nuevo"), ya que no hay un sistema formal de migraciones en este proyecto.

## Historial de renombres/cambios de schema (para quien aplique el script sobre una BD ya existente)

- `quejas` → `servicio_cliente`: la tabla se renombró cuando Facturación empezó a vivir ahí
  también (ya no eran solo quejas). Si tu proyecto de Supabase todavía tiene `quejas`, el propio
  `src/datos/schema.sql` trae el `alter table ... rename to ...` comentado, listo para descomentar
  y correr una sola vez.
- `conversaciones.aviso_demanda_enviado` (booleano) → `ultimo_aviso_demanda_en` (timestamp
  nullable): el aviso de "mucha demanda" pasó de mandarse una sola vez por estadía en handoff a
  poder repetirse cada cierto intervalo — hacía falta saber *cuándo* fue el último aviso, no solo
  si hubo alguno. Si tu proyecto tiene la columna vieja, `schema.sql` trae el `drop column`
  comentado.
- `clientes.ciudad`, `pedidos.ciudad`, `pedidos.producto_interes`: ya no se llenan en flujos
  nuevos (ver `docs/FLUJO_ESTADOS.md` → "Ya no se pregunta ciudad ni producto de interés") pero se
  conservan en el schema por compatibilidad con datos anteriores a ese cambio. No se eliminaron las
  columnas para no perder el histórico.

## Notas

- El índice único en `conversaciones(cliente_id)` refleja la decisión de "una conversación por
  cliente, reutilizada" — no se crean filas nuevas al reiniciar por inactividad, se actualiza la
  misma fila.
- El índice en `actualizada_en` existe porque el caso de uso lo consulta en cada mensaje entrante
  para decidir `huboInactividad`, y la tarea de aviso de demanda lo usa para su chequeo periódico.
- No hay tabla de log de mensajes (`mensajes`) — se decidió no usarla: el motor no depende de ella
  para nada, WhatsApp ya conserva el historial completo del chat (coexistencia), y no había ningún
  lector de esos datos. Si en el futuro se necesita (ej. panel CRM de Fase 2 mostrando
  transcripciones), se puede agregar entonces.
- `pedidos` es solo un registro de interés — el pedido real lo cierra el humano manualmente. No
  agregar campos de estado de pedido (pendiente/cerrado/etc.) en esta fase.
- `pedidos.canal` (`detal` | `distribucion` | `negocio`) refleja las 3 categorías de Ventas (ver
  `docs/FLUJO_ESTADOS.md`).
- `servicio_cliente` es una tabla separada de `pedidos` (decisión confirmada) — evita mezclar
  interés de compra con PQRSF/Facturación en las mismas métricas de ventas.
- `frecuencia de compra` y preferencias del cliente se derivan de `pedidos` en consultas futuras
  (Fase 2 CRM) — no crear campos redundantes en `clientes` para eso ahora.
- `clientes.acepto_tratamiento_datos` (default `false`): autorización de Habeas Data (Ley 1581 de
  2012). Mientras sea `false`, el bot vuelve a mostrar el mensaje de consentimiento en cada
  conversación nueva — ver `ESPERANDO_CONSENTIMIENTO_DATOS` en `docs/FLUJO_ESTADOS.md`. El nombre
  se pregunta sin importar la respuesta (autorice o no) — ver esa misma sección.
- **RLS**: el backend siempre usa la `service_role` key, que bypasea RLS — hoy esto no cambia el
  comportamiento. Se habilita como defensa en profundidad: si en el futuro (panel CRM de Fase 2)
  algo se conecta con la key `anon`, las tablas quedan cerradas por defecto en vez de expuestas.
  No se definen políticas (`create policy`) porque nadie las necesita mientras solo se use
  `service_role` — si Fase 2 agrega acceso directo desde cliente, ahí sí habrá que escribirlas.
- El dashboard (`dashboard-frontend/`) lee estas tablas de solo lectura vía `/dashboard/api/*` (ver
  `docs/ARQUITECTURA.md`) — nunca escribe directamente contra Supabase desde el navegador.
