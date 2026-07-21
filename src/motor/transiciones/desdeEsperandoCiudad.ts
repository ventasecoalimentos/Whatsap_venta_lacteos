// Transición desde ESPERANDO_CIUDAD. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import { parsearCiudad, tieneCobertura } from '../../dominio/ciudad';
import type { EntradaMotor, ResultadoTransicion, RespuestaBot } from '../motorEstados';
import { OPCIONES_MENU_VENTAS } from './opcionesMenuVentas';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu ciudad, por favor?';

const MENU_VENTAS: RespuestaBot = {
  tipo: 'botones',
  texto: '¿Buscas comprar al detal o eres distribuidor?',
  opciones: OPCIONES_MENU_VENTAS,
};

export function desdeEsperandoCiudad(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_CIUDAD,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const ciudad = parsearCiudad(entrada.mensajeTexto);

  // Se guarda `ciudad` en el contexto para logística/notificación futura (ej. al armar el mensaje
  // de "NUEVO CLIENTE" al llegar a HANDOFF_HUMANO) — ya no determina qué catálogo se envía (eso
  // ahora depende de Detal/Distribución, ver docs/FLUJO_ESTADOS.md).
  const contextoParcheado = { ...entrada.contexto, ciudad };

  if (tieneCobertura(ciudad)) {
    return {
      nuevoEstado: EstadoConversacion.MENU_VENTAS,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `¡Perfecto! En ${ciudad} entregamos con cadena de frío completa.`,
        },
        MENU_VENTAS,
      ],
      contextoParcheado,
      registro: null,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.MENU_VENTAS,
    respuestas: [
      {
        tipo: 'texto',
        contenido:
          'Por ahora solo tenemos cobertura con cadena de frío en Bogotá, Yopal y Villavicencio. ' +
          'Para tu ciudad podemos ofrecerte nuestros productos empaquetados.',
      },
      MENU_VENTAS,
    ],
    contextoParcheado,
    registro: null,
  };
}
