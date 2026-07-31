import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';
import { ClienteRepositorio } from '../datos/clienteRepositorio';
import { ConversacionRepositorio } from '../datos/conversacionRepositorio';
import { PedidoRepositorio } from '../datos/pedidoRepositorio';
import { ServicioClienteRepositorio } from '../datos/servicioClienteRepositorio';
import { YCloudProveedor } from '../mensajeria/ycloudProveedor';
import { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import type { IClienteRepository, IPedidoRepository, IServicioClienteRepository } from '../datos/tipos';

export interface Contenedor {
  procesarMensajeEntrante: ProcesarMensajeEntrante;
  // Expuestos para /dashboard (ver src/http/routes.ts) — solo lectura desde ahí.
  clienteRepositorio: IClienteRepository;
  pedidoRepositorio: IPedidoRepository;
  servicioClienteRepositorio: IServicioClienteRepository;
}

// Composición manual de dependencias (sin framework de DI) — instancia repos contra Supabase,
// el proveedor de mensajería de YCloud y el caso de uso, a partir del entorno ya validado.
export function construirContenedor(env: Env): Contenedor {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

  const clienteRepositorio = new ClienteRepositorio(supabase);
  const conversacionRepositorio = new ConversacionRepositorio(supabase);
  const pedidoRepositorio = new PedidoRepositorio(supabase);
  const servicioClienteRepositorio = new ServicioClienteRepositorio(supabase);

  const proveedorMensajeria = new YCloudProveedor(env.YCLOUD_API_KEY, env.YCLOUD_NUMERO);

  const procesarMensajeEntrante = new ProcesarMensajeEntrante(
    clienteRepositorio,
    conversacionRepositorio,
    pedidoRepositorio,
    servicioClienteRepositorio,
    proveedorMensajeria,
    env.CATALOGO_URL,
    env.VENTANA_INACTIVIDAD_HORAS,
    env.DELAY_TRAS_DOCUMENTO_MS,
  );

  return {
    procesarMensajeEntrante,
    clienteRepositorio,
    pedidoRepositorio,
    servicioClienteRepositorio,
  };
}
