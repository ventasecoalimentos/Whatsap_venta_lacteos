// Transición desde ESPERANDO_PQRSF_CORREO. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu correo electrónico, por favor?';

// Valida solo la estructura (algo@algo.algo), no el dominio — hay correos personalizados/propios
// que no se pueden verificar por DNS/MX sin una llamada externa, y no vale la pena aquí.
const PARECE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MENSAJE_SELECCION_INTERACTIVA =
  'Creo que tocaste una opción de un menú anterior 🙂 ¿me compartes tu correo electrónico?';

export function desdeEsperandoPqrsfCorreo(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // Ver desdeEsperandoNombre.ts: un botón de un menú anterior sigue siendo tocable. En la práctica
  // ya casi siempre queda descartado por la validación de formato de abajo, pero no depender de eso.
  if (entrada.esSeleccionInteractiva) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_SELECCION_INTERACTIVA }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const pqrsfCorreo = entrada.mensajeTexto.trim();

  if (!PARECE_CORREO.test(pqrsfCorreo)) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
      respuestas: [
        {
          tipo: 'texto',
          contenido: 'Ese correo no parece válido 🤔 ¿me lo compartes de nuevo? (ej: nombre@correo.com)',
        },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const contextoParcheado = { ...entrada.contexto, pqrsfCorreo };

  // Facturación no pide descripción libre (no es una queja) — pasa a pedir la foto de la tirilla
  // (ver desdeEsperandoPqrsfTirilla.ts), sin pasar por HANDOFF_HUMANO.
  const pqrsfTipo = entrada.contexto['pqrsfTipo'] as 'PQR' | 'Sugerencia' | 'Facturacion' | undefined;
  if (pqrsfTipo === 'Facturacion') {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_TIRILLA,
      respuestas: [
        {
          tipo: 'texto',
          contenido:
            'Para tramitar tu factura electrónica:\ncompártenos una foto 📸 de la tirilla o recibo de tu compra 🧾',
        },
      ],
      contextoParcheado,
      registro: null,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_QUEJA,
    respuestas: [
      {
        tipo: 'texto',
        contenido: 'Ya casi terminamos 🙌 Cuéntanos con detalle qué sucedió, para poder ayudarte de la mejor manera.',
      },
    ],
    contextoParcheado,
    registro: null,
  };
}
