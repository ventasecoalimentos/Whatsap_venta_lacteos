import express, { type Express } from 'express';
import type { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import type { RegistrarRespuestaAsesor } from '../application/registrarRespuestaAsesor';
import { crearRutas, type ReposDashboard, type CredencialesDashboard } from './routes';

export function crearApp(
  procesarMensajeEntrante: ProcesarMensajeEntrante,
  registrarRespuestaAsesor: RegistrarRespuestaAsesor,
  repos: ReposDashboard,
  credencialesDashboard: CredencialesDashboard,
): Express {
  const app = express();
  app.use(express.json());
  app.use(crearRutas(procesarMensajeEntrante, registrarRespuestaAsesor, repos, credencialesDashboard));
  return app;
}
