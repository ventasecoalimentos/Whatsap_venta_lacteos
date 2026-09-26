import type { OpcionLista } from '../motorEstados';

export const OPCION_FACTURACION = 'FACTURACION';
export const OPCION_PQRSF = 'PQRSF';
export const OPCION_MENU_ANTERIOR = 'MENU_ANTERIOR_SERVICIO';

export const OPCIONES_SERVICIO_CLIENTE: OpcionLista[] = [
  { id: OPCION_FACTURACION, titulo: 'Facturación' },
  // Exactamente 20 caracteres, el límite de los Reply Buttons — lleva al submenú PQR /
  // Sugerencia / Resolver dudas (ver desdeServicioCliente.ts).
  { id: OPCION_PQRSF, titulo: 'PQRS /Resolver dudas' },
  { id: OPCION_MENU_ANTERIOR, titulo: 'Menú anterior' },
];
