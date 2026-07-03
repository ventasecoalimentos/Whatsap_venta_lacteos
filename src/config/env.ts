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
  CATALOGO_COMPLETO_URL: z.string().min(1),
  CATALOGO_REDUCIDO_URL: z.string().min(1),
  PORT: z.coerce.number().default(3000),
});

export type Env = z.infer<typeof esquemaEnv>;

export function cargarEnv(): Env {
  return esquemaEnv.parse(process.env);
}
