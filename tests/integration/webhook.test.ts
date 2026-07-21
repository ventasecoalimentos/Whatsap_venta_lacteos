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
  IPedidoRepository,
  IQuejaRepository,
  Pedido,
  Queja,
} from '../../src/datos/tipos';
import type { IProveedorMensajeria } from '../../src/mensajeria/tipos';
import type { OpcionLista } from '../../src/motor/motorEstados';

// Test de integración del endpoint completo: mocks en memoria de los repositorios y del
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

function crearQuejaRepoFake(): IQuejaRepository & { creadas: Array<Omit<Queja, 'id' | 'creadoEn'>> } {
  const creadas: Array<Omit<Queja, 'id' | 'creadoEn'>> = [];
  return {
    creadas,
    async crear(datosQueja) {
      creadas.push(datosQueja);
      return { id: 'queja-fake', ...datosQueja, creadoEn: new Date() };
    },
  };
}

function crearProveedorFake(): IProveedorMensajeria & {
  textos: Array<{ telefono: string; mensaje: string }>;
  documentos: Array<{ telefono: string; urlOBase64: string; nombre: string }>;
  listas: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }>;
  botones: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }>;
} {
  const textos: Array<{ telefono: string; mensaje: string }> = [];
  const documentos: Array<{ telefono: string; urlOBase64: string; nombre: string }> = [];
  const listas: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }> = [];
  const botones: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }> = [];
  return {
    textos,
    documentos,
    listas,
    botones,
    async enviarTexto(telefono, mensaje) {
      textos.push({ telefono, mensaje });
    },
    async enviarDocumento(telefono, urlOBase64, nombre) {
      documentos.push({ telefono, urlOBase64, nombre });
    },
    async enviarLista(telefono, texto, opciones) {
      listas.push({ telefono, texto, opciones });
    },
    async enviarBotones(telefono, texto, opciones) {
      botones.push({ telefono, texto, opciones });
    },
  };
}

// Payloads provisionales estilo YCloud (ver src/http/mapeoYCloud.ts) — mismo formato asumido ahí.
function payloadTexto(telefono: string, texto: string, nombrePerfil?: string) {
  return {
    whatsappInboundMessage: {
      from: telefono,
      type: 'text',
      text: { body: texto },
      ...(nombrePerfil ? { customerProfile: { name: nombrePerfil } } : {}),
    },
  };
}

// Simula al cliente seleccionando una opción del List Message (en vez de escribir texto libre).
function payloadSeleccionLista(telefono: string, id: string, title: string) {
  return {
    whatsappInboundMessage: {
      from: telefono,
      type: 'interactive',
      interactive: { type: 'list_reply', list_reply: { id, title } },
    },
  };
}

// Simula al cliente tocando un Reply Button (en vez de escribir texto libre).
function payloadSeleccionBoton(telefono: string, id: string, title: string, nombrePerfil?: string) {
  return {
    whatsappInboundMessage: {
      from: telefono,
      type: 'interactive',
      interactive: { type: 'button_reply', button_reply: { id, title } },
      ...(nombrePerfil ? { customerProfile: { name: nombrePerfil } } : {}),
    },
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
  CATALOGO_DETAL_URL: 'https://ejemplo.test/catalogo-detal.pdf',
  CATALOGO_DISTRIBUCION_URL: 'https://ejemplo.test/catalogo-distribucion.pdf',
};

describe('POST /webhook', () => {
  let clienteRepo: ReturnType<typeof crearClienteRepoFake>;
  let conversacionRepo: ReturnType<typeof crearConversacionRepoFake>;
  let pedidoRepo: ReturnType<typeof crearPedidoRepoFake>;
  let quejaRepo: ReturnType<typeof crearQuejaRepoFake>;
  let proveedor: ReturnType<typeof crearProveedorFake>;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    clienteRepo = crearClienteRepoFake();
    conversacionRepo = crearConversacionRepoFake();
    pedidoRepo = crearPedidoRepoFake();
    quejaRepo = crearQuejaRepoFake();
    proveedor = crearProveedorFake();

    const casoDeUso = new ProcesarMensajeEntrante(
      clienteRepo,
      conversacionRepo,
      pedidoRepo,
      quejaRepo,
      proveedor,
      CATALOGOS_FAKE,
      24,
      0,
    );
    const app = crearApp(casoDeUso);
    ({ server, baseUrl } = await levantarServidor(app));
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function enviarMensaje(telefono: string, texto: string, nombrePerfil?: string) {
    await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadTexto(telefono, texto, nombrePerfil)),
    });
    await esperarProcesamiento();
  }

  async function enviarSeleccionLista(telefono: string, id: string, title: string) {
    await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSeleccionLista(telefono, id, title)),
    });
    await esperarProcesamiento();
  }

  async function enviarSeleccionBoton(
    telefono: string,
    id: string,
    title: string,
    nombrePerfil?: string,
  ) {
    await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSeleccionBoton(telefono, id, title, nombrePerfil)),
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
      quejaRepo,
      proveedor,
      CATALOGOS_FAKE,
      24,
      0,
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

  it('recorre el flujo completo de Ventas: nuevo → menú → nombre → ciudad → detal → interés → handoff', async () => {
    const telefono = '+573001112233';

    await enviarMensaje(telefono, 'Hola');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_PRINCIPAL);
    // Menú principal usa Reply Buttons (≤3 opciones), no List Message.
    expect(proveedor.botones).toHaveLength(1);
    expect(proveedor.botones[0].opciones.map((o) => o.titulo)).toEqual([
      'Servicio al cliente',
      'Ventas',
    ]);

    await enviarMensaje(telefono, 'Ventas');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_NOMBRE);

    await enviarMensaje(telefono, 'Juan Pérez');
    expect(clienteRepo.datos.get(telefono)?.nombre).toBe('Juan Pérez');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    // La pregunta de ciudad se manda como List Message, no como texto libre.
    expect(proveedor.listas.at(-1)?.opciones.map((o) => o.titulo)).toEqual([
      'Bogotá',
      'Yopal',
      'Villavicencio',
      'Otra ciudad',
    ]);

    await enviarMensaje(telefono, 'Bogotá');
    expect(clienteRepo.datos.get(telefono)?.ciudad).toBe('Bogotá');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_VENTAS);
    expect(proveedor.documentos).toHaveLength(0); // aún no se envía catálogo, falta elegir Detal/Distribución

    await enviarMensaje(telefono, 'Detal');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.CATALOGO_DETAL);
    expect(proveedor.documentos).toHaveLength(1);
    // El caso de uso debe resolver el nombre semántico del motor a la URL real del catálogo.
    expect(proveedor.documentos[0].urlOBase64).toBe(CATALOGOS_FAKE.CATALOGO_DETAL_URL);

    await enviarMensaje(telefono, 'Continuar pedido');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(pedidoRepo.creados).toHaveLength(1);
    expect(pedidoRepo.creados[0]).toMatchObject({
      ciudad: 'Bogotá',
      canal: 'detal',
    });
    expect(proveedor.textos.some((t) => t.mensaje === '💬')).toBe(true);
    expect(quejaRepo.creadas).toHaveLength(0);

    // Handoff es terminal hasta reinicio: el bot no debe volver a responder en el mismo hilo.
    const textosAntes = proveedor.textos.length;
    await enviarMensaje(telefono, 'Sigo esperando');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(proveedor.textos.length).toBe(textosAntes);
  });

  it('rama Distribución: selección real de menús (no solo texto libre) y canal=distribucion en el pedido', async () => {
    const telefono = '+573009998877';

    await enviarMensaje(telefono, 'Hola');
    // "Ventas" es un Reply Button en MENU_PRINCIPAL.
    await enviarSeleccionBoton(telefono, 'VENTAS', 'Ventas');
    await enviarMensaje(telefono, 'Ana');

    // El cliente toca la opción "Villavicencio" del List Message de ciudad en vez de escribirla.
    await enviarSeleccionLista(telefono, 'Villavicencio', 'Villavicencio');
    expect(clienteRepo.datos.get(telefono)?.ciudad).toBe('Villavicencio');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_VENTAS);

    // "Distribución" es un Reply Button en MENU_VENTAS.
    await enviarSeleccionBoton(telefono, 'DISTRIBUCION', 'Distribución');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.CATALOGO_DISTRIB);
    expect(proveedor.documentos.at(-1)?.urlOBase64).toBe(CATALOGOS_FAKE.CATALOGO_DISTRIBUCION_URL);

    // "Continuar pedido" es un Reply Button en CATALOGO_DISTRIB.
    await enviarSeleccionBoton(telefono, 'QUIERO_COMPRAR', 'Continuar pedido');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(pedidoRepo.creados).toHaveLength(1);
    expect(pedidoRepo.creados[0]).toMatchObject({ canal: 'distribucion', ciudad: 'Villavicencio' });
  });

  it('ofrece confirmar el nombre de perfil de WhatsApp y lo usa si el cliente acepta', async () => {
    const telefono = '+573007771122';

    await enviarMensaje(telefono, 'Hola', 'Andrew');
    await enviarSeleccionBoton(telefono, 'VENTAS', 'Ventas', 'Andrew');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(
      EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL,
    );
    expect(proveedor.botones.at(-1)?.texto).toContain('Andrew');
    // Nunca se llega a ESPERANDO_NOMBRE en texto libre — no se pidió nombre a secas.
    expect(clienteRepo.datos.get(telefono)?.nombre).toBeNull();

    await enviarSeleccionBoton(telefono, 'USAR_NOMBRE', 'Usar este nombre', 'Andrew');
    expect(clienteRepo.datos.get(telefono)?.nombre).toBe('Andrew');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
  });

  it('permite escribir un nombre distinto al de perfil si el cliente lo prefiere', async () => {
    const telefono = '+573007771133';

    await enviarMensaje(telefono, 'Hola', 'Andrew');
    await enviarSeleccionBoton(telefono, 'VENTAS', 'Ventas', 'Andrew');
    await enviarSeleccionBoton(telefono, 'ESCRIBIR_OTRO', 'Escribir otro', 'Andrew');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_NOMBRE);

    await enviarMensaje(telefono, 'Andrea');
    expect(clienteRepo.datos.get(telefono)?.nombre).toBe('Andrea');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
  });

  it('rama Servicio al cliente: queja de extremo a extremo, sin pedir nombre ni ciudad', async () => {
    const telefono = '+573005554433';

    await enviarMensaje(telefono, 'Hola');
    await enviarMensaje(telefono, 'Servicio al cliente');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.SERVICIO_CLIENTE);

    await enviarMensaje(telefono, 'Quejas o reclamos');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_QUEJA);

    await enviarMensaje(telefono, 'El pedido llegó incompleto');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);

    expect(quejaRepo.creadas).toHaveLength(1);
    expect(quejaRepo.creadas[0].descripcion).toBe('El pedido llegó incompleto');
    expect(pedidoRepo.creados).toHaveLength(0);
    // Nunca se pidió nombre ni ciudad en esta rama.
    expect(clienteRepo.datos.get(telefono)?.nombre).toBeNull();
    expect(clienteRepo.datos.get(telefono)?.ciudad).toBeNull();
    expect(proveedor.textos.some((t) => t.mensaje.includes('QUEJA/RECLAMO'))).toBe(true);
  });
});
