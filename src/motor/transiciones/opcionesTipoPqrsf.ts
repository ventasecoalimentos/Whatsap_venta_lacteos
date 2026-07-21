import type { OpcionLista } from '../motorEstados';

// Títulos acortados por el límite de 20 caracteres de los Reply Buttons — el significado completo
// (Petición/Queja/Reclamo y Sugerencia/Felicitación) se explica en el cuerpo del mensaje, ver
// desdeServicioCliente.ts.
export const OPCION_PQR = 'PQR';
export const OPCION_SUGERENCIA = 'SUGERENCIA';

export const OPCIONES_TIPO_PQRSF: OpcionLista[] = [
  { id: OPCION_PQR, titulo: 'PQR' },
  { id: OPCION_SUGERENCIA, titulo: 'Sugerencia' },
];
