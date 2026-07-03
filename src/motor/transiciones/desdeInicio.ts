// Transición desde INICIO (o desde cualquier estado reiniciado por inactividad — ver
// motorEstados.ts). Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme, por favor?';

export function desdeInicio(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.INICIO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      debeNotificarEquipo: false,
    };
  }

  if (entrada.clienteYaTieneNombre) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_CIUDAD,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `¡Hola de nuevo, ${entrada.nombreCliente}! ¿Desde qué ciudad nos escribes hoy?`,
        },
      ],
      contextoParcheado: entrada.contexto,
      debeNotificarEquipo: false,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_NOMBRE,
    respuestas: [
      {
        tipo: 'texto',
        contenido:
          '¡Hola! Bienvenido/a a nuestra tienda de lácteos y derivados. Para atenderte, ¿cuál es tu nombre?',
      },
    ],
    contextoParcheado: entrada.contexto,
    debeNotificarEquipo: false,
  };
}
