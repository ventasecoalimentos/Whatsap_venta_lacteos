import type { Cliente, Pedido, Queja } from './types';

// Rutas relativas: en producción el build se sirve desde el mismo Express que expone la API
// (ver src/http/routes.ts) — mismo origen, sin necesidad de configurar una URL base ni CORS.
async function obtener<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) {
    throw new Error(`Error consultando ${ruta}: ${respuesta.status}`);
  }
  return respuesta.json() as Promise<T>;
}

export function obtenerClientes(): Promise<Cliente[]> {
  return obtener<Cliente[]>('/dashboard/api/clientes');
}

export function obtenerPedidos(): Promise<Pedido[]> {
  return obtener<Pedido[]>('/dashboard/api/pedidos');
}

export function obtenerQuejas(): Promise<Queja[]> {
  return obtener<Queja[]>('/dashboard/api/quejas');
}
