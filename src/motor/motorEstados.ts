// Motor de estados determinista del bot. Función pura: no hace `await`, no llama a Supabase ni
// a YCloud. Ver la tabla completa de transiciones en docs/FLUJO_ESTADOS.md y la firma exacta en
// docs/CONTRATOS.md.
import { EstadoConversacion } from '../dominio/estadoConversacion';
import { desdeInicio } from './transiciones/desdeInicio';
import { desdeConsentimientoDatos } from './transiciones/desdeConsentimientoDatos';
import { desdeMenuPrincipal } from './transiciones/desdeMenuPrincipal';
import { desdeServicioCliente } from './transiciones/desdeServicioCliente';
import { desdeEsperandoTipoPqrsf } from './transiciones/desdeEsperandoTipoPqrsf';
import { desdeEsperandoPqrsfNombre } from './transiciones/desdeEsperandoPqrsfNombre';
import { desdeEsperandoPqrsfIdentificacion } from './transiciones/desdeEsperandoPqrsfIdentificacion';
import { desdeEsperandoPqrsfCorreo } from './transiciones/desdeEsperandoPqrsfCorreo';
import { desdeEsperandoPqrsfTirilla } from './transiciones/desdeEsperandoPqrsfTirilla';
import { desdeEsperandoQueja } from './transiciones/desdeEsperandoQueja';
import { desdeEsperandoNombre } from './transiciones/desdeEsperandoNombre';
import { desdeMenuVentas } from './transiciones/desdeMenuVentas';
import { desdeCatalogoEnviado } from './transiciones/desdeCatalogoEnviado';
import { desdeHandoff } from './transiciones/desdeHandoff';

// Qué debe persistir el caso de uso al llegar a HANDOFF_HUMANO — el motor es puro y no toca BD,
// así que solo describe la intención. `null` significa "transición normal, nada que persistir".
export type RegistroAlHandoff =
  | { tipo: 'pedido'; productoInteres: string; canal: 'detal' | 'distribucion' | 'negocio' }
  | { tipo: 'queja'; descripcion: string; tipoPqrsf: 'PQR' | 'Sugerencia' | 'Facturacion' };

export interface ResultadoTransicion {
  nuevoEstado: EstadoConversacion;
  respuestas: RespuestaBot[]; // una transición puede generar más de un mensaje de salida (ej. texto + catálogo)
  contextoParcheado: Record<string, unknown>;
  registro: RegistroAlHandoff | null;
}

// El motor es puro y no conoce la URL real del catálogo (vive en env, propiedad de la Parte 1/3)
// — por eso 'documento' no la trae directamente. El caso de uso
// (src/application/procesarMensajeEntrante.ts) la resuelve antes de llamar a
// IProveedorMensajeria.enviarDocumento. Un solo catálogo para las 3 categorías de Ventas (ya no
// hay distinción detal/distribución de documento, ver docs/FLUJO_ESTADOS.md).
//
// 'lista' representa un mensaje interactivo de WhatsApp (List Message) con opciones de selección
// única — para preguntas cerradas de más de 3 opciones (hoy sin uso activo, se deja por si hace
// falta a futuro). El motor sigue sin conocer el formato real de la API de WhatsApp/YCloud — solo
// expresa "pregunta con estas opciones"; la Parte 3 traduce esto al payload real.
export interface OpcionLista {
  id: string; // valor que llega de vuelta en `mensajeTexto` cuando el cliente selecciona esta opción
  titulo: string; // texto visible para el cliente en el menú
}

// 'botones' representa un WhatsApp Reply Button message (hasta 3 opciones, un solo toque, sin
// necesidad de abrir un menú) — se usa en preguntas cerradas con 2-3 opciones; 'lista' se reserva
// para las que tienen más de 3. Título de cada opción máx. 20 caracteres (WhatsApp), más corto que
// el límite de 24 de 'lista'.
// 'imagen' es una sola foto (sin nombre de archivo, a diferencia de 'documento') — hoy solo la usa
// MENU_VENTAS para la imagen fija de "cómo comprar" (ver desdeMenuVentas.ts); el caso de uso la
// resuelve a la URL configurada en env (COMO_COMPRAR_URL), igual que 'documento' con CATALOGO_URL.
export type RespuestaBot =
  | { tipo: 'texto'; contenido: string }
  | { tipo: 'documento'; nombre: string }
  | { tipo: 'imagen' }
  | { tipo: 'lista'; texto: string; opciones: OpcionLista[] }
  | { tipo: 'botones'; texto: string; opciones: OpcionLista[] };

export interface EntradaMotor {
  estadoActual: EstadoConversacion;
  mensajeTexto: string | null; // null si el mensaje entrante no es texto (audio/imagen/sticker)
  // Si el mensaje entrante es una foto/imagen — usado solo por ESPERANDO_PQRSF_TIRILLA para exigir
  // que llegue una foto de la tirilla antes de continuar (ver desdeEsperandoPqrsfTirilla.ts). El
  // bot no guarda la imagen en ningún lado: el equipo ya la ve en el mismo chat de WhatsApp
  // (coexistencia).
  esImagen: boolean;
  contexto: Record<string, unknown>;
  clienteYaTieneNombre: boolean; // para decidir si hace falta pedir nombre en la rama Ventas
  nombreCliente: string | null;
  huboInactividad: boolean; // calculado por la Parte 3 antes de llamar al motor
  // Si el cliente ya autorizó el tratamiento de datos (Ley 1581 de 2012) — mientras sea false,
  // desdeInicio.ts intercepta con ESPERANDO_CONSENTIMIENTO_DATOS en vez de MENU_PRINCIPAL, y
  // desdeMenuPrincipal.ts salta la captura de nombre en la rama Ventas (ver desdeConsentimientoDatos.ts).
  aceptoTratamientoDatos: boolean;
}

export type TransicionFn = (entrada: EntradaMotor) => ResultadoTransicion;

// Tabla de transiciones: una entrada por estado de origen, cada una definida en su propio
// archivo dentro de `transiciones/` (ver docs/ARQUITECTURA.md). Se usa un Record en vez de un
// switch/if largo para que agregar o modificar un estado no toque el resto de la tabla.
const tablaTransiciones: Record<EstadoConversacion, TransicionFn> = {
  [EstadoConversacion.INICIO]: desdeInicio,
  [EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS]: desdeConsentimientoDatos,
  [EstadoConversacion.MENU_PRINCIPAL]: desdeMenuPrincipal,
  [EstadoConversacion.SERVICIO_CLIENTE]: desdeServicioCliente,
  [EstadoConversacion.ESPERANDO_TIPO_PQRSF]: desdeEsperandoTipoPqrsf,
  [EstadoConversacion.ESPERANDO_PQRSF_NOMBRE]: desdeEsperandoPqrsfNombre,
  [EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION]: desdeEsperandoPqrsfIdentificacion,
  [EstadoConversacion.ESPERANDO_PQRSF_CORREO]: desdeEsperandoPqrsfCorreo,
  [EstadoConversacion.ESPERANDO_PQRSF_TIRILLA]: desdeEsperandoPqrsfTirilla,
  [EstadoConversacion.ESPERANDO_QUEJA]: desdeEsperandoQueja,
  [EstadoConversacion.ESPERANDO_NOMBRE]: desdeEsperandoNombre,
  [EstadoConversacion.MENU_VENTAS]: desdeMenuVentas,
  [EstadoConversacion.CATALOGO_ENVIADO]: desdeCatalogoEnviado,
  [EstadoConversacion.HANDOFF_HUMANO]: desdeHandoff,
};

export function procesarTransicion(entrada: EntradaMotor): ResultadoTransicion {
  // Regla de reinicio por inactividad (ver docs/FLUJO_ESTADOS.md): si hubo inactividad y el
  // estado guardado no es INICIO, el motor ignora ese estado y procesa el mensaje como si
  // viniera de INICIO — `desdeInicio` siempre lleva a MENU_PRINCIPAL, con saludo genérico o
  // personalizado según `clienteYaTieneNombre`.
  if (entrada.huboInactividad && entrada.estadoActual !== EstadoConversacion.INICIO) {
    return desdeInicio({ ...entrada, estadoActual: EstadoConversacion.INICIO });
  }

  const transicion = tablaTransiciones[entrada.estadoActual];
  return transicion(entrada);
}
