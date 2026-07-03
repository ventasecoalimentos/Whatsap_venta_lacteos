// Ciudades relevantes para la cobertura de distribución (cadena de frío completa).
// Ver docs/CONTRATOS.md y CLAUDE.md (sección "Contexto de negocio").
export enum Ciudad {
  BOGOTA = 'Bogotá',
  YOPAL = 'Yopal',
  VILLAVICENCIO = 'Villavicencio',
  OTRA = 'Otra',
}

export const CIUDADES_COBERTURA_COMPLETA: Ciudad[] = [
  Ciudad.BOGOTA,
  Ciudad.YOPAL,
  Ciudad.VILLAVICENCIO,
];

export function tieneCobertura(ciudad: Ciudad): boolean {
  return CIUDADES_COBERTURA_COMPLETA.includes(ciudad);
}

// Puntos de código Unicode 0x0300–0x036F: marcas diacríticas combinantes (tildes, diéresis,
// etc.) que aparecen al normalizar un texto a forma NFD. Se filtran por código en vez de usar
// una clase de caracteres con el símbolo combinante literal en el código fuente (más robusto
// frente a distintas codificaciones de archivo/editor).
const CODIGO_DIACRITICO_MIN = 0x0300;
const CODIGO_DIACRITICO_MAX = 0x036f;

function quitarDiacriticos(textoNfd: string): string {
  return Array.from(textoNfd)
    .filter((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return codigo < CODIGO_DIACRITICO_MIN || codigo > CODIGO_DIACRITICO_MAX;
    })
    .join('');
}

// Quita tildes/diacríticos y normaliza mayúsculas/espacios/puntuación para comparar de forma
// tolerante (ej. "bogotá", "BOGOTA", "Bogotá D.C." deben reconocerse igual).
function normalizar(texto: string): string {
  return quitarDiacriticos(texto.normalize('NFD'))
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Nunca falla: si el texto no coincide con ninguna ciudad de cobertura, cae en Ciudad.OTRA.
// Esto evita que ESPERANDO_CIUDAD quede en loop de "no entendí" (ver docs/FLUJO_ESTADOS.md).
export function parsearCiudad(texto: string): Ciudad {
  if (typeof texto !== 'string' || texto.trim().length === 0) {
    return Ciudad.OTRA;
  }

  const normalizado = normalizar(texto);

  if (normalizado.includes('bogota')) {
    return Ciudad.BOGOTA;
  }
  if (normalizado.includes('yopal')) {
    return Ciudad.YOPAL;
  }
  if (normalizado.includes('villavicencio') || normalizado.includes('villavo')) {
    return Ciudad.VILLAVICENCIO;
  }

  return Ciudad.OTRA;
}
