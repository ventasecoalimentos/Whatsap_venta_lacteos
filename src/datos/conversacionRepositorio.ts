import type { SupabaseClient } from '@supabase/supabase-js';
import type { Conversacion, EstadoConversacion, IConversacionRepository } from './tipos';

interface FilaConversacion {
  id: string;
  cliente_id: string;
  estado_actual: string;
  contexto: Record<string, unknown>;
  iniciada_en: string;
  actualizada_en: string;
}

function mapearFila(fila: FilaConversacion): Conversacion {
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    estadoActual: fila.estado_actual as EstadoConversacion,
    contexto: fila.contexto,
    iniciadaEn: new Date(fila.iniciada_en),
    actualizadaEn: new Date(fila.actualizada_en),
  };
}

export class ConversacionRepositorio implements IConversacionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async obtenerOCrear(clienteId: string): Promise<Conversacion> {
    // Upsert real por cliente_id (índice único en conversaciones.cliente_id, ver
    // docs/MODELO_DATOS.md): si ya existe una fila para este cliente, `ignoreDuplicates` evita
    // sobreescribir su estado/contexto — solo garantiza que exista antes de leerla.
    const { error: errorUpsert } = await this.supabase
      .from('conversaciones')
      .upsert({ cliente_id: clienteId }, { onConflict: 'cliente_id', ignoreDuplicates: true });

    if (errorUpsert) {
      throw new Error(`[conversacionRepositorio] error en upsert: ${errorUpsert.message}`);
    }

    const { data, error } = await this.supabase
      .from('conversaciones')
      .select('*')
      .eq('cliente_id', clienteId)
      .single();

    if (error || !data) {
      throw new Error(`[conversacionRepositorio] error obteniendo conversación: ${error?.message}`);
    }
    return mapearFila(data as FilaConversacion);
  }

  async actualizarEstado(
    id: string,
    estado: EstadoConversacion,
    contexto: Record<string, unknown>,
  ): Promise<void> {
    const { error } = await this.supabase
      .from('conversaciones')
      .update({
        estado_actual: estado,
        contexto,
        actualizada_en: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`[conversacionRepositorio] error actualizando estado: ${error.message}`);
    }
  }

  async listarPorEstado(estado: EstadoConversacion): Promise<Conversacion[]> {
    const { data, error } = await this.supabase
      .from('conversaciones')
      .select('*')
      .eq('estado_actual', estado);

    if (error) {
      throw new Error(`[conversacionRepositorio] error listando por estado: ${error.message}`);
    }
    return (data as FilaConversacion[]).map(mapearFila);
  }

  async actualizarContexto(id: string, contexto: Record<string, unknown>): Promise<void> {
    const { error } = await this.supabase.from('conversaciones').update({ contexto }).eq('id', id);

    if (error) {
      throw new Error(`[conversacionRepositorio] error actualizando contexto: ${error.message}`);
    }
  }
}
