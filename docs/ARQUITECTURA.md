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
│   └── procesarMensajeEntrante.ts ← Caso de uso único: orquesta todo el flujo de un mensaje
│
├── http/
│   ├── app.ts                     ← Setup de Express
│   ├── webhookController.ts       ← Recibe POST de YCloud, responde 200, llama al caso de uso
│   ├── mapeoYCloud.ts             ← Mapea el payload de YCloud a MensajeEntranteDto
│   ├── routes.ts                  ← /webhook y /dashboard/api/*
│   ├── dashboardAuth.ts           ← HTTP Basic Auth para /dashboard
│   └── dashboardController.ts     ← Handlers de solo lectura para el dashboard
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
export function crearManejadorWebhook(procesarMensajeEntrante: ProcesarMensajeEntrante) {
  return async function manejarWebhookYCloud(req: Request, res: Response): Promise<void> {
    res.sendStatus(200);
    try {
      const dto = mapearPayloadYCloud(req.body);
      if (!dto) return;
      await procesarMensajeEntrante.ejecutar(dto);
    } catch (error) {
      console.error('[webhookController] error procesando mensaje entrante:', error);
    }
  };
}
```

Todo el proyecto es 100% reactivo a mensajes entrantes — no hay tareas de fondo ni `setInterval`.
Incluso el aviso de "mucha demanda" en `HANDOFF_HUMANO` se resuelve dentro del mismo flujo
reactivo (ver `docs/FLUJO_ESTADOS.md` → "Aviso de mucha demanda").

## Dashboard interno

`/dashboard` sirve el build estático de `dashboard-frontend/` (Vite/React) protegido con HTTP
Basic Auth (`src/http/dashboardAuth.ts`). Consume `/dashboard/api/clientes`,
`/dashboard/api/pedidos` y `/dashboard/api/servicio-cliente` (solo lectura, mismos repositorios que
usa el bot). Incluye un botón de exportar a Excel (`dashboard-frontend/src/exportarExcel.ts`,
librería `xlsx`) que arma el archivo enteramente en el navegador a partir de los datos ya
cargados — no hay endpoint de exportación en el backend.
