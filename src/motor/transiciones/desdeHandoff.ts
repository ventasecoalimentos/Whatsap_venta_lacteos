// Transición desde HANDOFF_HUMANO. Ver docs/FLUJO_ESTADOS.md.
//
// El bot no puede saber si el asesor humano ya respondió (la coexistencia de YCloud no expone al
// webhook los mensajes que el equipo manda desde la app normal de WhatsApp) — así que, mientras
// sigamos aquí (no hubo reinicio por inactividad, eso se resuelve antes de llegar a esta función
// en `motorEstados.ts`), cada mensaje del cliente recibe el aviso de "mucha demanda" de vuelta.
// Esto se repite hasta que pasen `VENTANA_INACTIVIDAD_HORAS` de silencio, momento en el cual el
// siguiente mensaje del cliente ya reinicia el flujo a INICIO en vez de pasar por aquí.
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
