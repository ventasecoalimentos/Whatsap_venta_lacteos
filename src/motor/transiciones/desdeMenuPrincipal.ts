// Transición desde MENU_PRINCIPAL. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import {
  OPCIONES_MENU_PRINCIPAL,
  OPCION_SERVICIO_CLIENTE,
} from './opcionesMenuPrincipal';
import { OPCIONES_SERVICIO_CLIENTE } from './opcionesServicioCliente';
import { OPCIONES_CIUDAD } from './opcionesCiudad';
import { OPCIONES_CONFIRMAR_NOMBRE } from './opcionesConfirmarNombre';

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

  // OPCION_VENTAS — el nombre solo se pide aquí, no antes (ver docs/FLUJO_ESTADOS.md). Si el
  // cliente no autorizó el tratamiento de datos, no se le pide el nombre (ya se guardó el de
  // perfil de WhatsApp si estaba disponible, o quedó sin nombre — ver desdeConsentimientoDatos.ts
  // y procesarMensajeEntrante.ts) y se salta directo a ESPERANDO_CIUDAD.
  if (!entrada.clienteYaTieneNombre && entrada.aceptoTratamientoDatos) {
    // Si WhatsApp trae el nombre de perfil del remitente, se le ofrece usarlo en vez de preguntar
    // directamente — mejor experiencia, menos fricción (ver desdeConfirmarNombre.ts).
    if (entrada.nombrePerfilWhatsApp) {
      return {
        nuevoEstado: EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL,
        respuestas: [
          {
            tipo: 'botones',
            texto: `¡Hola, ${entrada.nombrePerfilWhatsApp}! ¿Te puedo llamar así, o prefieres escribir tu nombre?`,
            opciones: OPCIONES_CONFIRMAR_NOMBRE,
          },
        ],
        // Se guarda en contexto por si WhatsApp no repite el nombre de perfil en la respuesta al menú.
        contextoParcheado: { ...entrada.contexto, nombrePerfilWhatsApp: entrada.nombrePerfilWhatsApp },
        registro: null,
      };
    }

    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_NOMBRE,
      respuestas: [{ tipo: 'texto', contenido: 'Para darte una atención más personal, cuéntame ¿cuál es tu nombre? 😊' }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_CIUDAD,
    respuestas: [
      { tipo: 'lista', texto: '¿Desde qué ciudad nos escribes?', opciones: OPCIONES_CIUDAD },
    ],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
