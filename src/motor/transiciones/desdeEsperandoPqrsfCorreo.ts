// Transición desde ESPERANDO_PQRSF_CORREO. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu correo electrónico, por favor?';
const NOMBRE_POR_DEFECTO = 'Cliente sin nombre registrado';
const DESCRIPCION_FACTURACION = 'Solicitud de facturación';

export function desdeEsperandoPqrsfCorreo(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const pqrsfCorreo = entrada.mensajeTexto.trim();
  const contextoParcheado = { ...entrada.contexto, pqrsfCorreo };

  // Facturación no pide descripción libre (no es una queja) — va directo al cierre con los datos
  // básicos ya capturados (ver desdeServicioCliente.ts / iniciarCapturaPqrsf.ts).
  const pqrsfTipo = entrada.contexto['pqrsfTipo'] as 'PQR' | 'Sugerencia' | 'Facturacion' | undefined;
  if (pqrsfTipo === 'Facturacion') {
    const nombreCompleto =
      entrada.nombreCliente ?? (entrada.contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;

    return {
      nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `¡Listo, ${nombreCompleto}! 🙌 Ya tenemos tus datos para facturación. En breve un miembro de nuestro equipo se comunica contigo.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮`,
        },
        { tipo: 'texto', contenido: '💬' },
      ],
      contextoParcheado,
      registro: { tipo: 'queja', descripcion: DESCRIPCION_FACTURACION, tipoPqrsf: 'Facturacion' },
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_QUEJA,
    respuestas: [
      {
        tipo: 'texto',
        contenido: 'Ya casi terminamos 🙌 Cuéntanos con detalle qué sucedió, para poder ayudarte de la mejor manera.',
      },
    ],
    contextoParcheado,
    registro: null,
  };
}
