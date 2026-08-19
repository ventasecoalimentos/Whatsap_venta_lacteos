import type { Request, Response } from 'express';
import type { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import type { RegistrarRespuestaAsesor } from '../application/registrarRespuestaAsesor';
import { mapearPayloadYCloud, mapearEventoEcoAsesor } from './mapeoYCloud';

// El webhook SIEMPRE responde 200 antes/independiente del resultado del procesamiento (ver
// docs/ARQUITECTURA.md → manejo de errores) — evita reintentos infinitos de YCloud ante
// cualquier falla interna nuestra.
export function crearManejadorWebhook(
  procesarMensajeEntrante: ProcesarMensajeEntrante,
  registrarRespuestaAsesor: RegistrarRespuestaAsesor,
) {
  return async function manejarWebhookYCloud(req: Request, res: Response): Promise<void> {
    res.sendStatus(200);
    try {
      const dto = mapearPayloadYCloud(req.body);
      if (dto) {
        await procesarMensajeEntrante.ejecutar(dto);
        return;
      }

      const telefonoCliente = mapearEventoEcoAsesor(req.body);
      if (telefonoCliente) {
        await registrarRespuestaAsesor.ejecutar(telefonoCliente);
        return;
      }

      // DIAGNÓSTICO TEMPORAL: sospecha de que cuentas de WhatsApp con username (sin número visible,
      // ej. "@alias") mandan un payload con una forma distinta a la que mapeoYCloud.ts reconoce —
      // capturamos el body completo de cualquier evento no reconocido para confirmarlo. Quitar una
      // vez confirmado (ver docs/INTEGRACION_YCLOUD.md).
      console.log('[webhookController] evento no reconocido, body completo:', JSON.stringify(req.body));
      // cualquier otro evento (status de entrega/lectura, etc.) se ignora
    } catch (error) {
      console.error('[webhookController] error procesando mensaje entrante:', error);
    }
  };
}
