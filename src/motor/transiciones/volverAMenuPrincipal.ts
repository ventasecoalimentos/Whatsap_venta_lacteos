// Compartido por CATALOGO_DETAL y CATALOGO_DISTRIB cuando el cliente escribe el atajo de texto
// "1" (ver desdeMenuVentas.ts) — a diferencia del botón "Menú anterior" (que retrocede solo un
// paso, a MENU_VENTAS), este atajo salta directo al menú principal. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { ResultadoTransicion } from '../motorEstados';
import { OPCIONES_MENU_PRINCIPAL } from './opcionesMenuPrincipal';

export function volverAMenuPrincipal(
  nombreCliente: string | null,
  contexto: Record<string, unknown>,
): ResultadoTransicion {
  const saludo = nombreCliente
    ? `¡Claro, ${nombreCliente}!\n ¿En qué más te podemos ayudar?`
    : '¡Claro! ¿En qué más te podemos ayudar?';

  return {
    nuevoEstado: EstadoConversacion.MENU_PRINCIPAL,
    respuestas: [{ tipo: 'botones', texto: saludo, opciones: OPCIONES_MENU_PRINCIPAL }],
    contextoParcheado: contexto,
    registro: null,
  };
}
