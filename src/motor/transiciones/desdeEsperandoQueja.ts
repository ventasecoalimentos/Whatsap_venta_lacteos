// Transición desde ESPERANDO_QUEJA. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { volverAMenuPrincipal } from './volverAMenuPrincipal';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes contarnos qué pasó?';

const NOMBRE_POR_DEFECTO = 'Cliente sin nombre registrado';
const TIPO_POR_DEFECTO = 'PQR';

export function desdeEsperandoQueja(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_QUEJA,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // Texto libre: se guarda tal cual como descripción. El nombre es el mismo que usa todo el bot
  // (`clientes.nombre`, ver docs/FLUJO_ESTADOS.md): si ya existía no se volvió a preguntar
  // (`entrada.nombreCliente`), si no, lo capturó desdeEsperandoPqrsfNombre.ts en `contexto.nombre`.
  const descripcion = entrada.mensajeTexto.trim();
  const nombreCompleto =
    entrada.nombreCliente ?? (entrada.contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;
  const tipoPqrsf =
    (entrada.contexto['pqrsfTipo'] as 'PQR' | 'Sugerencia' | undefined) ?? TIPO_POR_DEFECTO;

  // Sugerencia/Felicitación no pide identificación ni correo (ver desdeEsperandoTipoPqrsf.ts) ni
  // promete seguimiento de un asesor — se agradece y se vuelve al menú principal en vez de pasar
  // a HANDOFF_HUMANO, porque nadie del equipo necesita tomar la conversación para esto.
  if (tipoPqrsf === 'Sugerencia') {
    const cierre = volverAMenuPrincipal(nombreCompleto, entrada.contexto);
    return {
      ...cierre,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `¡Muchas gracias por tu comentario, ${nombreCompleto}! 🤠 Lo tendremos muy en cuenta.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮`,
        },
        ...cierre.respuestas,
      ],
      registro: { tipo: 'queja', descripcion, tipoPqrsf: 'Sugerencia' },
    };
  }

  const identificacion = entrada.contexto['pqrsfIdentificacion'] as string | undefined;
  const correo = entrada.contexto['pqrsfCorreo'] as string | undefined;
  // Tarjeta resumen para que el asesor tenga los datos y la descripción a la mano sin subir en el
  // chat — ver docs/FLUJO_ESTADOS.md.
  const resumen = `📋 *Resumen de tu solicitud*\nTipo: ${tipoPqrsf}\nNombre: ${nombreCompleto}\nIdentificación: ${identificacion ?? '—'}\nCorreo: ${correo ?? '—'}\nDescripción: ${descripcion}`;

  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [
      {
        tipo: 'texto',
        contenido: `¡Gracias por contarnos, ${nombreCompleto}!🤠 \nTu solicitud ya quedó registrada.\n En breve un miembro de nuestro equipo se comunica contigo para darte una respuesta.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮`,
      },
      { tipo: 'texto', contenido: resumen },
    ],
    contextoParcheado: entrada.contexto,
    registro: { tipo: 'queja', descripcion, tipoPqrsf },
  };
}
