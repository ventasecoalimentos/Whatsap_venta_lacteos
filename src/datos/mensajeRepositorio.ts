import type { SupabaseClient } from '@supabase/supabase-js';
import type { IMensajeRepository } from './tipos';

export class MensajeRepositorio implements IMensajeRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async registrar(datos: {
    conversacionId: string;
    direccion: 'in' | 'out';
    contenido: string;
  }): Promise<void> {
    const { error } = await this.supabase.from('mensajes').insert({
      conversacion_id: datos.conversacionId,
      direccion: datos.direccion,
      contenido: datos.contenido,
    });

    if (error) {
      throw new Error(`[mensajeRepositorio] error registrando mensaje: ${error.message}`);
    }
  }
}
