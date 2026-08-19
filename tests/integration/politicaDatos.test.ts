import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/http/app';
import { ProcesarMensajeEntrante } from '../../src/application/procesarMensajeEntrante';
import { RegistrarRespuestaAsesor } from '../../src/application/registrarRespuestaAsesor';
import { EstadoConversacion } from '../../src/dominio/estadoConversacion';
import type {
  IClienteRepository,
  IConversacionRepository,
  IPedidoRepository,
  IServicioClienteRepository,
} from '../../src/datos/tipos';
import type { IProveedorMensajeria } from '../../src/mensajeria/tipos';

// La ruta /politica-datos no depende de repositorios ni del proveedor de mensajería — los fakes
// aquí solo satisfacen la firma de ProcesarMensajeEntrante/crearApp, nunca se llaman en este test.
function crearDependenciasSinUso() {
  const clienteRepo: IClienteRepository = {
    async buscarPorTelefono() {
      return null;
    },
    async buscarPorBsuid() {
      return null;
    },
    async buscarPorIdentificador() {
      return null;
    },
    async buscarPorId() {
      return null;
    },
    async crear(datos) {
      return {
        id: 'x',
        telefono: datos.identificador.tipo === 'telefono' ? datos.identificador.valor : null,
        bsuid: datos.identificador.tipo === 'bsuid' ? datos.identificador.valor : null,
        nombre: datos.nombre,
        ciudad: datos.ciudad,
        fechaRegistro: new Date(),
        ultimaInteraccion: null,
        aceptoTratamientoDatos: false,
        identificacion: null,
        correo: null,
      };
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
      return {
        id: clienteId,
        clienteId,
        estadoActual: EstadoConversacion.INICIO,
        contexto: {},
        iniciadaEn: new Date(),
        actualizadaEn: new Date(),
      };
    },
    async actualizarEstado() {},
    async listarPorEstado() {
      return [];
    },
    async actualizarContexto() {},
    async tocarActividad() {},
    async listarEnProgreso() {
      return [];
    },
  };
  const pedidoRepo: IPedidoRepository = {
    async crear(datos) {
      return { id: 'x', ...datos, ciudad: null, creadoEn: new Date() };
    },
    async listarTodos() {
      return [];
    },
  };
  const servicioClienteRepo: IServicioClienteRepository = {
    async crear(datos) {
      return { id: 'x', ...datos, creadoEn: new Date() };
    },
    async listarTodos() {
      return [];
    },
  };
  const proveedor: IProveedorMensajeria = {
    async enviarTexto() {},
    async enviarDocumento() {},
    async enviarImagen() {},
    async enviarLista() {},
    async enviarBotones() {},
  };

  return { clienteRepo, conversacionRepo, pedidoRepo, servicioClienteRepo, proveedor };
}

describe('GET /politica-datos', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const { clienteRepo, conversacionRepo, pedidoRepo, servicioClienteRepo, proveedor } =
      crearDependenciasSinUso();
    const casoDeUso = new ProcesarMensajeEntrante(
      clienteRepo,
      conversacionRepo,
      pedidoRepo,
      servicioClienteRepo,
      proveedor,
      'https://ejemplo.test/catalogo.pdf',
      'https://ejemplo.test/como-comprar.jpg',
      24,
      0,
    );
    const registrarRespuestaAsesor = new RegistrarRespuestaAsesor(clienteRepo, conversacionRepo);
    const app = crearApp(
      casoDeUso,
      registrarRespuestaAsesor,
      { clienteRepositorio: clienteRepo, pedidoRepositorio: pedidoRepo, servicioClienteRepositorio: servicioClienteRepo },
      { usuario: 'admin', contrasena: 'admin' },
    );
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const direccion = server.address();
    const puerto = typeof direccion === 'object' && direccion ? direccion.port : 0;
    baseUrl = `http://127.0.0.1:${puerto}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('responde 200 con HTML público, sin pedir autenticación', async () => {
    const respuesta = await fetch(`${baseUrl}/politica-datos`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('content-type')).toContain('text/html');

    const cuerpo = await respuesta.text();
    expect(cuerpo).toContain('Política de Tratamiento de Datos Personales');
    expect(cuerpo).toContain('Ecoalimentos del Llano S.A.S.');
    expect(cuerpo).toContain('Ley 1581 de 2012');
  });
});
