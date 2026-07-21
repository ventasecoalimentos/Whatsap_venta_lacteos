import type { OpcionLista } from '../motorEstados';

export const OPCION_USAR_NOMBRE = 'USAR_NOMBRE';
export const OPCION_ESCRIBIR_OTRO = 'ESCRIBIR_OTRO';

export const OPCIONES_CONFIRMAR_NOMBRE: OpcionLista[] = [
  { id: OPCION_USAR_NOMBRE, titulo: 'Usar este nombre' },
  { id: OPCION_ESCRIBIR_OTRO, titulo: 'Escribir otro' },
];
