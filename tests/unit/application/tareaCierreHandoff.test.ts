import { describe, expect, it } from 'vitest';
import { TareaCierreHandoff } from '../../../src/application/tareaCierreHandoff';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import type { Cliente, Conversacion, IClienteRepository, IConversacionRepository } from '../../../src/datos/tipos';
import type { IProveedorMensajeria } from '../../../src/mensajeria/tipos';
import type { IdentificadorCliente } from '../../../src/dominio/identificadorCliente';
import { MENSAJE_AVISO_PREVIO_CIERRE } from '../../../src/application/mensajeAvisoPrevioCierre';
import { MENSAJE_CIERRE_HANDOFF } from '../../../src/application/mensajeCierreHandoff';

const VENTANA_MIN = 30;
const AVISO_PREVIO_MIN = 5;

function crearCliente(id: string, telefono: string): Cliente {
  return {
    id,
    telefono,
    bsuid: null,
    nombre: 'Carlos',
    ciudad: null,
    fechaRegistro: new Date(),
    ultimaInteraccion: null,
    aceptoTratamientoDatos: true,
    identificacion: null,
    correo: null,
  };
}

function destinatarioTelefono(valor: string): IdentificadorCliente {
  return { tipo: 'telefono', valor };
}

function hace(minutos: number): Date {
  return new Date(Date.now() - minutos * 60_000);
}

function crearFakes(conversaciones: Conversacion[], clientes: Cliente[]) {
  const conversacionesMap = new Map(conversaciones.map((c) => [c.id, c]));
  const contextosActualizados: Array<{ id: string; contexto: Record<string, unknown> }> = [];
  const estadosActualizados: Array<{ id: string; estado: EstadoConversacion }> = [];
  const textosEnviados: Array<{ destinatario: IdentificadorCliente; mensaje: string }> = [];

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
    async listarEnProgreso() {
      return [...conversacionesMap.values()].filter(
        (c) => c.estadoActual !== EstadoConversacion.INICIO && c.estadoActual !== EstadoConversacion.HANDOFF_HUMANO,
      );
    },
  };

  const clienteRepo: IClienteRepository = {
    async buscarPorTelefono() {
      return null;
    },
    async buscarPorBsuid() {
      return null;
    },
    async buscarPorIdentificador() {
      throw new Error('no debería llamarse en esta tarea');
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
    async enviarTexto(destinatario, mensaje) {
      textosEnviados.push({ destinatario, mensaje });
    },
    async enviarDocumento() {},
    async enviarImagen() {},
    async enviarLista() {},
    async enviarBotones() {},
  };

  return { conversacionRepo, clienteRepo, proveedor, contextosActualizados, estadosActualizados, textosEnviados };
}

describe('TareaCierreHandoff — HANDOFF_HUMANO', () => {
  it('conversación reciente en handoff (asesor ya respondió): no manda nada', async () => {
    const conversacion: Conversacion = {
      id: 'conv-1',
      clienteId: 'cli-1',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: { asesorRespondio: true },
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

  it('conversación a 26 min (asesor ya respondió): manda el aviso previo y persiste el contexto sin cambiar el estado', async () => {
    const conversacion: Conversacion = {
      id: 'conv-2',
      clienteId: 'cli-2',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: { asesorRespondio: true },
      iniciadaEn: new Date(),
      actualizadaEn: hace(26),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados, contextosActualizados, estadosActualizados } =
      crearFakes([conversacion], [crearCliente('cli-2', '+573000000002')]);
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toEqual([
      { destinatario: destinatarioTelefono('+573000000002'), mensaje: MENSAJE_AVISO_PREVIO_CIERRE },
    ]);
    expect(contextosActualizados).toHaveLength(1);
    expect(estadosActualizados).toHaveLength(0);
    expect(conversacion.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
  });

  it('conversación a 35 min (asesor ya respondió): manda el cierre y resetea el estado a INICIO', async () => {
    const conversacion: Conversacion = {
      id: 'conv-3',
      clienteId: 'cli-3',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: { pqrsfTipo: 'PQR', asesorRespondio: true },
      iniciadaEn: new Date(),
      actualizadaEn: hace(35),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-3', '+573000000003')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toEqual([{ destinatario: destinatarioTelefono('+573000000003'), mensaje: MENSAJE_CIERRE_HANDOFF }]);
    expect(conversacion.estadoActual).toBe(EstadoConversacion.INICIO);
  });

  it('al cerrar, limpia las marcas de aviso previo y de respuesta del asesor (no deben arrastrarse a un futuro handoff)', async () => {
    const conversacion: Conversacion = {
      id: 'conv-3b',
      clienteId: 'cli-3b',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: { pqrsfTipo: 'PQR', avisoPrevioCierreEnviadoPara: 'algo', asesorRespondio: true },
      iniciadaEn: new Date(),
      actualizadaEn: hace(35),
    };
    const { conversacionRepo, clienteRepo, proveedor } = crearFakes(
      [conversacion],
      [crearCliente('cli-3b', '+573000000333')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(conversacion.contexto).toEqual({ pqrsfTipo: 'PQR' });
  });

  it('el asesor NUNCA ha respondido: no manda nada sin importar cuánto tiempo pase (sin SLA)', async () => {
    const conversacion: Conversacion = {
      id: 'conv-6',
      clienteId: 'cli-6',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(60 * 5), // 5 horas — muy por encima de la ventana de 30 min
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-6', '+573000000006')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toHaveLength(0);
    expect(conversacion.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
  });

  it('si no encuentra el cliente, no falla y simplemente no manda nada', async () => {
    const conversacion: Conversacion = {
      id: 'conv-5',
      clienteId: 'cli-inexistente',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: { asesorRespondio: true },
      iniciadaEn: new Date(),
      actualizadaEn: hace(40),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes([conversacion], []);
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await expect(tarea.ejecutarUnaVez()).resolves.not.toThrow();
    expect(textosEnviados).toHaveLength(0);
  });
});

describe('TareaCierreHandoff — conversaciones en progreso (abandonadas a mitad de flujo)', () => {
  it('conversación reciente en MENU_PRINCIPAL: no manda nada', async () => {
    const conversacion: Conversacion = {
      id: 'conv-7',
      clienteId: 'cli-7',
      estadoActual: EstadoConversacion.MENU_PRINCIPAL,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(2),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-7', '+573000000007')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toHaveLength(0);
  });

  it('cliente abandonado a 26 min en ESPERANDO_NOMBRE: manda el aviso previo sin cambiar el estado', async () => {
    const conversacion: Conversacion = {
      id: 'conv-8',
      clienteId: 'cli-8',
      estadoActual: EstadoConversacion.ESPERANDO_NOMBRE,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(26),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-8', '+573000000008')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toEqual([
      { destinatario: destinatarioTelefono('+573000000008'), mensaje: MENSAJE_AVISO_PREVIO_CIERRE },
    ]);
    expect(conversacion.estadoActual).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
  });

  it('cliente abandonado a 35 min en MENU_VENTAS: manda el cierre y resetea a INICIO', async () => {
    const conversacion: Conversacion = {
      id: 'conv-9',
      clienteId: 'cli-9',
      estadoActual: EstadoConversacion.MENU_VENTAS,
      contexto: { nombre: 'Ana' },
      iniciadaEn: new Date(),
      actualizadaEn: hace(35),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-9', '+573000000009')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toEqual([{ destinatario: destinatarioTelefono('+573000000009'), mensaje: MENSAJE_CIERRE_HANDOFF }]);
    expect(conversacion.estadoActual).toBe(EstadoConversacion.INICIO);
    expect(conversacion.contexto).toEqual({ nombre: 'Ana' });
  });

  it('conversación en INICIO, aunque esté "vieja", nunca se toca (nada que abandonar)', async () => {
    const conversacion: Conversacion = {
      id: 'conv-10',
      clienteId: 'cli-10',
      estadoActual: EstadoConversacion.INICIO,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: hace(60 * 24),
    };
    const { conversacionRepo, clienteRepo, proveedor, textosEnviados } = crearFakes(
      [conversacion],
      [crearCliente('cli-10', '+573000000010')],
    );
    const tarea = new TareaCierreHandoff(conversacionRepo, clienteRepo, proveedor, VENTANA_MIN, AVISO_PREVIO_MIN);

    await tarea.ejecutarUnaVez();

    expect(textosEnviados).toHaveLength(0);
  });
});
