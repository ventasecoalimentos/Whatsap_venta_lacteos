// Transición desde CATALOGO_ENVIADO (reemplaza a los antiguos CATALOGO_DETAL/CATALOGO_DISTRIB —
// con un solo catálogo para las 3 categorías, el comportamiento es idéntico sin importar el canal
// elegido). Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import { OPCIONES_CATALOGO, OPCION_VOLVER_MENU } from './opcionesCatalogo';
import { volverAMenuVentas } from './volverAMenuVentas';
import { volverAMenuPrincipal } from './volverAMenuPrincipal';
import { cerrarPedido } from './cerrarPedido';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';
const CANAL_POR_DEFECTO = 'detal';

export function desdeCatalogoEnviado(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.CATALOGO_ENVIADO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // Atajo de texto: "1" salta directo a MENU_PRINCIPAL (distinto del botón "Menú anterior", que
  // solo retrocede a MENU_VENTAS — ver opcionesCatalogo.ts).
  if (entrada.mensajeTexto.trim() === '1') {
    return volverAMenuPrincipal(entrada.nombreCliente, entrada.contexto);
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_CATALOGO);

  if (!opcion) {
    return {
      nuevoEstado: EstadoConversacion.CATALOGO_ENVIADO,
      respuestas: [{ tipo: 'botones', texto: MENSAJE_NO_RECONOCIDO, opciones: OPCIONES_CATALOGO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  if (opcion.id === OPCION_VOLVER_MENU) {
    return volverAMenuVentas(entrada.contexto);
  }

  // OPCION_QUIERO_COMPRAR
  const canal =
    (entrada.contexto['canal'] as 'detal' | 'distribucion' | 'negocio' | undefined) ?? CANAL_POR_DEFECTO;
  return cerrarPedido(entrada.contexto, canal);
}
