import type { OpcionLista } from '../motorEstados';

export const OPCION_SERVICIO_CLIENTE = 'SERVICIO_CLIENTE';
export const OPCION_VENTAS = 'VENTAS';

export const OPCIONES_MENU_PRINCIPAL: OpcionLista[] = [
  { id: OPCION_SERVICIO_CLIENTE, titulo: 'Servicio al cliente' },
  { id: OPCION_VENTAS, titulo: 'Ventas' },
];
