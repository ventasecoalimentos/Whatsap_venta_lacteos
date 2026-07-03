// Motor de estados determinista del bot. Función pura: no hace `await`, no llama a Supabase ni
// a YCloud. Ver la tabla completa de transiciones en docs/FLUJO_ESTADOS.md y la firma exacta en
// docs/CONTRATOS.md.
import { EstadoConversacion } from '../dominio/estadoConversacion';
import { desdeInicio } from './transiciones/desdeInicio';
import { desdeEsperandoNombre } from './transiciones/desdeEsperandoNombre';
import { desdeEsperandoCiudad } from './transiciones/desdeEsperandoCiudad';
import { desdeCatalogoEnviado } from './transiciones/desdeCatalogoEnviado';
import { desdeEsperandoInteres } from './transiciones/desdeEsperandoInteres';
import { desdeHandoff } from './transiciones/desdeHandoff';

export interface ResultadoTransicion {
  nuevoEstado: EstadoConversacion;
  respuestas: RespuestaBot[]; // una transición puede generar más de un mensaje de salida (ej. texto + catálogo)
  contextoParcheado: Record<string, unknown>;
  debeNotificarEquipo: boolean; // true solo en la transición hacia HANDOFF_HUMANO
}

export type RespuestaBot =
  | { tipo: 'texto'; contenido: string }
  | { tipo: 'documento'; urlOBase64: string; nombre: string };

export interface EntradaMotor {
  estadoActual: EstadoConversacion;
  mensajeTexto: string | null; // null si el mensaje entrante no es texto (audio/imagen/sticker)
  contexto: Record<string, unknown>;
  clienteYaTieneNombre: boolean; // para decidir INICIO → ESPERANDO_NOMBRE o ESPERANDO_CIUDAD
  nombreCliente: string | null;
  huboInactividad: boolean; // calculado por la Parte 3 antes de llamar al motor
}

export type TransicionFn = (entrada: EntradaMotor) => ResultadoTransicion;

// Tabla de transiciones: una entrada por estado de origen, cada una definida en su propio
// archivo dentro de `transiciones/` (ver docs/ARQUITECTURA.md). Se usa un Record en vez de un
// switch/if largo para que agregar o modificar un estado no toque el resto de la tabla.
const tablaTransiciones: Record<EstadoConversacion, TransicionFn> = {
  [EstadoConversacion.INICIO]: desdeInicio,
  [EstadoConversacion.ESPERANDO_NOMBRE]: desdeEsperandoNombre,
  [EstadoConversacion.ESPERANDO_CIUDAD]: desdeEsperandoCiudad,
  [EstadoConversacion.CATALOGO_ENVIADO]: desdeCatalogoEnviado,
  [EstadoConversacion.ESPERANDO_INTERES]: desdeEsperandoInteres,
  [EstadoConversacion.HANDOFF_HUMANO]: desdeHandoff,
};

export function procesarTransicion(entrada: EntradaMotor): ResultadoTransicion {
  // Regla de reinicio por inactividad (ver docs/FLUJO_ESTADOS.md): si hubo inactividad y el
  // estado guardado no es INICIO, el motor ignora ese estado y procesa el mensaje como si
  // viniera de INICIO. `desdeInicio` decide entre ESPERANDO_NOMBRE/ESPERANDO_CIUDAD usando
  // `clienteYaTieneNombre`, igual que en un primer contacto real.
  if (entrada.huboInactividad && entrada.estadoActual !== EstadoConversacion.INICIO) {
    return desdeInicio({ ...entrada, estadoActual: EstadoConversacion.INICIO });
  }

  const transicion = tablaTransiciones[entrada.estadoActual];
  return transicion(entrada);
}
