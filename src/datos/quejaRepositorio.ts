import type { SupabaseClient } from '@supabase/supabase-js';
import type { IQuejaRepository, Queja } from './tipos';

interface FilaQueja {
  id: string;
  cliente_id: string;
  descripcion: string;
  tipo: 'PQR' | 'Sugerencia';
  creado_en: string;
}

function mapearFila(fila: FilaQueja): Queja {
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    descripcion: fila.descripcion,
    tipo: fila.tipo,
    creadoEn: new Date(fila.creado_en),
  };
}

export class QuejaRepositorio implements IQuejaRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async crear(datos: {
    clienteId: string;
    descripcion: string;
    tipo: 'PQR' | 'Sugerencia';
  }): Promise<Queja> {
    const { data, error } = await this.supabase
      .from('quejas')
      .insert({
        cliente_id: datos.clienteId,
        descripcion: datos.descripcion,
        tipo: datos.tipo,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`[quejaRepositorio] error creando queja: ${error?.message}`);
    }
    return mapearFila(data as FilaQueja);
  }

  async listarTodos(): Promise<Queja[]> {
    const { data, error } = await this.supabase
      .from('quejas')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(500);

    if (error) {
      throw new Error(`[quejaRepositorio] error listando quejas: ${error.message}`);
    }
    return (data as FilaQueja[]).map(mapearFila);
  }
}
