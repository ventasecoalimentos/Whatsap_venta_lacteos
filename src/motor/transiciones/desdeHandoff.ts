// Transición desde HANDOFF_HUMANO. Ver docs/FLUJO_ESTADOS.md.
//
// El bot no vuelve a responder normalmente en esta conversación (el humano toma el chat) hasta que
// se reinicie el flujo por inactividad — esa regla se resuelve antes de llegar aquí, en
// `motorEstados.ts`, así que esta función solo se ejecuta cuando NO hubo inactividad. La única
// excepción es el aviso de "mucha demanda": si el cliente escribe de nuevo y ya pasó
// `INTERVALO_AVISO_DEMANDA_MIN` desde el último intercambio (mensaje o aviso) sin que detectemos
// que el asesor respondió, se le reenvía el mismo aviso — `entrada.debeAvisarDemanda` ya viene
// calculado por la Parte 3 (procesarMensajeEntrante.ts), que es quien tiene los timestamps de BD.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { MENSAJE_AVISO_DEMANDA } from './mensajeAvisoDemanda';

export function desdeHandoff(entrada: EntradaMotor): ResultadoTransicion {
  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: entrada.debeAvisarDemanda ? [{ tipo: 'texto', contenido: MENSAJE_AVISO_DEMANDA }] : [],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
