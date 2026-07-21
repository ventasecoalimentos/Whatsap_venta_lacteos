import type { OpcionLista } from '../motorEstados';

export const OPCION_DETAL = 'DETAL';
export const OPCION_DISTRIBUCION = 'DISTRIBUCION';

// El título de cada fila de un List Message tiene máximo 24 caracteres en WhatsApp — el detalle
// "venta al por menor/mayor" va en el texto del mensaje (desdeEsperandoCiudad.ts), no aquí.
export const OPCIONES_MENU_VENTAS: OpcionLista[] = [
  { id: OPCION_DETAL, titulo: 'Detal' },
  { id: OPCION_DISTRIBUCION, titulo: 'Distribuidor' },
];
