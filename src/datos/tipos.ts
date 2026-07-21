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
  aceptoTratamientoDatos: boolean; // Ley 1581 de 2012 — ver ESPERANDO_CONSENTIMIENTO_DATOS
  // Datos del PQRSF (ver ESPERANDO_PQRSF_IDENTIFICACION/CORREO) — el nombre usa `nombre` (mismo
  // campo que el saludo/Ventas, ver ESPERANDO_PQRSF_NOMBRE): son atributos del cliente, no de cada
  // queja puntual, así que viven aquí y no en `quejas` (evita duplicar identidad en cada fila).
  identificacion: string | null;
  correo: string | null;
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
  canal: 'detal' | 'distribucion';
  creadoEn: Date;
}

export interface Queja {
  id: string;
  clienteId: string;
  descripcion: string;
  tipo: 'PQR' | 'Sugerencia'; // clasificación elegida en ESPERANDO_TIPO_PQRSF
  creadoEn: Date;
}

export interface IClienteRepository {
  buscarPorTelefono(telefono: string): Promise<Cliente | null>;
  crear(datos: { telefono: string; nombre: string | null; ciudad: string | null }): Promise<Cliente>;
  actualizarNombre(id: string, nombre: string): Promise<void>;
  actualizarCiudad(id: string, ciudad: string): Promise<void>;
  actualizarUltimaInteraccion(id: string): Promise<void>;
  actualizarConsentimiento(id: string, aceptoTratamientoDatos: boolean): Promise<void>;
  actualizarIdentificacion(id: string, identificacion: string): Promise<void>;
  actualizarCorreo(id: string, correo: string): Promise<void>;
  listarTodos(): Promise<Cliente[]>; // ver /dashboard, docs/ARQUITECTURA.md
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
  crear(datos: {
    clienteId: string;
    productoInteres: string;
    ciudad: string;
    canal: 'detal' | 'distribucion';
  }): Promise<Pedido>;
  listarTodos(): Promise<Pedido[]>; // ver /dashboard, docs/ARQUITECTURA.md
}

export interface IQuejaRepository {
  crear(datos: {
    clienteId: string;
    descripcion: string;
    tipo: 'PQR' | 'Sugerencia';
  }): Promise<Queja>;
  listarTodos(): Promise<Queja[]>; // ver /dashboard, docs/ARQUITECTURA.md
}
