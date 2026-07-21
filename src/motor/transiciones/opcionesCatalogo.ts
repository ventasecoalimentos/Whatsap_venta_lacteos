import type { OpcionLista } from '../motorEstados';

// Compartido por CATALOGO_DETAL y CATALOGO_DISTRIB (ver desdeCatalogoDetal.ts / desdeCatalogoDistrib.ts).
export const OPCION_QUIERO_COMPRAR = 'QUIERO_COMPRAR';
// Este botón retrocede solo un paso (a MENU_VENTAS) — el atajo de texto "1" (ver
// desdeMenuVentas.ts) es distinto: salta directo a MENU_PRINCIPAL (ver desdeCatalogoDetal.ts /
// desdeCatalogoDistrib.ts).
export const OPCION_VOLVER_MENU = 'MENU_ANTERIOR';

export const OPCIONES_CATALOGO: OpcionLista[] = [
  { id: OPCION_QUIERO_COMPRAR, titulo: 'Continuar pedido' },
  { id: OPCION_VOLVER_MENU, titulo: 'Menú anterior' },
];
