// Transición desde ESPERANDO_NOMBRE (se llega aquí justo después de responder el consentimiento
// de datos, ver desdeConsentimientoDatos.ts). Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { OPCIONES_MENU_PRINCIPAL } from './opcionesMenuPrincipal';

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
    nuevoEstado: EstadoConversacion.MENU_PRINCIPAL,
    respuestas: [
      { tipo: 'botones', texto: `¿${nombre}, en qué te podemos ayudar?`, opciones: OPCIONES_MENU_PRINCIPAL },
    ],
    contextoParcheado,
    registro: null,
  };
}
