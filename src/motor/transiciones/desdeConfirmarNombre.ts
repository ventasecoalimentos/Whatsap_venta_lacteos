// Transición desde CONFIRMAR_NOMBRE_PERFIL. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import { OPCIONES_CONFIRMAR_NOMBRE, OPCION_USAR_NOMBRE } from './opcionesConfirmarNombre';
import { OPCIONES_MENU_VENTAS } from './opcionesMenuVentas';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';
const MENSAJE_PEDIR_NOMBRE = 'Para darte una atención más personal, cuéntame ¿cuál es tu nombre? 😊';

export function desdeConfirmarNombre(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_CONFIRMAR_NOMBRE);
  if (!opcion) {
    return {
      nuevoEstado: EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL,
      respuestas: [
        { tipo: 'botones', texto: MENSAJE_NO_RECONOCIDO, opciones: OPCIONES_CONFIRMAR_NOMBRE },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  if (opcion.id === OPCION_USAR_NOMBRE) {
    // El nombre de perfil puede venir en `entrada.nombrePerfilWhatsApp` (mismo turno) o, si
    // WhatsApp no lo repite en la respuesta al menú, en `contexto` (lo guardó
    // `desdeMenuPrincipal.ts` al entrar a este estado) — se intenta ambos por robustez.
    const nombre =
      entrada.nombrePerfilWhatsApp ??
      (entrada.contexto['nombrePerfilWhatsApp'] as string | undefined) ??
      'Cliente';

    return {
      nuevoEstado: EstadoConversacion.MENU_VENTAS,
      respuestas: [
        {
          tipo: 'botones',
          texto: `¡Un gusto, ${nombre}!\n¿Buscas comprar al detal, eres distribuidor o tienes un negocio?`,
          opciones: OPCIONES_MENU_VENTAS,
        },
      ],
      contextoParcheado: { ...entrada.contexto, nombre },
      registro: null,
    };
  }

  // OPCION_ESCRIBIR_OTRO
  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_NOMBRE,
    respuestas: [{ tipo: 'texto', contenido: MENSAJE_PEDIR_NOMBRE }],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
