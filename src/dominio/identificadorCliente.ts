// Un cliente de WhatsApp se identifica por teléfono (caso normal) o por BSUID (Business-Scoped
// User ID) cuando escribe con un username de WhatsApp sin compartir su número — ver
// docs/INTEGRACION_YCLOUD.md. Exactamente uno de los dos siempre está presente (nunca ambos,
// nunca ninguno), tanto al recibir un mensaje como al mandar uno de vuelta (YCloud usa `to` para
// teléfono y `recipient` para BSUID — son mutuamente excluyentes en su API de envío).
export type IdentificadorCliente = { tipo: 'telefono'; valor: string } | { tipo: 'bsuid'; valor: string };

// A partir de un cliente ya guardado en BD (que tiene telefono y/o bsuid, ver datos/tipos.ts),
// reconstruye el identificador para poder responderle. Preferimos telefono cuando ambos existieran
// (no debería pasar hoy, pero es la opción más simple/legible si algún día un cliente comparte su
// número después de haber escrito primero con username).
export function identificadorDeCliente(cliente: { telefono: string | null; bsuid: string | null }): IdentificadorCliente {
  if (cliente.telefono) return { tipo: 'telefono', valor: cliente.telefono };
  if (cliente.bsuid) return { tipo: 'bsuid', valor: cliente.bsuid };
  throw new Error('cliente sin telefono ni bsuid — no debería pasar (ver constraint en schema.sql)');
}
