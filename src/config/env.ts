import 'dotenv/config';
import { z } from 'zod';

// Esquema de variables de entorno — validación fail-fast al arrancar el proceso
// (ver docs/VARIABLES_ENTORNO.md). Si falta alguna variable requerida, el proceso
// lanza error antes de servir tráfico.
const esquemaEnv = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
  YCLOUD_API_KEY: z.string().min(1),
  YCLOUD_NUMERO: z.string().min(1),
  YCLOUD_NUMERO_EQUIPO: z.string().min(1),
  // Un solo catálogo para las 3 categorías de Ventas (detal/distribuidor/negocio, ver
  // docs/FLUJO_ESTADOS.md) — la lista de precios ya no la manda el bot, la manda el asesor.
  CATALOGO_URL: z.string().min(1),
  // Imagen fija de "cómo comprar" (tiempos de entrega, valor del domicilio, etc.) que se envía
  // justo después del catálogo en la rama Ventas (ver desdeMenuVentas.ts).
  COMO_COMPRAR_URL: z.string().min(1),
  // Horas sin actividad antes de reiniciar el flujo a INICIO. También es, en HANDOFF_HUMANO, la
  // ventana durante la cual cada mensaje del cliente recibe el aviso de "mucha demanda" (ver
  // desdeHandoff.ts) — un solo número para ambos conceptos (decisión del cliente: "todo a 30
  // min"). Default 0.5 = 30 minutos.
  VENTANA_INACTIVIDAD_HORAS: z.coerce.number().default(0.5),
  // Minutos antes del cierre automático de HANDOFF_HUMANO en los que se envía el aviso previo
  // (ver tareaCierreHandoff.ts) — ej. con la ventana de 30 min por defecto y este valor en 10, el
  // aviso sale a los 20 min y el cierre a los 30. Con la tarea revisando cada 5 min (ver
  // INTERVALO_TAREA_CIERRE_HANDOFF_MS en index.ts), este valor deja al menos 2 revisiones de
  // margen para que el aviso alcance a salir antes del cierre.
  AVISO_PREVIO_CIERRE_MIN: z.coerce.number().default(10),
  // Pausa tras enviar un documento antes del siguiente mensaje (ver docs/INTEGRACION_YCLOUD.md) —
  // evita que el menú posterior llegue antes que el catálogo al celular del cliente. 1500ms
  // resultó insuficiente en pruebas reales (el catálogo seguía llegando después del menú) — subido
  // a 4000ms. Sigue siendo una heurística, no una confirmación real de entrega: YCloud confirma
  // que recibió la solicitud casi de inmediato, pero cuánto tarda en llegarle al celular del
  // cliente varía con su red/dispositivo.
  DELAY_TRAS_DOCUMENTO_MS: z.coerce.number().default(4000),
  PORT: z.coerce.number().default(3000),
  // Credenciales de HTTP Basic Auth para /dashboard (ver docs/ARQUITECTURA.md) — panel interno de
  // solo lectura para el equipo, no expuesto a clientes.
  DASHBOARD_USUARIO: z.string().min(1),
  DASHBOARD_CONTRASENA: z.string().min(1),
});

export type Env = z.infer<typeof esquemaEnv>;

export function cargarEnv(): Env {
  return esquemaEnv.parse(process.env);
}
