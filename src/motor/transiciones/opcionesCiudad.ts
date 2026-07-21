// Opciones del menú (List Message) para la pregunta de ciudad — compartidas entre desdeInicio.ts
// (saludo a cliente recurrente) y desdeEsperandoNombre.ts (cliente nuevo), que son los dos puntos
// donde se hace esta pregunta. `id` usa el mismo valor que Ciudad para que `parsearCiudad` lo
// reconozca sin cambios (ya hace match exacto vía su normalización — ver dominio/ciudad.ts).
import { Ciudad } from '../../dominio/ciudad';
import type { OpcionLista } from '../motorEstados';

export const OPCIONES_CIUDAD: OpcionLista[] = [
  { id: Ciudad.BOGOTA, titulo: Ciudad.BOGOTA },
  { id: Ciudad.YOPAL, titulo: Ciudad.YOPAL },
  { id: Ciudad.VILLAVICENCIO, titulo: Ciudad.VILLAVICENCIO },
  { id: Ciudad.OTRA, titulo: 'Otra ciudad' },
];
