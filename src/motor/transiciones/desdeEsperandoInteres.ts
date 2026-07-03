// Transición desde ESPERANDO_INTERES. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes contarme qué producto buscas?';

const NOMBRE_POR_DEFECTO = 'Cliente sin nombre registrado';
const CIUDAD_POR_DEFECTO = 'Ciudad no especificada';

export function desdeEsperandoInteres(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_INTERES,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      debeNotificarEquipo: false,
    };
  }

  // Texto libre: se guarda tal cual como interés de compra (ver docs/FLUJO_ESTADOS.md).
  const productoInteres = entrada.mensajeTexto.trim();

  // `EntradaMotor` no trae la ciudad de forma directa (solo `nombreCliente`), así que se lee del
  // `contexto`, donde `desdeEsperandoCiudad` la dejó guardada como `contextoParcheado.ciudad` en
  // un turno anterior. Esto evita tener que ampliar la firma de `EntradaMotor` (ver decisión
  // documentada en el reporte de la Parte 2).
  const nombre = entrada.nombreCliente ?? (entrada.contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;
  const ciudad = (entrada.contexto['ciudad'] as string | undefined) ?? CIUDAD_POR_DEFECTO;

  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [
      {
        tipo: 'texto',
        contenido: 'En breve te atiende alguien de nuestro equipo. ¡Gracias por escribirnos!',
      },
      {
        tipo: 'texto',
        contenido: `🔔 NUEVO CLIENTE — ${nombre} | ${ciudad} | Interés: ${productoInteres}`,
      },
    ],
    contextoParcheado: { ...entrada.contexto, productoInteres },
    debeNotificarEquipo: true,
  };
}
