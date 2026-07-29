// Compartido por todos los puntos de entrada a MENU_VENTAS: cliente eligiendo "Ventas" desde
// MENU_PRINCIPAL (ya tiene nombre, ver desdeMenuPrincipal.ts) o "Menú anterior" desde
// CATALOGO_ENVIADO. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { ResultadoTransicion } from '../motorEstados';
import { OPCIONES_MENU_VENTAS } from './opcionesMenuVentas';

export function volverAMenuVentas(contexto: Record<string, unknown>): ResultadoTransicion {
  return {
    nuevoEstado: EstadoConversacion.MENU_VENTAS,
    respuestas: [
      {
        tipo: 'botones',
        texto: '¿Buscas comprar al detal, eres distribuidor o tienes un negocio?',
        opciones: OPCIONES_MENU_VENTAS,
      },
    ],
    contextoParcheado: contexto,
    registro: null,
  };
}
