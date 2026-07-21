import type { OpcionLista } from '../motorEstados';

export const OPCION_SEDES = 'SEDES';
export const OPCION_ASESOR = 'ASESOR';
export const OPCION_PQRSF = 'PQRSF';

export const OPCIONES_SERVICIO_CLIENTE: OpcionLista[] = [
  { id: OPCION_SEDES, titulo: 'Conocer sedes' },
  { id: OPCION_ASESOR, titulo: 'Hablar con asesor' },
  { id: OPCION_PQRSF, titulo: 'PQRSF' },
];
