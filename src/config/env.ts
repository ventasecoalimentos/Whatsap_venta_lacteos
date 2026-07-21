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
  CATALOGO_DETAL_URL: z.string().min(1),
  CATALOGO_DISTRIBUCION_URL: z.string().min(1),
  // Horas sin actividad antes de reiniciar el flujo (ver docs/FLUJO_ESTADOS.md). Default 24 =
  // la ventana real de mensajería libre de WhatsApp; se puede bajar en local para pruebas.
  VENTANA_INACTIVIDAD_HORAS: z.coerce.number().default(24),
  // Pausa tras enviar un documento antes del siguiente mensaje (ver docs/INTEGRACION_YCLOUD.md) —
  // evita que el menú posterior llegue antes que el catálogo al celular del cliente.
  DELAY_TRAS_DOCUMENTO_MS: z.coerce.number().default(1500),
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
