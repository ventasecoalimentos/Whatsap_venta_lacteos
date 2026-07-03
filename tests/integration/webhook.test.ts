import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/http/app';
import { ProcesarMensajeEntrante } from '../../src/application/procesarMensajeEntrante';
import { EstadoConversacion } from '../../src/dominio/estadoConversacion';
import type {
  Cliente,
  Conversacion,
  IClienteRepository,
  IConversacionRepository,
  IMensajeRepository,
  IPedidoRepository,
  Pedido,
} from '../../src/datos/tipos';
import type { IProveedorMensajeria } from '../../src/mensajeria/tipos';

// Test de integración del endpoint completo: mocks en memoria de los 4 repositorios y del
// proveedor de mensajería — nunca golpea Supabase ni YCloud reales (ver docs/DELEGACION.md).

function crearClienteRepoFake(): IClienteRepository & { datos: Map<string, Cliente> } {
  const datos = new Map<string, Cliente>();
  return {
    datos,
    async buscarPorTelefono(telefono) {
      return datos.get(telefono) ?? null;
    },
    async crear({ telefono, nombre, ciudad }) {
      const cliente: Cliente = {
        id: telefono,
        telefono,
        nombre,
        ciudad,
        fechaRegistro: new Date(),
        ultimaInteraccion: null,
      };
      datos.set(telefono, cliente);
      return cliente;
    },
    async actualizarNombre(id, nombre) {
      const cliente = [...datos.values()].find((c) => c.id === id);
      if (cliente) cliente.nombre = nombre;
    },
    async actualizarCiudad(id, ciudad) {
      const cliente = [...datos.values()].find((c) => c.id === id);
      if (cliente) cliente.ciudad = ciudad;
    },
    async actualizarUltimaInteraccion(id) {
      const cliente = [...datos.values()].find((c) => c.id === id);
      if (cliente) cliente.ultimaInteraccion = new Date();
    },
  };
}

function crearConversacionRepoFake(): IConversacionRepository & { datos: Map<string, Conversacion> } {
  const datos = new Map<string, Conversacion>();
  return {
    datos,
    async obtenerOCrear(clienteId) {
      const existente = datos.get(clienteId);
      if (existente) return existente;
      const nueva: Conversacion = {
        id: clienteId,
        clienteId,
        estadoActual: EstadoConversacion.INICIO,
        contexto: {},
        iniciadaEn: new Date(),
        actualizadaEn: new Date(),
      };
      datos.set(clienteId, nueva);
      return nueva;
    },
    async actualizarEstado(id, estado, contexto) {
      const conversacion = datos.get(id);
      if (conversacion) {
        conversacion.estadoActual = estado;
        conversacion.contexto = contexto;
        conversacion.actualizadaEn = new Date();
      }
    },
  };
}

function crearPedidoRepoFake(): IPedidoRepository & { creados: Array<Omit<Pedido, 'id' | 'creadoEn'>> } {
  const creados: Array<Omit<Pedido, 'id' | 'creadoEn'>> = [];
  return {
    creados,
    async crear(datosPedido) {
      creados.push(datosPedido);
      return { id: 'pedido-fake', ...datosPedido, creadoEn: new Date() };
    },
  };
}

function crearMensajeRepoFake(): IMensajeRepository & {
  registrados: Array<{ direccion: 'in' | 'out'; contenido: string }>;
} {
  const registrados: Array<{ direccion: 'in' | 'out'; contenido: string }> = [];
  return {
    registrados,
    async registrar({ direccion, contenido }) {
      registrados.push({ direccion, contenido });
    },
  };
}

function crearProveedorFake(): IProveedorMensajeria & {
  textos: Array<{ telefono: string; mensaje: string }>;
  documentos: Array<{ telefono: string; urlOBase64: string; nombre: string }>;
} {
  const textos: Array<{ telefono: string; mensaje: string }> = [];
  const documentos: Array<{ telefono: string; urlOBase64: string; nombre: string }> = [];
  return {
    textos,
    documentos,
    async enviarTexto(telefono, mensaje) {
      textos.push({ telefono, mensaje });
    },
    async enviarDocumento(telefono, urlOBase64, nombre) {
      documentos.push({ telefono, urlOBase64, nombre });
    },
  };
}

// Payload provisional estilo YCloud (ver src/http/mapeoYCloud.ts) — mismo formato asumido ahí.
function payloadTexto(telefono: string, texto: string) {
  return {
    whatsappInboundMessage: { from: telefono, type: 'text', text: { body: texto } },
  };
}

async function levantarServidor(app: ReturnType<typeof crearApp>): Promise<{ server: Server; baseUrl: string }> {
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const direccion = server.address();
  const puerto = typeof direccion === 'object' && direccion ? direccion.port : 0;
  return { server, baseUrl: `http://127.0.0.1:${puerto}` };
}

const esperarProcesamiento = () => new Promise((resolve) => setTimeout(resolve, 20));

const CATALOGOS_FAKE = {
  CATALOGO_COMPLETO_URL: 'https://ejemplo.test/catalogo-completo.pdf',
  CATALOGO_REDUCIDO_URL: 'https://ejemplo.test/catalogo-reducido.pdf',
};

describe('POST /webhook', () => {
  let clienteRepo: ReturnType<typeof crearClienteRepoFake>;
  let conversacionRepo: ReturnType<typeof crearConversacionRepoFake>;
  let pedidoRepo: ReturnType<typeof crearPedidoRepoFake>;
  let mensajeRepo: ReturnType<typeof crearMensajeRepoFake>;
  let proveedor: ReturnType<typeof crearProveedorFake>;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    clienteRepo = crearClienteRepoFake();
    conversacionRepo = crearConversacionRepoFake();
    pedidoRepo = crearPedidoRepoFake();
    mensajeRepo = crearMensajeRepoFake();
    proveedor = crearProveedorFake();

    const casoDeUso = new ProcesarMensajeEntrante(
      clienteRepo,
      conversacionRepo,
      pedidoRepo,
      mensajeRepo,
      proveedor,
      CATALOGOS_FAKE,
    );
    const app = crearApp(casoDeUso);
    ({ server, baseUrl } = await levantarServidor(app));
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function enviarMensaje(telefono: string, texto: string) {
    await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadTexto(telefono, texto)),
    });
    await esperarProcesamiento();
  }

  it('responde 200 aunque el payload no traiga un mensaje reconocible', async () => {
    const respuesta = await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evento: 'desconocido' }),
    });
    expect(respuesta.status).toBe(200);
  });

  it('responde 200 aunque el caso de uso lance una excepción', async () => {
    const clienteRepoRoto: IClienteRepository = {
      async buscarPorTelefono() {
        throw new Error('fallo simulado de base de datos');
      },
      async crear() {
        throw new Error('no debería llamarse');
      },
      async actualizarNombre() {},
      async actualizarCiudad() {},
      async actualizarUltimaInteraccion() {},
    };
    const casoDeUsoRoto = new ProcesarMensajeEntrante(
      clienteRepoRoto,
      conversacionRepo,
      pedidoRepo,
      mensajeRepo,
      proveedor,
      CATALOGOS_FAKE,
    );
    const appRoto = crearApp(casoDeUsoRoto);
    const { server: servidorRoto, baseUrl: urlRoto } = await levantarServidor(appRoto);

    const respuesta = await fetch(`${urlRoto}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadTexto('+573000000000', 'hola')),
    });
    expect(respuesta.status).toBe(200);

    await new Promise<void>((resolve) => servidorRoto.close(() => resolve()));
  });

  it('recorre el flujo completo: cliente nuevo → nombre → ciudad → catálogo → interés → handoff', async () => {
    const telefono = '+573001112233';

    await enviarMensaje(telefono, 'Hola');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_NOMBRE);

    await enviarMensaje(telefono, 'Juan Pérez');
    expect(clienteRepo.datos.get(telefono)?.nombre).toBe('Juan Pérez');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_CIUDAD);

    await enviarMensaje(telefono, 'Bogotá');
    expect(clienteRepo.datos.get(telefono)?.ciudad).toBe('Bogotá');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(proveedor.documentos.length).toBeGreaterThan(0);
    // El caso de uso debe resolver el token que devuelve el motor a la URL real del catálogo,
    // no reenviar el nombre de la variable de entorno tal cual.
    expect(proveedor.documentos[0].urlOBase64).toBe(CATALOGOS_FAKE.CATALOGO_COMPLETO_URL);

    await enviarMensaje(telefono, 'Listo');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_INTERES);

    await enviarMensaje(telefono, 'Mozzarella libra');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(pedidoRepo.creados).toHaveLength(1);
    expect(pedidoRepo.creados[0]).toMatchObject({
      productoInteres: 'Mozzarella libra',
      ciudad: 'Bogotá',
    });
    expect(proveedor.textos.some((t) => t.mensaje.includes('NUEVO CLIENTE'))).toBe(true);

    // Handoff es terminal hasta reinicio: el bot no debe volver a responder en el mismo hilo.
    const textosAntes = proveedor.textos.length;
    await enviarMensaje(telefono, 'Sigo esperando');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(proveedor.textos.length).toBe(textosAntes);
  });
});
