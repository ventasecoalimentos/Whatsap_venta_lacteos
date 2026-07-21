// Compartido por CATALOGO_DETAL y CATALOGO_DISTRIB cuando el cliente elige "Menú anterior" — no
// vuelve al menú principal, sino un paso atrás: a elegir Detal/Distribución (MENU_VENTAS). Ver
// docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { ResultadoTransicion } from '../motorEstados';
import { OPCIONES_MENU_VENTAS } from './opcionesMenuVentas';

export function volverAMenuVentas(contexto: Record<string, unknown>): ResultadoTransicion {
  return {
    nuevoEstado: EstadoConversacion.MENU_VENTAS,
    respuestas: [
      { tipo: 'botones', texto: '¿Buscas comprar al detal o eres distribuidor?', opciones: OPCIONES_MENU_VENTAS },
    ],
    contextoParcheado: contexto,
    registro: null,
  };
}
