import type { OpcionLista } from '../motorEstados';

export const OPCION_DETAL = 'DETAL';
export const OPCION_DISTRIBUCION = 'DISTRIBUCION';
export const OPCION_NEGOCIO = 'NEGOCIO';

export const OPCIONES_MENU_VENTAS: OpcionLista[] = [
  { id: OPCION_DETAL, titulo: 'Detal' },
  { id: OPCION_DISTRIBUCION, titulo: 'Distribuidor' },
  { id: OPCION_NEGOCIO, titulo: 'Negocio' },
];
