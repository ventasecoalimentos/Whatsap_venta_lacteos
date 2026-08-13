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
        // DIAGNÓSTICO TEMPORAL: ya confirmamos que whatsapp.smb.message.echoes llega — ahora
        // capturamos el body completo para conocer la forma exacta del payload (dónde viene el
        // teléfono del cliente) antes de escribir el parser real. Quitar este log una vez confirmado.
        const tipoEvento = (req.body as { type?: string })?.type;
        if (tipoEvento === 'whatsapp.smb.message.echoes') {
          console.log('[webhookController] payload completo de echo:', JSON.stringify(req.body));
        }
        return; // evento sin mensaje entrante reconocible (ej. status de entrega) — se ignora
      }
      await procesarMensajeEntrante.ejecutar(dto);
    } catch (error) {
      console.error('[webhookController] error procesando mensaje entrante:', error);
    }
  };
}
