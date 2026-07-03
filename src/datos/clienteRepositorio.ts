import type { SupabaseClient } from '@supabase/supabase-js';
import type { Cliente, IClienteRepository } from './tipos';

// Forma de la fila tal como viene de Supabase (snake_case) antes de mapear a la entidad de dominio.
interface FilaCliente {
  id: string;
  telefono: string;
  nombre: string | null;
  ciudad: string | null;
  fecha_registro: string;
  ultima_interaccion: string | null;
}

function mapearFila(fila: FilaCliente): Cliente {
  return {
    id: fila.id,
    telefono: fila.telefono,
    nombre: fila.nombre,
    ciudad: fila.ciudad,
    fechaRegistro: new Date(fila.fecha_registro),
    ultimaInteraccion: fila.ultima_interaccion ? new Date(fila.ultima_interaccion) : null,
  };
}

export class ClienteRepositorio implements IClienteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async buscarPorTelefono(telefono: string): Promise<Cliente | null> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .maybeSingle();

    if (error) {
      throw new Error(`[clienteRepositorio] error buscando por telefono: ${error.message}`);
    }
    return data ? mapearFila(data as FilaCliente) : null;
  }

  async crear(datos: {
    telefono: string;
    nombre: string | null;
    ciudad: string | null;
  }): Promise<Cliente> {
    const { data, error } = await this.supabase
      .from('clientes')
      .insert({ telefono: datos.telefono, nombre: datos.nombre, ciudad: datos.ciudad })
      .select('*')
      .single();

    if (error || !data) {
      throw new Error(`[clienteRepositorio] error creando cliente: ${error?.message}`);
    }
    return mapearFila(data as FilaCliente);
  }

  async actualizarNombre(id: string, nombre: string): Promise<void> {
    const { error } = await this.supabase.from('clientes').update({ nombre }).eq('id', id);

    if (error) {
      throw new Error(`[clienteRepositorio] error actualizando nombre: ${error.message}`);
    }
  }

  async actualizarCiudad(id: string, ciudad: string): Promise<void> {
    const { error } = await this.supabase.from('clientes').update({ ciudad }).eq('id', id);

    if (error) {
      throw new Error(`[clienteRepositorio] error actualizando ciudad: ${error.message}`);
    }
  }

  async actualizarUltimaInteraccion(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('clientes')
      .update({ ultima_interaccion: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`[clienteRepositorio] error actualizando ultima_interaccion: ${error.message}`);
    }
  }
}
