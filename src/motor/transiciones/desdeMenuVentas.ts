// Transición desde MENU_VENTAS. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import {
  OPCIONES_MENU_VENTAS,
  OPCION_DETAL,
  OPCION_DISTRIBUCION,
} from './opcionesMenuVentas';
import { OPCIONES_CATALOGO } from './opcionesCatalogo';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';

export function desdeMenuVentas(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.MENU_VENTAS,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_MENU_VENTAS);
  if (!opcion) {
    return {
      nuevoEstado: EstadoConversacion.MENU_VENTAS,
      respuestas: [{ tipo: 'botones', texto: MENSAJE_NO_RECONOCIDO, opciones: OPCIONES_MENU_VENTAS }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // Un solo catálogo para las 3 categorías (Detal/Distribuidor/Negocio) — la lista de precios la
  // envía el asesor humano, no el bot (ver docs/FLUJO_ESTADOS.md). El canal elegido solo se guarda
  // en el contexto para clasificar el pedido al llegar a HANDOFF_HUMANO (ver cerrarPedido.ts).
  const canal: 'detal' | 'distribucion' | 'negocio' =
    opcion.id === OPCION_DETAL ? 'detal' : opcion.id === OPCION_DISTRIBUCION ? 'distribucion' : 'negocio';

  return {
    nuevoEstado: EstadoConversacion.CATALOGO_ENVIADO,
    respuestas: [
      { tipo: 'texto', contenido: 'Aquí tienes nuestro catálogo:' },
      { tipo: 'documento', nombre: 'catalogo-llano-lacteos.pdf' },
      {
        tipo: 'botones',
        texto: '¿Seguimos con tu pedido?\n\n_Escribe 1️⃣ para volver al menú principal._',
        opciones: OPCIONES_CATALOGO,
      },
    ],
    contextoParcheado: { ...entrada.contexto, canal },
    registro: null,
  };
}
