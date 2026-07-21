# Arquitectura

Estructura ligera, no Clean Architecture de 4 capas. El motor de estados se mantiene puro y
testeable (lo único que de verdad lo exige el proyecto); el resto es tan directo como se pueda.

## Estructura de carpetas

```
src/
├── dominio/                       ← Enums y value objects sin dependencias externas
│   ├── estadoConversacion.ts      ← enum EstadoConversacion
│   └── ciudad.ts                  ← enum Ciudad + tieneCobertura() + parsearCiudad()
│
├── motor/                         ← Máquina de estados: función pura
│   ├── motorEstados.ts            ← Record<EstadoConversacion, TransicionFn> + función principal
│   └── transiciones/              ← Una función por estado de origen
│       ├── desdeInicio.ts
│       ├── desdeEsperandoNombre.ts
│       ├── desdeEsperandoCiudad.ts
│       ├── desdeCatalogoEnviado.ts
│       ├── desdeEsperandoInteres.ts
│       └── desdeHandoff.ts
│
├── datos/                         ← Repositorios contra Supabase (sin capa de interfaces separada
│   │                                 en carpeta propia — las interfaces viven en docs/CONTRATOS.md
│   │                                 y se declaran junto a cada repo en su archivo de tipos)
│   ├── tipos.ts                   ← Cliente, Conversacion, Pedido, Queja + interfaces de repos
│   ├── clienteRepositorio.ts
│   ├── conversacionRepositorio.ts
│   ├── pedidoRepositorio.ts
│   └── quejaRepositorio.ts
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
│   └── routes.ts
│
├── config/
│   ├── env.ts                     ← Validación de variables de entorno con zod
│   └── contenedor.ts              ← Composición manual de dependencias (sin framework de DI)
│
└── index.ts                       ← Punto de entrada

tests/
├── unit/
│   └── motor/                     ← Un test por transición
└── integration/
    └── webhook.test.ts            ← Test del endpoint completo con mocks de repositorios
```

## Por qué esta estructura y no Clean Architecture de 4 capas

El proyecto es un motor de estados de 6 pasos con un solo caso de uso real. Separar
domain/application/infrastructure/interfaces con interfaces de repositorio independientes,
DTOs y un contenedor de DI complejo añade ceremonia sin beneficio real a este alcance —el
beneficio de esa separación se paga cuando el sistema crece (ej. Fase 2 CRM), no ahora.
Lo que sí se conserva de esa idea:

- El **motor de estados es una función pura** (sin `await`, sin llamadas a Supabase/YCloud
  dentro de las transiciones) — eso es lo que lo hace testeable de forma aislada.
- Los **repositorios se definen por interfaz** (en `datos/tipos.ts`) aunque vivan en la misma
  carpeta que su implementación — así el caso de uso y el motor no dependen del SDK de Supabase
  directamente, y los tests de integración pueden mockear esas interfaces.

## Propiedad de archivos por parte delegada (ver docs/DELEGACION.md)

- **Parte 1**: `package.json`, `tsconfig.json`, `.eslintrc*`, `.prettierrc*`, `.env.example`,
  `src/config/env.ts`, `src/datos/**`, `docs/MODELO_DATOS.md` → `infraestructura/database/schema.sql`
  (en la ruta real: `src/datos/schema.sql`).
- **Parte 2**: `src/dominio/**`, `src/motor/**`, `tests/unit/motor/**`.
- **Parte 3**: `src/mensajeria/**`, `src/http/**`, `src/application/**`, `src/config/contenedor.ts`,
  `src/index.ts`, `tests/integration/**`.

Ningún agente debe tocar archivos fuera de su lista — evita conflictos al construir en paralelo.

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
app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    await contenedor.procesarMensajeEntrante.ejecutar(mapearPayload(req.body));
  } catch (error) {
    console.error('[webhook] error procesando mensaje:', error);
  }
});
```
