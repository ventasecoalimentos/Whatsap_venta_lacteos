import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';
import { ClienteRepositorio } from '../datos/clienteRepositorio';
import { ConversacionRepositorio } from '../datos/conversacionRepositorio';
import { PedidoRepositorio } from '../datos/pedidoRepositorio';
import { MensajeRepositorio } from '../datos/mensajeRepositorio';
import { YCloudProveedor } from '../mensajeria/ycloudProveedor';
import { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';

export interface Contenedor {
  procesarMensajeEntrante: ProcesarMensajeEntrante;
}

// Composición manual de dependencias (sin framework de DI) — instancia repos contra Supabase,
// el proveedor de mensajería de YCloud y el caso de uso, a partir del entorno ya validado.
export function construirContenedor(env: Env): Contenedor {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  const clienteRepositorio = new ClienteRepositorio(supabase);
  const conversacionRepositorio = new ConversacionRepositorio(supabase);
  const pedidoRepositorio = new PedidoRepositorio(supabase);
  const mensajeRepositorio = new MensajeRepositorio(supabase);

  const proveedorMensajeria = new YCloudProveedor(env.YCLOUD_API_KEY, env.YCLOUD_NUMERO);

  const procesarMensajeEntrante = new ProcesarMensajeEntrante(
    clienteRepositorio,
    conversacionRepositorio,
    pedidoRepositorio,
    mensajeRepositorio,
    proveedorMensajeria,
    {
      CATALOGO_COMPLETO_URL: env.CATALOGO_COMPLETO_URL,
      CATALOGO_REDUCIDO_URL: env.CATALOGO_REDUCIDO_URL,
    },
  );

  return { procesarMensajeEntrante };
}
