// Compartido por desdeServicioCliente.ts (opción "Facturación", salta directo aquí) y
// desdeEsperandoTipoPqrsf.ts (después de elegir PQR/Sugerencia) — la secuencia de captura de
// nombre/identificación/correo es idéntica sin importar el tipo. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

export type TipoPqrsf = 'PQR' | 'Sugerencia' | 'Facturacion';

export function iniciarCapturaPqrsf(
  entrada: EntradaMotor,
  pqrsfTipo: TipoPqrsf,
  // Facturación siempre vuelve a pedir el nombre completo como confirmación de datos para el
  // proceso de facturación, aunque el cliente ya tenga nombre guardado (ver desdeServicioCliente.ts)
  // — PQR/Sugerencia sí lo saltan si ya lo tiene.
  forzarPreguntaNombre = false,
): ResultadoTransicion {
  const contextoParcheado = { ...entrada.contexto, pqrsfTipo };

  if (entrada.clienteYaTieneNombre && !forzarPreguntaNombre) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `Gracias, ${entrada.nombreCliente}.\n ¿Me compartes tu número de identificación (cédula o NIT)?`,
        },
      ],
      contextoParcheado,
      registro: null,
    };
  }

  const mensajeNombre =
    pqrsfTipo === 'Facturacion'
      ? 'Para el área de facturación, verifica que los datos que nos compartas sean correctos, se usarán para tu trámite.,\n\n¿cuál es tu nombre completo?'
      : '¿Cuál es tu nombre completo?';

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
    respuestas: [{ tipo: 'texto', contenido: mensajeNombre }],
    contextoParcheado,
    registro: null,
  };
}
