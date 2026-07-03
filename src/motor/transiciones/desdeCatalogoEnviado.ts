// Transición desde CATALOGO_ENVIADO. Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme qué producto buscas?';

export function desdeCatalogoEnviado(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.CATALOGO_ENVIADO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      debeNotificarEquipo: false,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.ESPERANDO_INTERES,
    respuestas: [{ tipo: 'texto', contenido: '¿Qué producto estás buscando hoy?' }],
    contextoParcheado: entrada.contexto,
    debeNotificarEquipo: false,
  };
}
