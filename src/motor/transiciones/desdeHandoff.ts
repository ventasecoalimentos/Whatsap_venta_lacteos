// Transición desde HANDOFF_HUMANO. Ver docs/FLUJO_ESTADOS.md.
//
// Esta función solo maneja mensajes del CLIENTE — nunca se llega aquí por un mensaje tardío que
// debería reiniciar el flujo (motorEstados.ts exime a HANDOFF_HUMANO del reinicio por inactividad,
// justamente para no interrumpir con un saludo nuevo mientras el asesor puede seguir trabajando el
// caso).
//
// Mientras el asesor NO haya respondido todavía (`contexto.asesorRespondio` ausente), cada mensaje
// del cliente recibe de vuelta el aviso de "mucha demanda". Una vez que el asesor responde al
// menos una vez (marcado por registrarRespuestaAsesor.ts a partir del evento
// whatsapp.smb.message.echoes), el bot deja de mandar ese aviso — no tiene sentido seguir avisando
// "en breve te atendemos" si el asesor ya está ahí hablando directamente con el cliente — y este
// estado queda en silencio total hasta que tareaCierreHandoff.ts lo cierre.
//
// Los mensajes del ASESOR no pasan por aquí ni por el motor en absoluto: YCloud los expone al
// webhook como un evento aparte, manejado directamente por registrarRespuestaAsesor.ts.
//
// El único camino de salida de HANDOFF_HUMANO es el cierre explícito de tareaCierreHandoff.ts,
// que corre en segundo plano y cierra cuando pasan VENTANA_INACTIVIDAD_HORAS sin mensajes de
// NINGUNO de los dos (cliente o asesor).
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { MENSAJE_AVISO_DEMANDA } from './mensajeAvisoDemanda';

// Clave en `contexto` que marca que el asesor ya respondió al menos una vez en este handoff (ver
// application/registrarRespuestaAsesor.ts, que la importa desde aquí — el motor no depende de la
// capa de aplicación, es al revés).
export const CLAVE_ASESOR_RESPONDIO = 'asesorRespondio';

export function desdeHandoff(entrada: EntradaMotor): ResultadoTransicion {
  const asesorYaRespondio = entrada.contexto[CLAVE_ASESOR_RESPONDIO] === true;

  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: asesorYaRespondio ? [] : [{ tipo: 'texto', contenido: MENSAJE_AVISO_DEMANDA }],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
