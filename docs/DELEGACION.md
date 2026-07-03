# Partes delegadas

Construcción dividida en 3 partes, pensadas para construirse **en paralelo** sin bloquearse
entre sí, gracias al contrato compartido en `docs/CONTRATOS.md`. Cada parte es un brief
autocontenido — puede copiarse tal cual para delegarlo a un agente distinto.

Regla común a las 3: **no ejecutar `npm install`, build ni tests** — la integración final
(instalar dependencias, typecheck, correr tests, prueba manual del webhook) la hace quien
orquesta la integración, después de que las 3 partes existan en el repo.

---

## Parte 1 — Base del proyecto + Datos (Supabase)

**Lee primero**: `docs/ARQUITECTURA.md`, `docs/MODELO_DATOS.md`, `docs/CONTRATOS.md`,
`docs/VARIABLES_ENTORNO.md`.

**Archivos que posee** (no tocar nada fuera de esta lista):
- `package.json`, `tsconfig.json`, `.eslintrc*`, `.prettierrc*`, `.env.example`, `.gitignore`
- `src/config/env.ts`
- `src/datos/schema.sql`
- `src/datos/tipos.ts` (enums re-exportados + interfaces de entidades y repositorios, exactamente
  como en `docs/CONTRATOS.md`)
- `src/datos/clienteRepositorio.ts`, `conversacionRepositorio.ts`, `pedidoRepositorio.ts`,
  `mensajeRepositorio.ts` (implementan las interfaces usando `@supabase/supabase-js`)

**Tareas**:
1. Scaffolding del proyecto: TypeScript strict, Node 20, Express 5, `@supabase/supabase-js`,
   `zod`, `dotenv`, `vitest`, ESLint + Prettier (comillas simples, coma final, 100 cols). Incluir
   TODAS las dependencias que necesitarán las Partes 2 y 3 (ver sus secciones) para que nadie más
   tenga que tocar `package.json`.
2. Crear `schema.sql` tal como está en `docs/MODELO_DATOS.md`.
3. Implementar `env.ts` con el esquema zod de `docs/VARIABLES_ENTORNO.md`.
4. Implementar los 4 repositorios contra Supabase respetando las firmas de `docs/CONTRATOS.md`
   al detalle — Parte 2 y Parte 3 dependen de que estas firmas no cambien.
5. `IConversacionRepository.obtenerOCrear` hace upsert por `cliente_id` (una sola conversación
   por cliente, ver `docs/MODELO_DATOS.md`).

**Criterios de aceptación**: `npm install` funciona sin conflictos; los archivos de tipos
compilan de forma aislada (mentalmente, contra `strict: true`); ningún repo hace lógica de
negocio (solo CRUD contra Supabase).

---

## Parte 2 — Motor de estados

**Lee primero**: `docs/FLUJO_ESTADOS.md`, `docs/CONTRATOS.md`, `docs/ARQUITECTURA.md`.

**Archivos que posee**:
- `src/dominio/estadoConversacion.ts`
- `src/dominio/ciudad.ts`
- `src/motor/motorEstados.ts`
- `src/motor/transiciones/desdeInicio.ts`, `desdeEsperandoNombre.ts`, `desdeEsperandoCiudad.ts`,
  `desdeCatalogoEnviado.ts`, `desdeEsperandoInteres.ts`, `desdeHandoff.ts`
- `tests/unit/motor/*.test.ts` (uno por transición) y `tests/unit/dominio/ciudad.test.ts`

**Tareas**:
1. Implementar `EstadoConversacion` y `Ciudad` exactamente como en `docs/CONTRATOS.md`, incluido
   `parsearCiudad` (normaliza mayúsculas y tildes, nunca falla, cae en `Ciudad.OTRA`).
2. `motorEstados.ts` expone `procesarTransicion(entrada: EntradaMotor): ResultadoTransicion`
   (firma exacta en `docs/CONTRATOS.md`) usando una tabla `Record<EstadoConversacion, TransicionFn>`
   en vez de un switch/if largo — cada función de `transiciones/` es una entrada de esa tabla.
3. Implementar toda la tabla de transiciones de `docs/FLUJO_ESTADOS.md`, incluyendo:
   - Reinicio por inactividad (`huboInactividad === true` desde cualquier estado que no sea
     `INICIO`).
   - Mensajes inesperados (mensajeTexto === null) → mismo estado, respuesta genérica.
   - `HANDOFF_HUMANO` → silencio total (respuestas: []).
4. La función y sus transiciones son **puras**: nada de `await`, `fetch`, ni imports de
   Supabase/YCloud. Solo reciben datos y devuelven datos.
5. Un test unitario por transición cubriendo al menos: caso feliz, ciudad con cobertura, ciudad
   sin cobertura, mensaje no-texto, e inactividad.

**Criterios de aceptación**: cobertura de test de cada rama de la tabla en `docs/FLUJO_ESTADOS.md`;
cero dependencias externas fuera de TypeScript puro.

---

## Parte 3 — Integración YCloud + Webhook + wiring

**Lee primero**: `docs/INTEGRACION_YCLOUD.md`, `docs/CONTRATOS.md`, `docs/ARQUITECTURA.md`,
`docs/FLUJO_ESTADOS.md`.

**Archivos que posee**:
- `src/mensajeria/tipos.ts`, `src/mensajeria/ycloudProveedor.ts`
- `src/http/app.ts`, `src/http/webhookController.ts`, `src/http/routes.ts`
- `src/application/procesarMensajeEntrante.ts`
- `src/config/contenedor.ts`
- `src/index.ts`
- `tests/integration/webhook.test.ts`

**Tareas**:
1. `YCloudProveedor` implementa `IProveedorMensajeria` (`docs/CONTRATOS.md`) contra la API REST
   de YCloud. **Antes de fijar el mapeo del payload entrante, confirmar la forma real contra la
   documentación de YCloud** — no asumir nombres de campo (ver `docs/INTEGRACION_YCLOUD.md`).
2. `ProcesarMensajeEntrante.ejecutar(dto: MensajeEntranteDto)`:
   - Busca o crea cliente por teléfono.
   - Obtiene o crea conversación (una por cliente).
   - Calcula `huboInactividad` comparando `conversacion.actualizadaEn` contra ahora (>24h).
   - Registra mensaje entrante.
   - Llama a `motor.procesarTransicion(...)` (Parte 2 — importar solo por el contrato de tipos,
     no depende de que Parte 2 haya terminado para escribir este archivo).
   - Persiste nuevo estado + contexto.
   - Envía cada respuesta vía `IProveedorMensajeria` (texto o documento según `RespuestaBot`).
   - Registra mensaje(s) saliente(s).
   - Si `resultado.debeNotificarEquipo` → crear `Pedido` + enviar notificación en el mismo hilo
     (ver `docs/FLUJO_ESTADOS.md` → Notificación al equipo).
3. `webhookController` responde `200` siempre, nunca propaga errores (ver
   `docs/ARQUITECTURA.md` → manejo de errores).
4. `contenedor.ts`: composición manual de dependencias (instancia repos, proveedor de mensajería,
   motor, caso de uso) — sin framework de DI.
5. Test de integración del endpoint completo con mocks de los 4 repositorios y del proveedor de
   mensajería (no pegarle a Supabase/YCloud reales).

**Criterios de aceptación**: el webhook nunca devuelve 4xx/5xx aunque el caso de uso lance
excepción; el test de integración cubre al menos el camino cliente nuevo → handoff completo.
