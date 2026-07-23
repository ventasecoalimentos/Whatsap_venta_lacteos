import type { SupabaseClient } from '@supabase/supabase-js';
import type { IServicioClienteRepository, RegistroServicioCliente } from './tipos';

interface FilaServicioCliente {
  id: string;
  cliente_id: string;
  descripcion: string;
  tipo: 'PQR' | 'Sugerencia' | 'Facturacion';
  creado_en: string;
}

function mapearFila(fila: FilaServicioCliente): RegistroServicioCliente {
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    descripcion: fila.descripcion,
    tipo: fila.tipo,
    creadoEn: new Date(fila.creado_en),
  };
}

export class ServicioClienteRepositorio implements IServicioClienteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async crear(datos: {
    clienteId: string;
    descripcion: string;
    tipo: 'PQR' | 'Sugerencia' | 'Facturacion';
  }): Promise<RegistroServicioCliente> {
    const { data, error } = await this.supabase
      .from('servicio_cliente')
      .insert({
        cliente_id: datos.clienteId,
        descripcion: datos.descripcion,
        tipo: datos.tipo,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`[servicioClienteRepositorio] error creando registro: ${error?.message}`);
    }
    return mapearFila(data as FilaServicioCliente);
  }

  async listarTodos(): Promise<RegistroServicioCliente[]> {
    const { data, error } = await this.supabase
      .from('servicio_cliente')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);

    if (error) {
      throw new Error(`[servicioClienteRepositorio] error listando registros: ${error.message}`);
    }
    return (data as FilaServicioCliente[]).map(mapearFila);
  }
}
