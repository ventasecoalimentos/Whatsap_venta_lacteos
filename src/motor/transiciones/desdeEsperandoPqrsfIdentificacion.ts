// Transición desde ESPERANDO_PQRSF_IDENTIFICACION. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu número de identificación, por favor?';
// Mínimo de dígitos para aceptar una cédula/NIT — lo suficientemente bajo para no rechazar
// cédulas antiguas más cortas, pero descarta texto que claramente no es un número de
// identificación (ej. "no tengo" o un solo dígito).
const MINIMO_DIGITOS_IDENTIFICACION = 5;

export function desdeEsperandoPqrsfIdentificacion(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // Solo se toman los dígitos — tolera que el cliente escriba puntos, guiones o un prefijo como
  // "NIT:" o "CC " antes del número (ej. "nit: 11111" se guarda como "11111").
  const pqrsfIdentificacion = entrada.mensajeTexto.replace(/\D/g, '');

  if (pqrsfIdentificacion.length < MINIMO_DIGITOS_IDENTIFICACION) {
    return {
        nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
        respuestas: [
          {
            tipo: 'texto',
            contenido: 'Ese número de identificación no parece válido 🤔 ¿me compartes solo los números de tu cédula o NIT?',
        },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
    respuestas: [
      {
        tipo: 'texto',
        contenido: 'Perfecto. ¿Me compartes el correo electrónico? 📧',
      },
    ],
    contextoParcheado: { ...entrada.contexto, pqrsfIdentificacion },
    registro: null,
  };
}
