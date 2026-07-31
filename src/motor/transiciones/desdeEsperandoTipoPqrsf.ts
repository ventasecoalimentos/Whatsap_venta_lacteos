// Transición desde ESPERANDO_TIPO_PQRSF. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import { OPCIONES_TIPO_PQRSF, OPCION_PQR } from './opcionesTipoPqrsf';
import { iniciarCapturaPqrsf } from './iniciarCapturaPqrsf';

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

  if (opcion.id === OPCION_PQR) {
    return iniciarCapturaPqrsf(entrada, 'PQR');
  }

  // Sugerencia/Felicitación: a diferencia de PQR, no se pide identificación ni correo (no hace
  // falta que un asesor le dé seguimiento) — se guarda el nombre que ya se tiene y se va directo
  // a pedir el comentario (ver desdeEsperandoQueja.ts).
  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_QUEJA,
    respuestas: [
      { tipo: 'texto', contenido: '¡Con gusto! 🙌 Cuéntanos tu sugerencia o felicitación con toda confianza.' },
    ],
    contextoParcheado: { ...entrada.contexto, pqrsfTipo: 'Sugerencia' },
    registro: null,
  };
}
