// Transición desde ESPERANDO_PQRSF_NOMBRE. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu nombre completo, por favor?';

export function desdeEsperandoPqrsfNombre(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // Se guarda en `contexto.nombre` — el mismo campo que usa el resto del bot (Ventas/saludo, ver
  // desdeEsperandoNombre.ts) y que la Parte 3 persiste en `clientes.nombre` (ver
  // procesarMensajeEntrante.ts). Solo se pregunta aquí si el cliente aún no tenía nombre guardado
  // (ver desdeEsperandoTipoPqrsf.ts).
  const nombre = entrada.mensajeTexto.trim();

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
    respuestas: [
      {
        tipo: 'texto',
        contenido: `Gracias, ${nombre}. ¿Me compartes tu número de identificación (cédula o NIT)?`,
      },
    ],
    contextoParcheado: { ...entrada.contexto, nombre },
    registro: null,
  };
}
