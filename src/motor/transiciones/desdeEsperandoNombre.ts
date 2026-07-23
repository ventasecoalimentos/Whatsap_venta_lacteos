// Transición desde ESPERANDO_NOMBRE. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { OPCIONES_MENU_VENTAS } from './opcionesMenuVentas';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu nombre, por favor?';

export function desdeEsperandoNombre(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_NOMBRE,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // Texto libre: se usa tal cual como nombre (ver docs/FLUJO_ESTADOS.md).
  const nombre = entrada.mensajeTexto.trim();

  // Se guarda también en `contextoParcheado` (además de que la Parte 3 lo persista en
  // `clientes.nombre` vía IClienteRepository.actualizarNombre) para que quede disponible en
  // `contexto` en transiciones futuras dentro de la misma conversación, sin depender de que el
  // motor vuelva a recibir `nombreCliente` recién persistido en el mismo turno.
  const contextoParcheado = { ...entrada.contexto, nombre };

  return {
    nuevoEstado: EstadoConversacion.MENU_VENTAS,
    respuestas: [
      {
        tipo: 'botones',
        texto: `¡Un gusto, ${nombre}!\n¿Buscas comprar al detal, eres distribuidor o tienes un negocio?`,
        opciones: OPCIONES_MENU_VENTAS,
      },
    ],
    contextoParcheado,
    registro: null,
  };
}
