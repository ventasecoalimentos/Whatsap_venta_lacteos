import type { SupabaseClient } from '@supabase/supabase-js';
import type { IPedidoRepository, Pedido } from './tipos';

interface FilaPedido {
  id: string;
  cliente_id: string;
  producto_interes: string;
  ciudad: string;
  canal: string;
  creado_en: string;
}

function mapearFila(fila: FilaPedido): Pedido {
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    productoInteres: fila.producto_interes,
    ciudad: fila.ciudad,
    canal: fila.canal as Pedido['canal'],
    creadoEn: new Date(fila.creado_en),
  };
}

export class PedidoRepositorio implements IPedidoRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async crear(datos: {
    clienteId: string;
    productoInteres: string;
    ciudad: string;
    canal: 'detal' | 'distribucion';
  }): Promise<Pedido> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .insert({
        cliente_id: datos.clienteId,
        producto_interes: datos.productoInteres,
        ciudad: datos.ciudad,
        canal: datos.canal,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`[pedidoRepositorio] error creando pedido: ${error?.message}`);
    }
    return mapearFila(data as FilaPedido);
  }

  async listarTodos(): Promise<Pedido[]> {
    const { data, error } = await this.supabase
      .from('pedidos')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);

    if (error) {
      throw new Error(`[pedidoRepositorio] error listando pedidos: ${error.message}`);
    }
    return (data as FilaPedido[]).map(mapearFila);
  }
}
