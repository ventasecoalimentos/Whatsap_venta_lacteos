import type { SupabaseClient } from '@supabase/supabase-js';
import { EstadoConversacion as EstadoConversacionValor } from '../dominio/estadoConversacion';
import type {
  Conversacion,
  ConversacionParaAviso,
  EstadoConversacion,
  IConversacionRepository,
} from './tipos';

interface FilaConversacion {
  id: string;
  cliente_id: string;
  estado_actual: string;
  contexto: Record<string, unknown>;
  iniciada_en: string;
  actualizada_en: string;
  aviso_demanda_enviado: boolean;
}

function mapearFila(fila: FilaConversacion): Conversacion {
  return {
    id: fila.id,
    clienteId: fila.cliente_id,
    estadoActual: fila.estado_actual as EstadoConversacion,
    contexto: fila.contexto,
    iniciadaEn: new Date(fila.iniciada_en),
    actualizadaEn: new Date(fila.actualizada_en),
    avisoDemandaEnviado: fila.aviso_demanda_enviado,
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
    // Cada vez que se (re)entra a HANDOFF_HUMANO (llegada nueva o el cliente vuelve a escribir
    // estando ya en handoff) se reinicia el aviso de "mucha demanda" — así puede recibirlo otra
    // vez tras otros 30 min de silencio (ver src/application/avisoDemanda.ts).
    const { error } = await this.supabase
      .from('conversaciones')
      .update({
        estado_actual: estado,
        contexto,
        actualizada_en: new Date().toISOString(),
        ...(estado === EstadoConversacionValor.HANDOFF_HUMANO
          ? { aviso_demanda_enviado: false }
          : {}),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`[conversacionRepositorio] error actualizando estado: ${error.message}`);
    }
  }

  async listarParaAvisoDemanda(umbralMs: number): Promise<ConversacionParaAviso[]> {
    const limite = new Date(Date.now() - umbralMs).toISOString();
    const { data, error } = await this.supabase
      .from('conversaciones')
      .select('id, clientes(telefono)')
      .eq('estado_actual', EstadoConversacionValor.HANDOFF_HUMANO)
      .eq('aviso_demanda_enviado', false)
      .lte('actualizada_en', limite);

    if (error) {
      throw new Error(`[conversacionRepositorio] error listando para aviso de demanda: ${error.message}`);
    }

    return ((data ?? []) as unknown as { id: string; clientes: { telefono: string } | null }[])
      .filter((fila) => fila.clientes !== null)
      .map((fila) => ({ conversacionId: fila.id, telefono: (fila.clientes as { telefono: string }).telefono }));
  }

  async marcarAvisoDemandaEnviado(conversacionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('conversaciones')
      .update({ aviso_demanda_enviado: true })
      .eq('id', conversacionId);

    if (error) {
      throw new Error(`[conversacionRepositorio] error marcando aviso de demanda: ${error.message}`);
    }
  }
}
