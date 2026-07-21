// Transición desde ESPERANDO_TIPO_PQRSF. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import { OPCIONES_TIPO_PQRSF, OPCION_PQR } from './opcionesTipoPqrsf';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';

export function desdeEsperandoTipoPqrsf(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_TIPO_PQRSF,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_TIPO_PQRSF);
  if (!opcion) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_TIPO_PQRSF,
      respuestas: [
        { tipo: 'botones', texto: MENSAJE_NO_RECONOCIDO, opciones: OPCIONES_TIPO_PQRSF },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const pqrsfTipo: 'PQR' | 'Sugerencia' = opcion.id === OPCION_PQR ? 'PQR' : 'Sugerencia';
  const contextoParcheado = { ...entrada.contexto, pqrsfTipo };

  // Si el cliente ya tiene nombre guardado (Ventas, perfil de WhatsApp, o un PQRSF anterior), no
  // se le vuelve a preguntar — se salta directo a identificación (ver docs/FLUJO_ESTADOS.md).
  if (entrada.clienteYaTieneNombre) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `Gracias, ${entrada.nombreCliente}. ¿Me compartes tu número de identificación (cédula o NIT)?`,
        },
      ],
      contextoParcheado,
      registro: null,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
    respuestas: [{ tipo: 'texto', contenido: '¿Cuál es tu nombre completo?' }],
    contextoParcheado,
    registro: null,
  };
}
