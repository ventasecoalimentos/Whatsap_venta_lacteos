import express, { type Express } from 'express';
import type { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import { crearRutas } from './routes';

export function crearApp(procesarMensajeEntrante: ProcesarMensajeEntrante): Express {
  const app = express();
  app.use(express.json());
  app.use(crearRutas(procesarMensajeEntrante));
  return app;
}
