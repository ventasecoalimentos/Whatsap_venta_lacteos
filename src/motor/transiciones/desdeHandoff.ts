// Transición desde HANDOFF_HUMANO. Ver docs/FLUJO_ESTADOS.md.
//
// Esta función solo maneja mensajes del CLIENTE: cada uno recibe de vuelta el aviso de "mucha
// demanda", sin importar cuánto tiempo lleve la conversación aquí (motorEstados.ts exime a
// HANDOFF_HUMANO del reinicio por inactividad, justamente para no interrumpir con un saludo nuevo
// mientras el asesor puede seguir trabajando el caso).
//
// Los mensajes del ASESOR no pasan por aquí ni por el motor: YCloud los expone al webhook como un
// evento aparte (whatsapp.smb.message.echoes, coexistencia), manejado directamente por
// registrarRespuestaAsesor.ts — solo renuevan el reloj de inactividad, sin generar respuesta del
// bot ni pasar por procesarTransicion.
//
// El único camino de salida de HANDOFF_HUMANO es el cierre explícito de tareaCierreHandoff.ts,
// que corre en segundo plano y cierra cuando pasan VENTANA_INACTIVIDAD_HORAS sin mensajes de
// NINGUNO de los dos (cliente o asesor).
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { MENSAJE_AVISO_DEMANDA } from './mensajeAvisoDemanda';

export function desdeHandoff(entrada: EntradaMotor): ResultadoTransicion {
  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [{ tipo: 'texto', contenido: MENSAJE_AVISO_DEMANDA }],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
