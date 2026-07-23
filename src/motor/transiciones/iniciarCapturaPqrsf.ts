// Compartido por desdeServicioCliente.ts (opción "Facturación", salta directo aquí) y
// desdeEsperandoTipoPqrsf.ts (después de elegir PQR/Sugerencia) — la secuencia de captura de
// nombre/identificación/correo es idéntica sin importar el tipo. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

export type TipoPqrsf = 'PQR' | 'Sugerencia' | 'Facturacion';

export function iniciarCapturaPqrsf(entrada: EntradaMotor, pqrsfTipo: TipoPqrsf): ResultadoTransicion {
  const contextoParcheado = { ...entrada.contexto, pqrsfTipo };

  // Si el cliente ya tiene nombre guardado (Ventas, perfil de WhatsApp, o una solicitud anterior),
  // no se le vuelve a preguntar — se salta directo a identificación.
  if (entrada.clienteYaTieneNombre) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `Gracias, ${entrada.nombreCliente}. ¿Me compartes tu número de identificación (cédula o NIT)?`,
        },
      ],
      contextoParcheado,
      registro: null,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
    respuestas: [{ tipo: 'texto', contenido: '¿Cuál es tu nombre completo?' }],
    contextoParcheado,
    registro: null,
  };
}
