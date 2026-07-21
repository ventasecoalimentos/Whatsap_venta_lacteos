// Transición desde HANDOFF_HUMANO. Ver docs/FLUJO_ESTADOS.md.
//
// El bot no responde más en esta conversación (silencio total) hasta que se reinicie el flujo
// por inactividad — esa regla se resuelve antes de llegar aquí, en `motorEstados.ts`, así que
// esta función solo se ejecuta cuando NO hubo inactividad.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

export function desdeHandoff(entrada: EntradaMotor): ResultadoTransicion {
  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
