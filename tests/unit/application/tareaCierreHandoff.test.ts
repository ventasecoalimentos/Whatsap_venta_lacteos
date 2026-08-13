import { describe, expect, it } from 'vitest';
import { TareaCierreHandoff } from '../../../src/application/tareaCierreHandoff';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import type { Cliente, Conversacion, IClienteRepository, IConversacionRepository } from '../../../src/datos/tipos';
import type { IProveedorMensajeria } from '../../../src/mensajeria/tipos';
import { MENSAJE_AVISO_PREVIO_CIERRE } from '../../../src/application/mensajeAvisoPrevioCierre';
import { MENSAJE_CIERRE_HANDOFF } from '../../../src/application/mensajeCierreHandoff';

const VENTANA_MIN = 30;
const AVISO_PREVIO_MIN = 5;

function crearCliente(id: string, telefono: string): Cliente {
  return {
    id,
    telefono,
    nombre: 'Carlos',
    ciudad: null,
    fechaRegistro: new Date(),
    ultimaInteraccion: null,
    aceptoTratamientoDatos: true,
    identificacion: null,
    correo: null,
  };
}

function hace(minutos: number): Date {
  return new Date(Date.now() - minutos * 60_000);
}

function crearFakes(conversaciones: Conversacion[], clientes: Cliente[]) {
  const conversacionesMap = new Map(conversaciones.map((c) => [c.id, c]));
  const contextosActualizados: Array<{ id: string; contexto: Record<string, unknown> }> = [];
  const estadosActualizados: Array<{ id: string; estado: EstadoConversacion }> = [];
  const textosEnviados: Array<{ telefono: string; mensaje: string }> = [];

  const conversacionRepo: IConversacionRepository = {
    async obtenerOCrear() {
      throw new Error('no debería llamarse en esta tarea');
    },
    async actualizarEstado(id, estado, contexto) {
      const conversacion = conversacionesMap.get(id);
      if (conversacion) {
        conversacion.estadoActual = estado;
        conversacion.contexto = contexto;
      }
      estadosActualizados.push({ id, estado });
    },
    async listarPorEstado(estado) {
      return [...conversacionesMap.values()].filter((c) => c.estadoActual === estado);
    },
    async actualizarContexto(id, contexto) {
      const conversacion = conversacionesMap.get(id);
      if (conversacion) conversacion.contexto = contexto;
      contextosActualizados.push({ id, contexto });
    },
    async tocarActividad() {},
  };

  const clienteRepo: IClienteRepository = {
    async buscarPorTelefono() {
      return null;
    },
    async buscarPorId(id) {
      return clientes.find((c) => c.id === id) ?? null;
    },
    async crear() {
      throw new Error('no debería llamarse en esta tarea');
    },
    async actualizarNombre() {},
    async actualizarUltimaInteraccion() {},
    async actualizarConsentimiento() {},
    async actualizarIdentificacion() {},
    async actualizarCorreo() {},
    async listarTodos() {
      return [];
    },
  };

  const proveedor: IProveedorMensajeria = {
    async enviarTexto(telefono, mensaje) {
      textosEnviados.push({ telefono, mensaje });
    },
    async enviarDocumento() {},
    async enviarImagen() {},
    async enviarLista() {},
    async enviarBotones() {},
  };

  return { conversacionRepo, clienteRepo, proveedor, contextosActualizados, estadosActualizados, textosEnviados };
}

describe('TareaCierreHandoff', () => {
  it('conversación reciente en handoff: no manda nada', async () => {
    const conversacion: Conversacion = {
      id: 'conv-1',
      clienteId: 'cli-1',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(2),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-1', '+573000000001')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toHaveLength(0);
  });

  it('conversación a 26 min: manda el aviso previo y persiste el contexto sin cambiar el estado', async () => {
    const conversacion: Conversacion = {
      id: 'conv-2',
      clienteId: 'cli-2',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(26),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados, contextosActualizados, estadosActualizados } =
      crearFakes([conversacion], [crearCliente('cli-2', '+573000000002')]);
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toEqual([{ telefono: '+573000000002', mensaje: MENSAJE_AVISO_PREVIO_CIERRE }]);
    expect(contextosActualizados).toHaveLength(1);
    expect(estadosActualizados).toHaveLength(0);
    expect(conversacion.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
  });

  it('conversación a 35 min: manda el cierre y resetea el estado a INICIO', async () => {
    const conversacion: Conversacion = {
      id: 'conv-3',
      clienteId: 'cli-3',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: { pqrsfTipo: 'PQR' },
      iniciadaEn: new Date(),
      actualizadaEn: hace(35),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-3', '+573000000003')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toEqual([{ telefono: '+573000000003', mensaje: MENSAJE_CIERRE_HANDOFF }]);
    expect(conversacion.estadoActual).toBe(EstadoConversacion.INICIO);
  });

  it('conversación en otro estado (no handoff) se ignora por completo', async () => {
    const conversacion: Conversacion = {
      id: 'conv-4',
      clienteId: 'cli-4',
      estadoActual: EstadoConversacion.MENU_PRINCIPAL,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(60),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-4', '+573000000004')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toHaveLength(0);
  });

  it('si no encuentra el cliente, no falla y simplemente no manda nada', async () => {
    const conversacion: Conversacion = {
      id: 'conv-5',
      clienteId: 'cli-inexistente',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(40),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes([conversacion], []);
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await expect(tarea.ejecutarUnaVez()).resolves.not.toThrow();
    expect(textosEnviados).toHaveLength(0);
  });
});
