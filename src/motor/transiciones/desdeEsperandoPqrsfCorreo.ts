// Transición desde ESPERANDO_PQRSF_CORREO. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu correo electrónico, por favor?';

export function desdeEsperandoPqrsfCorreo(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const pqrsfCorreo = entrada.mensajeTexto.trim();

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_QUEJA,
    respuestas: [
      {
        tipo: 'texto',
        contenido: 'Ya casi terminamos 🙌 Cuéntanos con detalle qué sucedió, para poder ayudarte de la mejor manera.',
      },
    ],
    contextoParcheado: { ...entrada.contexto, pqrsfCorreo },
    registro: null,
  };
}
