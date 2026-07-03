import { Router } from 'express';
import type { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import { crearManejadorWebhook } from './webhookController';

export function crearRutas(procesarMensajeEntrante: ProcesarMensajeEntrante): Router {
  const router = Router();
  router.post('/webhook', crearManejadorWebhook(procesarMensajeEntrante));
  return router;
}
