import type { Request, Response } from 'express';
import type { IClienteRepository, IPedidoRepository, IQuejaRepository } from '../datos/tipos';

export function crearManejadorClientes(clienteRepositorio: IClienteRepository) {
  return async function manejarClientes(_req: Request, res: Response): Promise<void> {
    try {
      const clientes = await clienteRepositorio.listarTodos();
      res.json(clientes);
    } catch (error) {
      console.error('[dashboardController] error listando clientes:', error);
      res.sendStatus(500);
    }
  };
}

export function crearManejadorPedidos(pedidoRepositorio: IPedidoRepository) {
  return async function manejarPedidos(_req: Request, res: Response): Promise<void> {
    try {
      const pedidos = await pedidoRepositorio.listarTodos();
      res.json(pedidos);
    } catch (error) {
      console.error('[dashboardController] error listando pedidos:', error);
      res.sendStatus(500);
    }
  };
}

export function crearManejadorQuejas(quejaRepositorio: IQuejaRepository) {
  return async function manejarQuejas(_req: Request, res: Response): Promise<void> {
    try {
      const quejas = await quejaRepositorio.listarTodos();
      res.json(quejas);
    } catch (error) {
      console.error('[dashboardController] error listando quejas:', error);
      res.sendStatus(500);
    }
  };
}
