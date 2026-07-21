// Transición desde ESPERANDO_QUEJA. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

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

  // Texto libre: se guarda tal cual como descripción de la queja. El nombre es el mismo que usa
  // todo el bot (`clientes.nombre`, ver docs/FLUJO_ESTADOS.md): si ya existía no se volvió a
  // preguntar (`entrada.nombreCliente`), si no, lo capturó desdeEsperandoPqrsfNombre.ts en
  // `contexto.nombre`. `identificacion`/`correo` ya no se usan aquí (el equipo los revisa en
  // /dashboard, no por notificación de WhatsApp), pero siguen viviendo en `clientes`.
  const descripcion = entrada.mensajeTexto.trim();
  const nombreCompleto =
    entrada.nombreCliente ?? (entrada.contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;
  const tipoPqrsf =
    (entrada.contexto['pqrsfTipo'] as 'PQR' | 'Sugerencia' | undefined) ?? TIPO_POR_DEFECTO;

  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [
      {
        tipo: 'texto',
        contenido: `¡Gracias por contarnos, ${nombreCompleto}!🤠 \nTu solicitud ya quedó registrada.\n En breve un miembro de nuestro equipo se comunica contigo para darte una respuesta.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮`,
      },
      { tipo: 'texto', contenido: '💬' },
    ],
    contextoParcheado: entrada.contexto,
    registro: { tipo: 'queja', descripcion, tipoPqrsf },
  };
}
