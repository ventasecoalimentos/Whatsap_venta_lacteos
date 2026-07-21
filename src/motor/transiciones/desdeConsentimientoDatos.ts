// Transición desde ESPERANDO_CONSENTIMIENTO_DATOS. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import {
  OPCIONES_CONSENTIMIENTO_DATOS,
  OPCION_AUTORIZO,
} from './opcionesConsentimientoDatos';
import { OPCIONES_MENU_PRINCIPAL } from './opcionesMenuPrincipal';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';

export function desdeConsentimientoDatos(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_CONSENTIMIENTO_DATOS);
  if (!opcion) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
      respuestas: [
        { tipo: 'botones', texto: MENSAJE_NO_RECONOCIDO, opciones: OPCIONES_CONSENTIMIENTO_DATOS },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // `contextoParcheado.aceptoTratamientoDatos` es lo que el caso de uso (procesarMensajeEntrante.ts)
  // lee para persistir el consentimiento en `clientes` — si declina, además guarda el nombre de
  // perfil de WhatsApp (si vino) en vez de preguntarlo (ver desdeMenuPrincipal.ts). El saludo ya
  // se mandó antes de preguntar el consentimiento (ver desdeInicio.ts), así que aquí no se repite.
  const autorizo = opcion.id === OPCION_AUTORIZO;

  return {
    nuevoEstado: EstadoConversacion.MENU_PRINCIPAL,
    respuestas: [
      { tipo: 'botones', texto: '¿En qué te podemos ayudar?', opciones: OPCIONES_MENU_PRINCIPAL },
    ],
    contextoParcheado: { ...entrada.contexto, aceptoTratamientoDatos: autorizo },
    registro: null,
  };
}
