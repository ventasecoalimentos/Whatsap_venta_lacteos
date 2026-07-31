// Transición desde ESPERANDO_PQRSF_CORREO. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu correo electrónico, por favor?';
const NOMBRE_POR_DEFECTO = 'Cliente sin nombre registrado';
const DESCRIPCION_FACTURACION = 'Solicitud de facturación';

// Valida solo la estructura (algo@algo.algo), no el dominio — hay correos personalizados/propios
// que no se pueden verificar por DNS/MX sin una llamada externa, y no vale la pena aquí.
const PARECE_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (!PARECE_CORREO.test(pqrsfCorreo)) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
      respuestas: [
        {
          tipo: 'texto',
          contenido: 'Ese correo no parece válido 🤔 ¿me lo compartes de nuevo? (ej: nombre@correo.com)',
        },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const contextoParcheado = { ...entrada.contexto, pqrsfCorreo };

  // Facturación no pide descripción libre (no es una queja) — va directo al cierre con los datos
  // básicos ya capturados (ver desdeServicioCliente.ts / iniciarCapturaPqrsf.ts).
  const pqrsfTipo = entrada.contexto['pqrsfTipo'] as 'PQR' | 'Sugerencia' | 'Facturacion' | undefined;
  if (pqrsfTipo === 'Facturacion') {
    const nombreCompleto =
      entrada.nombreCliente ?? (entrada.contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;
    const identificacion = entrada.contexto['pqrsfIdentificacion'] as string | undefined;
    // Tarjeta resumen para que el asesor de facturación tenga los datos a la mano sin subir en el
    // chat — ver docs/FLUJO_ESTADOS.md.
    const resumen = `📃 *Resumen de facturación*\nNombre completo: ${nombreCompleto}\nIdentificación (Cédula/NIT): ${identificacion ?? '—'}\nCorreo: ${pqrsfCorreo}`;

    return {
      nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `¡Listo, ${nombreCompleto}! 🙌 Ya tenemos tus datos para facturación. En breve un miembro de nuestro equipo se comunica contigo.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮`,
        },
        { tipo: 'texto', contenido: resumen },
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
