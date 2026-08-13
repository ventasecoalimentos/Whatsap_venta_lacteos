# Arquitectura

Estructura ligera, no Clean Architecture de 4 capas. El motor de estados se mantiene puro y
testeable (lo único que de verdad lo exige el proyecto); el resto es tan directo como se pueda.

## Estructura de carpetas

```
src/
├── dominio/                       ← Enums sin dependencias externas
│   └── estadoConversacion.ts      ← enum EstadoConversacion
│
├── motor/                         ← Máquina de estados: función pura
│   ├── motorEstados.ts            ← Record<EstadoConversacion, TransicionFn> + función principal
│   └── transiciones/              ← Una función por estado de origen, + helpers compartidos
│       ├── desdeInicio.ts
│       ├── desdeConsentimientoDatos.ts
│       ├── desdeEsperandoNombre.ts
│       ├── desdeMenuPrincipal.ts
│       ├── desdeServicioCliente.ts
│       ├── desdeEsperandoTipoPqrsf.ts
│       ├── desdeEsperandoPqrsfNombre.ts
│       ├── desdeEsperandoPqrsfIdentificacion.ts
│       ├── desdeEsperandoPqrsfCorreo.ts
│       ├── desdeEsperandoPqrsfTirilla.ts  ← solo Facturación: pide foto de la tirilla, cierra sin handoff
│       ├── desdeEsperandoQueja.ts
│       ├── desdeMenuVentas.ts
│       ├── desdeCatalogoEnviado.ts
│       ├── desdeHandoff.ts
│       ├── iniciarCapturaPqrsf.ts  ← compartido por Facturación y PQR/Sugerencia
│       ├── cerrarPedido.ts         ← compartido, construye la tarjeta resumen de pedido
│       ├── volverAMenuPrincipal.ts / volverAMenuVentas.ts ← helpers de retorno a un menú
│       ├── seleccionDeLista.ts     ← buscarOpcionSeleccionada (match por id/título)
│       ├── saludoBienvenida.ts
│       ├── mensajeAvisoDemanda.ts  ← texto del aviso de "mucha demanda" (ver desdeHandoff.ts)
│       └── opciones*.ts            ← constantes de opciones de cada menú (una por estado)
│
├── datos/                         ← Repositorios contra Supabase (interfaces declaradas junto a
│   │                                 cada repo en tipos.ts, sin carpeta de interfaces separada)
│   ├── tipos.ts                   ← Cliente, Conversacion, Pedido, RegistroServicioCliente + interfaces de repos
│   ├── schema.sql                 ← fuente de verdad del schema (ver docs/MODELO_DATOS.md)
│   ├── clienteRepositorio.ts
│   ├── conversacionRepositorio.ts
│   ├── pedidoRepositorio.ts
│   └── servicioClienteRepositorio.ts
│
├── mensajeria/                    ← Integración YCloud
│   ├── tipos.ts                   ← IProveedorMensajeria
│   └── ycloudProveedor.ts
│
├── application/
│   ├── procesarMensajeEntrante.ts        ← Caso de uso principal: orquesta todo el flujo de un mensaje
│   ├── registrarRespuestaAsesor.ts       ← Maneja el evento whatsapp.smb.message.echoes (mensaje del asesor)
│   ├── tareaCierreHandoff.ts             ← Única tarea de fondo: aviso previo + cierre automático de HANDOFF_HUMANO
│   ├── decidirAccionCierreHandoff.ts     ← Lógica pura de tareaCierreHandoff.ts (testeable aparte)
│   ├── mensajeAvisoPrevioCierre.ts       ← Texto del aviso previo
│   └── mensajeCierreHandoff.ts           ← Texto del cierre automático
│
├── http/
│   ├── app.ts                     ← Setup de Express
│   ├── webhookController.ts       ← Recibe POST de YCloud, responde 200, enruta al caso de uso que corresponda
│   ├── mapeoYCloud.ts             ← Mapea el payload de YCloud a MensajeEntranteDto, y el evento de eco del asesor
│   ├── routes.ts                  ← /webhook, /politica-datos y /dashboard/api/*
│   ├── dashboardAuth.ts           ← HTTP Basic Auth para /dashboard
│   ├── dashboardController.ts     ← Handlers de solo lectura para el dashboard
│   └── paginaPoliticaDatos.ts     ← HTML de /politica-datos (pública, sin auth — enlazada desde desdeInicio.ts)
│
├── config/
│   ├── env.ts                     ← Validación de variables de entorno con zod
│   └── contenedor.ts              ← Composición manual de dependencias (sin framework de DI)
│
└── index.ts                       ← Punto de entrada — arranca el servidor

dashboard-frontend/                ← Proyecto Vite/React aparte (su propio tooling/ESLint/tsconfig),
│                                     panel interno de solo lectura, servido como estático desde
│                                     Express bajo /dashboard (ver src/http/routes.ts)
├── src/
│   ├── App.tsx                    ← Métricas + tablas de datos (Clientes/Pedidos/PQRSF/Facturación)
│   ├── api.ts                     ← fetch a /dashboard/api/*
│   ├── types.ts                   ← espejo de src/datos/tipos.ts (duplicado a propósito, sin acceso al backend)
│   ├── exportarExcel.ts           ← exporta clientes/pedidos/PQRSF/facturación a un .xlsx (librería `xlsx`)
│   └── components/                ← KpiCard, ChartCard, DataTable, Badge, Skeleton
└── dist/                          ← build servido por Express (no se commitea)

tests/
├── unit/
│   └── motor/                     ← Un test por transición/helper con lógica real
└── integration/
    └── webhook.test.ts            ← Test del endpoint completo con mocks de repositorios
```

## Por qué esta estructura y no Clean Architecture de 4 capas

El proyecto es un motor de estados con un solo caso de uso real. Separar
domain/application/infrastructure/interfaces con interfaces de repositorio independientes,
DTOs y un contenedor de DI complejo añade ceremonia sin beneficio real a este alcance — el
beneficio de esa separación se paga cuando el sistema crece (ej. Fase 2 CRM), no ahora.
Lo que sí se conserva de esa idea:

- El **motor de estados es una función pura** (sin `await`, sin llamadas a Supabase/YCloud
  dentro de las transiciones) — eso es lo que lo hace testeable de forma aislada.
- Los **repositorios se definen por interfaz** (en `datos/tipos.ts`) aunque vivan en la misma
  carpeta que su implementación — así el caso de uso y el motor no dependen del SDK de Supabase
  directamente, y los tests de integración pueden mockear esas interfaces.

## Propiedad de archivos por área (histórico: construido en 3 partes delegadas, ver `docs/DELEGACION.md`)

El proyecto ya está construido — esta sección queda como mapa de qué área del código corresponde a
cada responsabilidad, útil para saber dónde tocar al mantenerlo:

- **Datos/infraestructura**: `package.json`, `tsconfig.json`, `.eslintrc*`, `.prettierrc*`,
  `.env.example`, `src/config/env.ts`, `src/datos/**`, `docs/MODELO_DATOS.md`.
- **Motor de estados**: `src/dominio/**`, `src/motor/**`, `tests/unit/motor/**`.
- **Integración/wiring**: `src/mensajeria/**`, `src/http/**`, `src/application/**`,
  `src/config/contenedor.ts`, `src/index.ts`, `tests/integration/**`.
- **Dashboard**: `dashboard-frontend/**` — proyecto aparte, no comparte tooling con el backend.

## Convenciones

- Todo en **español**: nombres de tablas, variables, comentarios, mensajes del bot.
- Archivos en **PascalCase** solo para clases; el resto (funciones, variables, nombres de
  archivo de función) en **camelCase**.
- Prettier: comillas simples, coma final (`trailing comma`), 100 columnas.
- TypeScript en modo `strict`.
- **Nunca commitear `.env`** — solo `.env.example`.
- Comentarios solo cuando expliquen un *por qué* no obvio (ver CLAUDE.md raíz del repo).

## Manejo de errores en el webhook

El webhook SIEMPRE responde `200` a YCloud antes o independientemente del resultado del
procesamiento, para evitar reintentos infinitos del proveedor. Los errores se loggean
internamente y nunca se propagan como 4xx/5xx.

```typescript
export function crearManejadorWebhook(
  procesarMensajeEntrante: ProcesarMensajeEntrante,
  registrarRespuestaAsesor: RegistrarRespuestaAsesor,
) {
  return async function manejarWebhookYCloud(req: Request, res: Response): Promise<void> {
    res.sendStatus(200);
    try {
      const dto = mapearPayloadYCloud(req.body);
      if (dto) {
        await procesarMensajeEntrante.ejecutar(dto);
        return;
      }
      const telefonoCliente = mapearEventoEcoAsesor(req.body);
      if (telefonoCliente) {
        await registrarRespuestaAsesor.ejecutar(telefonoCliente);
      }
    } catch (error) {
      console.error('[webhookController] error procesando mensaje entrante:', error);
    }
  };
}
```

El mismo endpoint `/webhook` recibe dos tipos de evento de YCloud: mensajes entrantes del cliente
(`ProcesarMensajeEntrante`, pasa por el motor de estados) y ecos de mensajes que el equipo manda
desde la app nativa en coexistencia (`RegistrarRespuestaAsesor`, solo renueva actividad — ver
`docs/FLUJO_ESTADOS.md` → "Detección de la respuesta del asesor"). Cualquier otro evento (status de
entrega/lectura, etc.) se ignora en silencio.

El bot en sí es 100% reactivo a mensajes entrantes. La única excepción es
`src/application/tareaCierreHandoff.ts` — una tarea programada (`setInterval` cada 5 min, arrancada
en `src/index.ts`) que manda el aviso previo y el cierre automático de `HANDOFF_HUMANO` aunque
nadie (ni cliente ni asesor) vuelva a escribir (ver `docs/FLUJO_ESTADOS.md` → "Cierre automático de
HANDOFF_HUMANO"). El aviso de "mucha demanda" (distinto del aviso previo al cierre) sigue siendo
puramente reactivo.

## Dashboard interno

`/dashboard` sirve el build estático de `dashboard-frontend/` (Vite/React) protegido con HTTP
Basic Auth (`src/http/dashboardAuth.ts`). Consume `/dashboard/api/clientes`,
`/dashboard/api/pedidos` y `/dashboard/api/servicio-cliente` (solo lectura, mismos repositorios que
usa el bot). Incluye un botón de exportar a Excel (`dashboard-frontend/src/exportarExcel.ts`,
librería `xlsx`) que arma el archivo enteramente en el navegador a partir de los datos ya
cargados — no hay endpoint de exportación en el backend.
