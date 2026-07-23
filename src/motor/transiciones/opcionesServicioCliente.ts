import type { OpcionLista } from '../motorEstados';

export const OPCION_FACTURACION = 'FACTURACION';
export const OPCION_PQRSF = 'PQRSF';
export const OPCION_MENU_ANTERIOR = 'MENU_ANTERIOR_SERVICIO';

export const OPCIONES_SERVICIO_CLIENTE: OpcionLista[] = [
  { id: OPCION_FACTURACION, titulo: 'Facturación' },
  { id: OPCION_PQRSF, titulo: 'PQRSF' },
  { id: OPCION_MENU_ANTERIOR, titulo: 'Menú anterior' },
];
