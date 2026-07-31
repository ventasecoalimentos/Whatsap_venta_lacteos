// Transición desde SERVICIO_CLIENTE. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import {
  OPCIONES_SERVICIO_CLIENTE,
  OPCION_FACTURACION,
  OPCION_MENU_ANTERIOR,
} from './opcionesServicioCliente';
import { iniciarCapturaPqrsf } from './iniciarCapturaPqrsf';
import { volverAMenuPrincipal } from './volverAMenuPrincipal';
import { OPCIONES_TIPO_PQRSF } from './opcionesTipoPqrsf';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';

export function desdeServicioCliente(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.SERVICIO_CLIENTE,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_SERVICIO_CLIENTE);
  if (!opcion) {
    return {
      nuevoEstado: EstadoConversacion.SERVICIO_CLIENTE,
      respuestas: [
        { tipo: 'botones', texto: MENSAJE_NO_RECONOCIDO, opciones: OPCIONES_SERVICIO_CLIENTE },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  if (opcion.id === OPCION_MENU_ANTERIOR) {
    return volverAMenuPrincipal(entrada.nombreCliente, entrada.contexto);
  }

  if (opcion.id === OPCION_FACTURACION) {
    return iniciarCapturaPqrsf(entrada, 'Facturacion', true);
  }

  // OPCION_PQRSF — primero se clasifica el tipo (ver desdeEsperandoTipoPqrsf.ts), luego se piden
  // los datos de contacto (desdeEsperandoPqrsfNombre.ts / Identificacion.ts / Correo.ts).
  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_TIPO_PQRSF,
    respuestas: [
      {
        tipo: 'botones',
        texto:
          'Con gusto te ayudamos con tu PQRSF 📋\n\nCuéntanos, ¿qué tipo de solicitud tienes?\n\n• *PQR*: Petición, queja o reclamo\n• *Sugerencia/Felicitación*: Cuéntanos una sugerencia o compártenos una felicitación',
        opciones: OPCIONES_TIPO_PQRSF,
      },
    ],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
