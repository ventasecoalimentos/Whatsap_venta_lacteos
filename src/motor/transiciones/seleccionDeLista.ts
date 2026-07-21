// Helper compartido por las transiciones que preguntan vía List Message con opciones cerradas
// (a diferencia de ciudad, estas no tienen un "parsear" tolerante propio — ver docs/FLUJO_ESTADOS.md).
// Coincide por id o título, sin distinguir mayúsculas/espacios, para tolerar que el cliente
// escriba en vez de tocar la opción del menú.
import type { OpcionLista } from '../motorEstados';

export function buscarOpcionSeleccionada(
  texto: string | null,
  opciones: OpcionLista[],
): OpcionLista | null {
  if (!texto) return null;
  const normalizado = texto.trim().toLowerCase();
  if (!normalizado) return null;

  // `titulo.includes(normalizado)` tolera que el cliente escriba solo una parte del título (ej.
  // "servicio" para la opción "Servicio al cliente") en vez del texto completo — las listas son
  // cortas (2-4 opciones) así que el riesgo de ambigüedad es bajo.
  return (
    opciones.find((opcion) => {
      const id = opcion.id.toLowerCase();
      const titulo = opcion.titulo.toLowerCase();
      return id === normalizado || titulo === normalizado || titulo.includes(normalizado);
    }) ?? null
  );
}
