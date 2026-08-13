import type { Request, Response } from 'express';
import type { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import { mapearPayloadYCloud } from './mapeoYCloud';

// El webhook SIEMPRE responde 200 antes/independiente del resultado del procesamiento (ver
// docs/ARQUITECTURA.md → manejo de errores) — evita reintentos infinitos de YCloud ante
// cualquier falla interna nuestra.
export function crearManejadorWebhook(procesarMensajeEntrante: ProcesarMensajeEntrante) {
  return async function manejarWebhookYCloud(req: Request, res: Response): Promise<void> {
    res.sendStatus(200);
    try {
      const dto = mapearPayloadYCloud(req.body);
      if (!dto) {
        // DIAGNÓSTICO TEMPORAL: confirmar si YCloud manda whatsapp.smb.message.echoes cuando el
        // equipo responde desde la app nativa (coexistencia) — quitar este log una vez confirmado.
        console.log('[webhookController] evento no reconocido, type=', (req.body as { type?: string })?.type);
        return; // evento sin mensaje entrante reconocible (ej. status de entrega) — se ignora
      }
      await procesarMensajeEntrante.ejecutar(dto);
    } catch (error) {
      console.error('[webhookController] error procesando mensaje entrante:', error);
    }
  };
}
