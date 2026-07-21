// Transición desde SERVICIO_CLIENTE. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion, RespuestaBot } from '../motorEstados';
import { buscarOpcionSeleccionada } from './seleccionDeLista';
import { OPCIONES_SERVICIO_CLIENTE, OPCION_SEDES, OPCION_ASESOR } from './opcionesServicioCliente';
import { OPCIONES_TIPO_PQRSF } from './opcionesTipoPqrsf';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. Elige una opción del menú, por favor.';
const MENSAJE_NO_RECONOCIDO = 'No entendí esa opción, por favor elige una del menú:';

// Coordenadas reales de Villa Carola (única sede confirmada hasta ahora). La de Villavicencio es
// un pin de marcador temporal (aprobado así por el cliente) — reemplazar por la dirección real
// cuando la tengan (ver docs/GUION_CONVERSACION.md).
const SEDES: Array<{ latitud: number; longitud: number; nombre: string; direccion: string }> = [
  {
    latitud: 4.8397,
    longitud: -72.9519,
    nombre: 'Llano Lácteos — Villa Carola',
    direccion: 'Villa Carola, 855017 Monterrey, Casanare, Colombia',
  },
  {
    latitud: 4.13238,
    longitud: -73.62564,
    nombre: 'Llano Lácteos — Villavicencio',
    direccion: 'Villavicencio, Meta, Colombia (pin temporal — dirección exacta pendiente)',
  },
];

export function desdeServicioCliente(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.SERVICIO_CLIENTE,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  const opcion = buscarOpcionSeleccionada(entrada.mensajeTexto, OPCIONES_SERVICIO_CLIENTE);
  if (!opcion) {
    return {
      nuevoEstado: EstadoConversacion.SERVICIO_CLIENTE,
      respuestas: [
        { tipo: 'botones', texto: MENSAJE_NO_RECONOCIDO, opciones: OPCIONES_SERVICIO_CLIENTE },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  if (opcion.id === OPCION_SEDES) {
    const ubicaciones: RespuestaBot[] = SEDES.map((sede) => ({ tipo: 'ubicacion', ...sede }));
    return {
      nuevoEstado: EstadoConversacion.SERVICIO_CLIENTE,
      respuestas: [
        { tipo: 'texto', contenido: 'Estas son nuestras sedes:' },
        ...ubicaciones,
        { tipo: 'botones', texto: '¿Algo más en lo que te podamos ayudar?', opciones: OPCIONES_SERVICIO_CLIENTE },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  if (opcion.id === OPCION_ASESOR) {
    return {
      nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
      respuestas: [
        {
          tipo: 'texto',
          contenido:
            '¡Listo! 🙌\nEn un momento uno de nuestros asesores se comunica contigo.\n\n*¡Gracias por preferir Llano Lácteos!🐮🤠*',
        },
        { tipo: 'texto', contenido: '💬' },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // OPCION_PQRSF — primero se clasifica el tipo (ver desdeEsperandoTipoPqrsf.ts), luego se piden
  // los datos de contacto (desdeEsperandoPqrsfNombre.ts / Identificacion.ts / Correo.ts).
  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_TIPO_PQRSF,
    respuestas: [
      {
        tipo: 'botones',
        texto:
          'Con gusto te ayudamos con tu PQRSF 📋\n\nCuéntanos, ¿qué tipo de solicitud tienes?\n\n• *PQR*: Petición, queja o reclamo\n• *Sugerencia*: Sugerencia o felicitación',
        opciones: OPCIONES_TIPO_PQRSF,
      },
    ],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
