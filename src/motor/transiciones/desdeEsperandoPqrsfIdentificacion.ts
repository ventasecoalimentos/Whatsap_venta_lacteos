// Transición desde ESPERANDO_PQRSF_IDENTIFICACION. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu número de identificación, por favor?';

export function desdeEsperandoPqrsfIdentificacion(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const pqrsfIdentificacion = entrada.mensajeTexto.trim();

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
    respuestas: [
      {
        tipo: 'texto',
        contenido: 'Perfecto. ¿A qué correo electrónico podemos escribirte para dar respuesta? 📧',
      },
    ],
    contextoParcheado: { ...entrada.contexto, pqrsfIdentificacion },
    registro: null,
  };
}
