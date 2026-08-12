// Decide qué hacer con una conversación en HANDOFF_HUMANO en cada revisión periódica de
// tareaCierreHandoff.ts, a partir de cuánto tiempo ha pasado desde el último mensaje del cliente
// (mismo timestamp `actualizada_en` que ya gobierna el reinicio por inactividad, ver
// docs/FLUJO_ESTADOS.md). Función pura — no toca BD ni mensajería, solo decide.

export interface ConversacionParaRevisionCierre {
  contexto: Record<string, unknown>;
  actualizadaEn: Date;
}

export type AccionCierreHandoff =
  | { tipo: 'ninguna' }
  | { tipo: 'aviso_previo'; contextoActualizado: Record<string, unknown> }
  | { tipo: 'cierre' };

// Clave en `contexto` para no reenviar el aviso previo en cada revisión mientras la conversación
// siga dentro de la misma ventana de inactividad — se compara contra `actualizadaEn` en vez de
// usar un booleano simple porque, si el cliente vuelve a escribir, `actualizadaEn` cambia y el
// aviso debe poder enviarse de nuevo para la nueva ventana.
const CLAVE_AVISO_ENVIADO = 'avisoPrevioCierreEnviadoPara';

export function decidirAccionCierreHandoff(
  conversacion: ConversacionParaRevisionCierre,
  ahora: Date,
  ventanaInactividadMin: number,
  avisoPrevioMin: number,
): AccionCierreHandoff {
  const minutosTranscurridos = (ahora.getTime() - conversacion.actualizadaEn.getTime()) / 60_000;

  if (minutosTranscurridos >= ventanaInactividadMin) {
    return { tipo: 'cierre' };
  }

  const umbralAviso = Math.max(0, ventanaInactividadMin - avisoPrevioMin);
  const marcaActual = conversacion.actualizadaEn.toISOString();
  const yaEnviado = conversacion.contexto[CLAVE_AVISO_ENVIADO] === marcaActual;

  if (minutosTranscurridos >= umbralAviso && !yaEnviado) {
    return {
      tipo: 'aviso_previo',
      contextoActualizado: { ...conversacion.contexto, [CLAVE_AVISO_ENVIADO]: marcaActual },
    };
  }

  return { tipo: 'ninguna' };
}
