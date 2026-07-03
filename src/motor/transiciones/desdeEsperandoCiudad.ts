// Transición desde ESPERANDO_CIUDAD. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import { parsearCiudad, tieneCobertura } from '../../dominio/ciudad';
import type { EntradaMotor, ResultadoTransicion, RespuestaBot } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme tu ciudad, por favor?';

// El motor es una función pura y no tiene acceso a variables de entorno (CATALOGO_COMPLETO_URL /
// CATALOGO_REDUCIDO_URL viven en `src/config/env.ts`, propiedad de la Parte 1/3). Se usan estos
// valores como placeholder — mismo nombre que la variable de entorno correspondiente — y queda
// documentado en el reporte final que la Parte 3 debe resolverlos a la URL/base64 real antes de
// llamar a `IProveedorMensajeria.enviarDocumento` (ver docs/INTEGRACION_YCLOUD.md, que ya
// contempla usar un placeholder si aún no hay archivos reales).
const CATALOGO_COMPLETO: RespuestaBot = {
  tipo: 'documento',
  urlOBase64: 'CATALOGO_COMPLETO_URL',
  nombre: 'catalogo-completo.pdf',
};

const CATALOGO_REDUCIDO: RespuestaBot = {
  tipo: 'documento',
  urlOBase64: 'CATALOGO_REDUCIDO_URL',
  nombre: 'catalogo-reducido.pdf',
};

export function desdeEsperandoCiudad(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_CIUDAD,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      debeNotificarEquipo: false,
    };
  }

  const ciudad = parsearCiudad(entrada.mensajeTexto);

  // Se guarda `ciudad` en el contexto para que quede disponible en transiciones futuras (ej. al
  // armar la notificación al equipo en ESPERANDO_INTERES → HANDOFF_HUMANO, que no recibe la
  // ciudad directamente en `EntradaMotor` — ver docs/CONTRATOS.md).
  const contextoParcheado = { ...entrada.contexto, ciudad };

  if (tieneCobertura(ciudad)) {
    return {
      nuevoEstado: EstadoConversacion.CATALOGO_ENVIADO,
      respuestas: [
        {
          tipo: 'texto',
          contenido: `¡Perfecto! En ${ciudad} entregamos con cadena de frío completa. Aquí tienes nuestro catálogo completo:`,
        },
        CATALOGO_COMPLETO,
      ],
      contextoParcheado,
      debeNotificarEquipo: false,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.CATALOGO_ENVIADO,
    respuestas: [
      {
        tipo: 'texto',
        contenido:
          'Por ahora solo tenemos cobertura con cadena de frío en Bogotá, Yopal y Villavicencio. ' +
          'Para tu ciudad podemos ofrecerte nuestros productos empaquetados. Aquí tienes el catálogo reducido:',
      },
      CATALOGO_REDUCIDO,
    ],
    contextoParcheado,
    debeNotificarEquipo: false,
  };
}
