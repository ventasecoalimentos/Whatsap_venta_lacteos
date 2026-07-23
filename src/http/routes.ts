import path from 'node:path';
import { Router, static as expressStatic } from 'express';
import type { ProcesarMensajeEntrante } from '../application/procesarMensajeEntrante';
import type { IClienteRepository, IPedidoRepository, IServicioClienteRepository } from '../datos/tipos';
import { crearManejadorWebhook } from './webhookController';
import { crearAutenticacionDashboard } from './dashboardAuth';
import {
  crearManejadorClientes,
  crearManejadorPedidos,
  crearManejadorServicioCliente,
} from './dashboardController';

export interface ReposDashboard {
  clienteRepositorio: IClienteRepository;
  pedidoRepositorio: IPedidoRepository;
  servicioClienteRepositorio: IServicioClienteRepository;
}

export interface CredencialesDashboard {
  usuario: string;
  contrasena: string;
}

// Build de dashboard-frontend/ (proyecto Vite/React aparte, ver ese directorio) — mismo número de
// niveles desde este archivo tanto en dev (src/http) como compilado (dist/http), así que la ruta
// resuelve igual en ambos casos.
const RUTA_BUILD_DASHBOARD = path.join(__dirname, '../../dashboard-frontend/dist');

export function crearRutas(
  procesarMensajeEntrante: ProcesarMensajeEntrante,
  repos: ReposDashboard,
  credenciales: CredencialesDashboard,
): Router {
  const router = Router();
  router.post('/webhook', crearManejadorWebhook(procesarMensajeEntrante));

  const autenticarDashboard = crearAutenticacionDashboard(credenciales.usuario, credenciales.contrasena);
  router.use('/dashboard', autenticarDashboard);

  router.get('/dashboard/api/clientes', crearManejadorClientes(repos.clienteRepositorio));
  router.get('/dashboard/api/pedidos', crearManejadorPedidos(repos.pedidoRepositorio));
  router.get(
    '/dashboard/api/servicio-cliente',
    crearManejadorServicioCliente(repos.servicioClienteRepositorio),
  );

  router.use('/dashboard', expressStatic(RUTA_BUILD_DASHBOARD));
  // Fallback para servir index.html (ej. al pedir /dashboard sin barra final) — sin esto, solo
  // /dashboard/ (con barra) resolvería al índice automáticamente.
  router.get('/dashboard', (_req, res) => res.sendFile(path.join(RUTA_BUILD_DASHBOARD, 'index.html')));

  return router;
}
