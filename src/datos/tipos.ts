// Tipos de datos y contratos de repositorios (Parte 1).
//
// Los enums de dominio (EstadoConversacion, Ciudad) los define la Parte 2 en `src/dominio/*` —
// aquí solo se re-exportan para que quien importe desde `src/datos/tipos.ts` no necesite conocer
// la ubicación real del dominio (ver docs/ARQUITECTURA.md y docs/CONTRATOS.md).
export { EstadoConversacion } from '../dominio/estadoConversacion';
export { Ciudad } from '../dominio/ciudad';

import type { EstadoConversacion } from '../dominio/estadoConversacion';

export interface Cliente {
  id: string;
  telefono: string; // E.164, ej: +573001234567
  nombre: string | null;
  ciudad: string | null;
  fechaRegistro: Date;
  ultimaInteraccion: Date | null;
}

export interface Conversacion {
  id: string;
  clienteId: string;
  estadoActual: EstadoConversacion;
  contexto: Record<string, unknown>;
  iniciadaEn: Date;
  actualizadaEn: Date;
}

export interface Pedido {
  id: string;
  clienteId: string;
  productoInteres: string;
  ciudad: string;
  creadoEn: Date;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  direccion: 'in' | 'out';
  contenido: string;
  timestamp: Date;
}

export interface IClienteRepository {
  buscarPorTelefono(telefono: string): Promise<Cliente | null>;
  crear(datos: { telefono: string; nombre: string | null; ciudad: string | null }): Promise<Cliente>;
  actualizarNombre(id: string, nombre: string): Promise<void>;
  actualizarCiudad(id: string, ciudad: string): Promise<void>;
  actualizarUltimaInteraccion(id: string): Promise<void>;
}

export interface IConversacionRepository {
  // Una sola conversación por cliente (ver docs/MODELO_DATOS.md) — obtiene o crea.
  obtenerOCrear(clienteId: string): Promise<Conversacion>;
  actualizarEstado(
    id: string,
    estado: EstadoConversacion,
    contexto: Record<string, unknown>,
  ): Promise<void>;
}

export interface IPedidoRepository {
  crear(datos: { clienteId: string; productoInteres: string; ciudad: string }): Promise<Pedido>;
}

export interface IMensajeRepository {
  registrar(datos: { conversacionId: string; direccion: 'in' | 'out'; contenido: string }): Promise<void>;
}
