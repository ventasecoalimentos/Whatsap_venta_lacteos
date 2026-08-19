// Tipos de datos y contratos de repositorios (Parte 1).
//
// El enum de dominio (EstadoConversacion) lo define la Parte 2 en `src/dominio/*` — aquí solo se
// re-exporta para que quien importe desde `src/datos/tipos.ts` no necesite conocer la ubicación
// real del dominio (ver docs/ARQUITECTURA.md y docs/CONTRATOS.md).
export { EstadoConversacion } from '../dominio/estadoConversacion';

import type { EstadoConversacion } from '../dominio/estadoConversacion';
import type { IdentificadorCliente } from '../dominio/identificadorCliente';

export interface Cliente {
  id: string;
  telefono: string | null; // E.164, ej: +573001234567 — null si el cliente solo tiene bsuid
  // Business-Scoped User ID (ver docs/INTEGRACION_YCLOUD.md) — identifica a un cliente que
  // escribió con un username de WhatsApp sin compartir su número. Exactamente uno de
  // telefono/bsuid está presente siempre (constraint en schema.sql), nunca ambos ni ninguno.
  bsuid: string | null;
  nombre: string | null;
  // Ya no se pregunta (el asesor humano maneja la logística, ver docs/FLUJO_ESTADOS.md) — se deja
  // nullable por compatibilidad con clientes registrados antes de este cambio.
  ciudad: string | null;
  fechaRegistro: Date;
  ultimaInteraccion: Date | null;
  aceptoTratamientoDatos: boolean; // Ley 1581 de 2012 — ver ESPERANDO_CONSENTIMIENTO_DATOS
  // Datos del PQRSF/Facturación (ver ESPERANDO_PQRSF_IDENTIFICACION/CORREO) — el nombre usa
  // `nombre` (mismo campo que el saludo/Ventas, ver ESPERANDO_PQRSF_NOMBRE): son atributos del
  // cliente, no de cada solicitud puntual, así que viven aquí y no en `servicio_cliente`.
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
  // Ya no se captura (ver docs/FLUJO_ESTADOS.md) — nullable, solo por compatibilidad con pedidos
  // anteriores a este cambio.
  ciudad: string | null;
  canal: 'detal' | 'distribucion' | 'negocio';
  creadoEn: Date;
}

// Fila de la tabla `servicio_cliente` — un registro de PQR, Sugerencia o Facturación (se llamaba
// `Queja`, pero ya no son solo quejas desde que Facturación vive aquí también).
export interface RegistroServicioCliente {
  id: string;
  clienteId: string;
  descripcion: string;
  tipo: 'PQR' | 'Sugerencia' | 'Facturacion'; // clasificación elegida en Servicio al cliente
  creadoEn: Date;
}

export interface IClienteRepository {
  buscarPorTelefono(telefono: string): Promise<Cliente | null>;
  buscarPorBsuid(bsuid: string): Promise<Cliente | null>;
  // Despacha a buscarPorTelefono o buscarPorBsuid según el tipo — conveniencia para los dos
  // puntos que reciben un identificador ya resuelto de un mensaje entrante (procesarMensajeEntrante.ts,
  // registrarRespuestaAsesor.ts) sin que cada uno repita el switch.
  buscarPorIdentificador(identificador: IdentificadorCliente): Promise<Cliente | null>;
  // Usado por tareaCierreHandoff.ts para resolver el cliente a partir de Conversacion.clienteId.
  buscarPorId(id: string): Promise<Cliente | null>;
  crear(datos: {
    identificador: IdentificadorCliente;
    nombre: string | null;
    ciudad: string | null;
  }): Promise<Cliente>;
  actualizarNombre(id: string, nombre: string): Promise<void>;
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
  // Usado por tareaCierreHandoff.ts para encontrar las conversaciones en HANDOFF_HUMANO en cada
  // revisión periódica.
  listarPorEstado(estado: EstadoConversacion): Promise<Conversacion[]>;
  // A diferencia de actualizarEstado, no toca `actualizada_en` — se usa para marcar que ya se
  // envió el aviso previo al cierre (ver tareaCierreHandoff.ts) sin resetear el reloj de
  // inactividad, que es justamente lo que ese aviso está anunciando.
  actualizarContexto(id: string, contexto: Record<string, unknown>): Promise<void>;
  // Lo opuesto a actualizarContexto: SOLO toca `actualizada_en`, sin tocar estado ni contexto —
  // usado por registrarRespuestaAsesor.ts cuando el asesor responde desde la app nativa (evento
  // whatsapp.smb.message.echoes), para que su mensaje también aplace el cierre automático de
  // HANDOFF_HUMANO igual que lo hace un mensaje del cliente.
  tocarActividad(id: string): Promise<void>;
  // Conversaciones "a medias" del flujo del bot: ni INICIO (nada que abandonar) ni HANDOFF_HUMANO
  // (tiene su propio camino en listarPorEstado). Usado por tareaCierreHandoff.ts para cerrar
  // proactivamente a un cliente que quedó a mitad de un menú y nunca volvió a escribir — hasta
  // ahora ese caso solo se resolvía de forma reactiva (si el cliente escribía de nuevo algún día).
  listarEnProgreso(): Promise<Conversacion[]>;
}

export interface IPedidoRepository {
  crear(datos: {
    clienteId: string;
    productoInteres: string;
    canal: 'detal' | 'distribucion' | 'negocio';
  }): Promise<Pedido>;
  listarTodos(): Promise<Pedido[]>; // ver /dashboard, docs/ARQUITECTURA.md
}

export interface IServicioClienteRepository {
  crear(datos: {
    clienteId: string;
    descripcion: string;
    tipo: 'PQR' | 'Sugerencia' | 'Facturacion';
  }): Promise<RegistroServicioCliente>;
  listarTodos(): Promise<RegistroServicioCliente[]>; // ver /dashboard, docs/ARQUITECTURA.md
}
