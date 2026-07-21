import express, { type Express } from 'express';
import type { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import { crearRutas, type ReposDashboard, type CredencialesDashboard } from './routes';

export function crearApp(
  procesarMensajeEntrante: ProcesarMensajeEntrante,
  repos: ReposDashboard,
  credencialesDashboard: CredencialesDashboard,
): Express {
  const app = express();
  app.use(express.json());
  app.use(crearRutas(procesarMensajeEntrante, repos, credencialesDashboard));
  return app;
}
