import type { OpcionLista } from '../motorEstados';

export const OPCION_AUTORIZO = 'AUTORIZO';
export const OPCION_NO_AUTORIZO = 'NO_AUTORIZO';

export const OPCIONES_CONSENTIMIENTO_DATOS: OpcionLista[] = [
  { id: OPCION_AUTORIZO, titulo: 'Autorizo' },
  { id: OPCION_NO_AUTORIZO, titulo: 'No autorizo' },
];
