# Variables de entorno

Propiedad de la Parte 1 (`.env.example`, `src/config/env.ts`).

```bash
# .env.example
SUPABASE_URL=
SUPABASE_KEY=
YCLOUD_API_KEY=
YCLOUD_NUMERO=              # número del negocio en E.164, ej: +573001234567
YCLOUD_NUMERO_EQUIPO=       # número al que se notifica el equipo (puede ser el mismo)
CATALOGO_DETAL_URL=         # link o base64 del PDF catálogo al detal
CATALOGO_DISTRIBUCION_URL=  # link o base64 del PDF catálogo de distribución (mayorista)
VENTANA_INACTIVIDAD_HORAS=24 # horas sin actividad antes de reiniciar el flujo (bájalo en local para probar más rápido)
DELAY_TRAS_DOCUMENTO_MS=1500 # pausa tras enviar un catálogo antes del siguiente mensaje (evita que llegue desordenado)
PORT=3000
```

## Validación (zod)

`src/config/env.ts` valida estas variables al arrancar el proceso — si falta alguna, el proceso
lanza error antes de servir tráfico (fail fast). Ejemplo de forma esperada (no exhaustivo, la
Parte 1 define el detalle):

```typescript
import { z } from 'zod';

const esquemaEnv = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  YCLOUD_API_KEY: z.string().min(1),
  YCLOUD_NUMERO: z.string().min(1),
  YCLOUD_NUMERO_EQUIPO: z.string().min(1),
  CATALOGO_DETAL_URL: z.string().min(1),
  CATALOGO_DISTRIBUCION_URL: z.string().min(1),
  VENTANA_INACTIVIDAD_HORAS: z.coerce.number().default(24),
  DELAY_TRAS_DOCUMENTO_MS: z.coerce.number().default(1500),
  PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof esquemaEnv>;

export function cargarEnv(): Env {
  return esquemaEnv.parse(process.env);
}
```

Parte 2 y Parte 3 no necesitan tocar este archivo — solo reciben instancias ya configuradas vía
`src/config/contenedor.ts` (propiedad de la Parte 3).
