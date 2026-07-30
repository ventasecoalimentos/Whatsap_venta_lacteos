# Variables de entorno

Definidas en `.env.example` y validadas en `src/config/env.ts` (zod) — si falta alguna requerida,
el proceso lanza error al arrancar, antes de servir tráfico (fail fast).

```bash
# .env.example
SUPABASE_URL=
SUPABASE_KEY=
YCLOUD_API_KEY=
YCLOUD_NUMERO=              # número del negocio en E.164, ej: +573001234567
YCLOUD_NUMERO_EQUIPO=       # número al que se notifica el equipo (no usado hoy — ver nota abajo)
CATALOGO_URL=               # link o base64 del PDF catálogo (uno solo, para detal/distribuidor/negocio)
VENTANA_INACTIVIDAD_HORAS=0.5 # horas sin actividad antes de reiniciar el flujo, y umbral del aviso de "mucha demanda" (0.5 = 30 min)
INTERVALO_AVISO_DEMANDA_MIN=10 # cada cuántos minutos se revisan/repiten conversaciones en handoff para el aviso de "mucha demanda"
DELAY_TRAS_DOCUMENTO_MS=4000 # pausa tras enviar un catálogo antes del siguiente mensaje (evita que llegue desordenado)
PORT=3000
DASHBOARD_USUARIO=          # usuario para entrar a /dashboard (HTTP Basic Auth)
DASHBOARD_CONTRASENA=       # contraseña para entrar a /dashboard
```

## Esquema real (`src/config/env.ts`)

```typescript
const esquemaEnv = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  YCLOUD_API_KEY: z.string().min(1),
  YCLOUD_NUMERO: z.string().min(1),
  YCLOUD_NUMERO_EQUIPO: z.string().min(1),
  CATALOGO_URL: z.string().min(1),
  VENTANA_INACTIVIDAD_HORAS: z.coerce.number().default(0.5),
  INTERVALO_AVISO_DEMANDA_MIN: z.coerce.number().default(10),
  DELAY_TRAS_DOCUMENTO_MS: z.coerce.number().default(4000),
  PORT: z.coerce.number().default(3000),
  DASHBOARD_USUARIO: z.string().min(1),
  DASHBOARD_CONTRASENA: z.string().min(1),
});

export type Env = z.infer<typeof esquemaEnv>;

export function cargarEnv(): Env {
  return esquemaEnv.parse(process.env);
}
```

## Notas por variable

- **`CATALOGO_URL`** (antes `CATALOGO_DETAL_URL` + `CATALOGO_DISTRIBUCION_URL`, dos variables
  separadas): desde que Ventas usa un solo catálogo para las 3 categorías (Detal/Distribuidor/
  Negocio, ver `docs/FLUJO_ESTADOS.md`), basta una sola URL. La lista de precios ya no la manda el
  bot — la manda el asesor humano al tomar la conversación.
- **`VENTANA_INACTIVIDAD_HORAS`** (default `0.5` = 30 minutos): un solo número para dos conceptos
  — cuándo se reinicia el flujo a `INICIO` por inactividad, **y** la ventana máxima del aviso de
  "mucha demanda" (pasado ese punto, no tiene sentido seguir avisando porque el próximo mensaje del
  cliente ya reinicia el flujo). Decisión explícita del cliente ("todo a 30 min") en vez de usar
  dos temporizadores independientes.
- **`INTERVALO_AVISO_DEMANDA_MIN`** (default `10`, en **minutos** — no milisegundos, a propósito
  para no tener que hacer la conversión a mano): cada cuánto corre la tarea de fondo
  (`src/application/avisoDemanda.ts`) y, a la vez, cada cuánto se puede repetir el aviso si el
  cliente escribe de nuevo estando en handoff. Con los valores por defecto (10 min de intervalo,
  30 min de ventana máxima) el aviso se manda hasta 3 veces por estadía en handoff.
- **`DELAY_TRAS_DOCUMENTO_MS`** (default `4000`): pausa tras enviar el catálogo antes del siguiente
  mensaje — WhatsApp confirma la solicitud de envío casi al instante pero sigue entregando el
  archivo de forma asíncrona; sin esta pausa, el menú de seguimiento a veces llegaba antes que el
  catálogo. 1500ms (valor original) resultó insuficiente en pruebas reales; se subió a 4000ms. No
  es una confirmación real de entrega, es una heurística de tiempo fijo — puede seguir pasando
  ocasionalmente con mala señal del cliente.
- **`YCLOUD_NUMERO_EQUIPO`**: se captura y valida, pero **hoy ningún código la usa** — el handoff
  notifica al equipo con una tarjeta resumen en el mismo hilo del cliente (ver
  `docs/FLUJO_ESTADOS.md` → "Tarjetas resumen en el handoff"), no en un número/chat separado.
  Se conserva la variable por si se necesita un canal de notificación aparte más adelante.
- **`DASHBOARD_USUARIO` / `DASHBOARD_CONTRASENA`**: credenciales de HTTP Basic Auth para
  `/dashboard` (panel interno de solo lectura, ver `docs/ARQUITECTURA.md`) — no expuesto a
  clientes. Usa una contraseña real antes de producción; no dejar valores de prueba.

## Qué NO necesita tocar el resto del código

El motor (`src/motor/**`) y el caso de uso a nivel de firma (`ProcesarMensajeEntrante`) no leen
`process.env` directamente — reciben instancias/valores ya resueltos vía `src/config/contenedor.ts`
(composición manual de dependencias). Solo `src/config/env.ts` y `src/config/contenedor.ts` tocan
variables de entorno.
