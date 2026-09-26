import type { OpcionLista } from '../motorEstados';

// Usado por HANDOFF_HUMANO (ver desdeHandoff.ts) en el aviso de "mucha demanda" — le da al cliente
// una salida si el asesor tarda en responder (sin SLA, ver CLAUDE.md), en vez de quedar atrapado en
// handoff hasta que alguien le conteste.
export const OPCION_MENU_PRINCIPAL_HANDOFF = 'MENU_PRINCIPAL_HANDOFF';

export const OPCIONES_AVISO_DEMANDA: OpcionLista[] = [
  { id: OPCION_MENU_PRINCIPAL_HANDOFF, titulo: 'Menú principal' },
];
