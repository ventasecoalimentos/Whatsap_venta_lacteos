import { describe, expect, it } from 'vitest';
import { RegistrarRespuestaAsesor } from '../../../src/application/registrarRespuestaAsesor';
import { CLAVE_ASESOR_RESPONDIO } from '../../../src/motor/transiciones/desdeHandoff';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import type { Cliente, Conversacion, IClienteRepository, IConversacionRepository } from '../../../src/datos/tipos';

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

function crearFakes(clientes: Cliente[], conversaciones: Conversacion[]) {
  const conversacionesPorCliente = new Map(conversaciones.map((c) => [c.clienteId, c]));
  const idsConActividadTocada: string[] = [];
  const idsObtenerOCrearLlamado: string[] = [];
  const contextosActualizados: Array<{ id: string; contexto: Record<string, unknown> }> = [];

  const clienteRepo: IClienteRepository = {
    async buscarPorTelefono(telefono) {
      return clientes.find((c) => c.telefono === telefono) ?? null;
    },
    async buscarPorId(id) {
      return clientes.find((c) => c.id === id) ?? null;
    },
    async crear() {
      throw new Error('no debería llamarse — este caso de uso nunca crea clientes nuevos');
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

  const conversacionRepo: IConversacionRepository = {
    async obtenerOCrear(clienteId) {
      idsObtenerOCrearLlamado.push(clienteId);
      const existente = conversacionesPorCliente.get(clienteId);
      if (existente) return existente;
      throw new Error('fixture incompleto: falta conversación para este cliente');
    },
    async actualizarEstado() {
      throw new Error('no debería llamarse — este caso de uso nunca cambia el estado');
    },
    async listarPorEstado() {
      return [];
    },
    async actualizarContexto(id, contexto) {
      const conversacion = [...conversacionesPorCliente.values()].find((c) => c.id === id);
      if (conversacion) conversacion.contexto = contexto;
      contextosActualizados.push({ id, contexto });
    },
    async tocarActividad(id) {
      idsConActividadTocada.push(id);
    },
  };

  return { clienteRepo, conversacionRepo, idsConActividadTocada, idsObtenerOCrearLlamado, contextosActualizados };
}

describe('RegistrarRespuestaAsesor', () => {
  it('cliente en HANDOFF_HUMANO: renueva la actividad de la conversación', async () => {
    const conversacion: Conversacion = {
      id: 'conv-1',
      clienteId: 'cli-1',
      estadoActual: EstadoConversacion.HANDOFF_HUMANO,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: new Date(0),
    };
    const { clienteRepo, conversacionRepo, idsConActividadTocada, contextosActualizados } = crearFakes(
      [crearCliente('cli-1', '+573000000001')],
      [conversacion],
    );
    const caso = new RegistrarRespuestaAsesor(clienteRepo, conversacionRepo);

    await caso.ejecutar('+573000000001');

    expect(idsConActividadTocada).toEqual(['conv-1']);
    expect(contextosActualizados).toEqual([{ id: 'conv-1', contexto: { [CLAVE_ASESOR_RESPONDIO]: true } }]);
  });

  it('teléfono que no es cliente del bot: se ignora sin tocar nada', async () => {
    const { clienteRepo, conversacionRepo, idsConActividadTocada, idsObtenerOCrearLlamado } = crearFakes([], []);
    const caso = new RegistrarRespuestaAsesor(clienteRepo, conversacionRepo);

    await expect(caso.ejecutar('+573000009999')).resolves.not.toThrow();

    expect(idsConActividadTocada).toEqual([]);
    expect(idsObtenerOCrearLlamado).toEqual([]);
  });

  it('cliente conocido pero conversación NO está en HANDOFF_HUMANO: se ignora', async () => {
    const conversacion: Conversacion = {
      id: 'conv-2',
      clienteId: 'cli-2',
      estadoActual: EstadoConversacion.MENU_PRINCIPAL,
      contexto: {},
      iniciadaEn: new Date(),
      actualizadaEn: new Date(0),
    };
    const { clienteRepo, conversacionRepo, idsConActividadTocada } = crearFakes(
      [crearCliente('cli-2', '+573000000002')],
      [conversacion],
    );
    const caso = new RegistrarRespuestaAsesor(clienteRepo, conversacionRepo);

    await caso.ejecutar('+573000000002');

    expect(idsConActividadTocada).toEqual([]);
  });
});
