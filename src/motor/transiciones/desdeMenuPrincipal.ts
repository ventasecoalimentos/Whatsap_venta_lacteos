// Transición desde MENU_PRINCIPAL. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import {
  OPCIONES_MENU_PRINCIPAL,
  OPCION_SERVICIO_CLIENTE,
} from './opcionesMenuPrincipal';
import { OPCIONES_SERVICIO_CLIENTE } from './opcionesServicioCliente';
import { volverAMenuVentas } from './volverAMenuVentas';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';

function mostrarMenu(texto: string, contexto: Record<string, unknown>): ResultadoTransicion {
  return {
    nuevoEstado: EstadoConversacion.MENU_PRINCIPAL,
    respuestas: [{ tipo: 'botones', texto, opciones: OPCIONES_MENU_PRINCIPAL }],
    contextoParcheado: contexto,
    registro: null,
  };
}

export function desdeMenuPrincipal(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.MENU_PRINCIPAL,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_MENU_PRINCIPAL);
  if (!opcion) {
    return mostrarMenu(MENSAJE_NO_RECONOCIDO, entrada.contexto);
  }

  if (opcion.id === OPCION_SERVICIO_CLIENTE) {
    return {
      nuevoEstado: EstadoConversacion.SERVICIO_CLIENTE,
      respuestas: [
        { tipo: 'botones', texto: '¿En qué te podemos ayudar?', opciones: OPCIONES_SERVICIO_CLIENTE },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // OPCION_VENTAS — el nombre ya se preguntó justo después de responder el consentimiento de
  // datos (ver desdeConsentimientoDatos.ts/desdeEsperandoNombre.ts), así que para cuando el
  // cliente llega aquí siempre hay un nombre disponible. Ya no se pregunta ciudad (el asesor
  // humano se encarga de la logística) — ver docs/FLUJO_ESTADOS.md.
  return volverAMenuVentas(entrada.contexto);
}
