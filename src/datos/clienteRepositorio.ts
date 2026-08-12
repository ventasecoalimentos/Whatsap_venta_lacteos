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
  acepto_tratamiento_datos: boolean;
  identificacion: string | null;
  correo: string | null;
}

function mapearFila(fila: FilaCliente): Cliente {
  return {
    id: fila.id,
    telefono: fila.telefono,
    nombre: fila.nombre,
    ciudad: fila.ciudad,
    fechaRegistro: new Date(fila.fecha_registro),
    ultimaInteraccion: fila.ultima_interaccion ? new Date(fila.ultima_interaccion) : null,
    aceptoTratamientoDatos: fila.acepto_tratamiento_datos,
    identificacion: fila.identificacion,
    correo: fila.correo,
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

  async buscarPorId(id: string): Promise<Cliente | null> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`[clienteRepositorio] error buscando por id: ${error.message}`);
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

  async actualizarUltimaInteraccion(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('clientes')
      .update({ ultima_interaccion: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`[clienteRepositorio] error actualizando ultima_interaccion: ${error.message}`);
    }
  }

  async actualizarConsentimiento(id: string, aceptoTratamientoDatos: boolean): Promise<void> {
    const { error } = await this.supabase
      .from('clientes')
      .update({ acepto_tratamiento_datos: aceptoTratamientoDatos })
      .eq('id', id);

    if (error) {
      throw new Error(`[clienteRepositorio] error actualizando consentimiento: ${error.message}`);
    }
  }

  async actualizarIdentificacion(id: string, identificacion: string): Promise<void> {
    const { error } = await this.supabase.from('clientes').update({ identificacion }).eq('id', id);

    if (error) {
      throw new Error(`[clienteRepositorio] error actualizando identificacion: ${error.message}`);
    }
  }

  async actualizarCorreo(id: string, correo: string): Promise<void> {
    const { error } = await this.supabase.from('clientes').update({ correo }).eq('id', id);

    if (error) {
      throw new Error(`[clienteRepositorio] error actualizando correo: ${error.message}`);
    }
  }

  async listarTodos(): Promise<Cliente[]> {
    const { data, error } = await this.supabase
      .from('clientes')
      .select('*')
      .order('fecha_registro', { ascending: false })
      .limit(500);

    if (error) {
      throw new Error(`[clienteRepositorio] error listando clientes: ${error.message}`);
    }
    return (data as FilaCliente[]).map(mapearFila);
  }
}
