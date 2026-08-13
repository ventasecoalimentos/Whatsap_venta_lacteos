import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { crearApp } from '../../src/http/app';
import { ProcesarMensajeEntrante } from '../../src/application/procesarMensajeEntrante';
import { RegistrarRespuestaAsesor } from '../../src/application/registrarRespuestaAsesor';
import { EstadoConversacion } from '../../src/dominio/estadoConversacion';
import type {
  Cliente,
  Conversacion,
  IClienteRepository,
  IConversacionRepository,
  IPedidoRepository,
  IServicioClienteRepository,
  Pedido,
  RegistroServicioCliente,
} from '../../src/datos/tipos';
import type { IProveedorMensajeria } from '../../src/mensajeria/tipos';
import type { OpcionLista } from '../../src/motor/motorEstados';

// Test de integración del endpoint completo: mocks en memoria de los repositorios y del
// proveedor de mensajería — nunca golpea Supabase ni YCloud reales (ver docs/ARQUITECTURA.md).

function crearClienteRepoFake(): IClienteRepository & { datos: Map<string, Cliente> } {
  const datos = new Map<string, Cliente>();
  return {
    datos,
    async buscarPorTelefono(telefono) {
      return datos.get(telefono) ?? null;
    },
    async buscarPorId(id) {
      return [...datos.values()].find((c) => c.id === id) ?? null;
    },
    async crear({ telefono, nombre, ciudad }) {
      const cliente: Cliente = {
        id: telefono,
        telefono,
        nombre,
        ciudad,
        fechaRegistro: new Date(),
        ultimaInteraccion: null,
        aceptoTratamientoDatos: false,
        identificacion: null,
        correo: null,
      };
      datos.set(telefono, cliente);
      return cliente;
    },
    async actualizarNombre(id, nombre) {
      const cliente = datos.get(id);
      if (cliente) cliente.nombre = nombre;
    },
    async actualizarUltimaInteraccion(id) {
      const cliente = datos.get(id);
      if (cliente) cliente.ultimaInteraccion = new Date();
    },
    async actualizarConsentimiento(id, aceptoTratamientoDatos) {
      const cliente = datos.get(id);
      if (cliente) cliente.aceptoTratamientoDatos = aceptoTratamientoDatos;
    },
    async actualizarIdentificacion(id, identificacion) {
      const cliente = datos.get(id);
      if (cliente) cliente.identificacion = identificacion;
    },
    async actualizarCorreo(id, correo) {
      const cliente = datos.get(id);
      if (cliente) cliente.correo = correo;
    },
    async listarTodos() {
      return [...datos.values()];
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
    async listarPorEstado(estado) {
      return [...datos.values()].filter((c) => c.estadoActual === estado);
    },
    async actualizarContexto(id, contexto) {
      const conversacion = datos.get(id);
      if (conversacion) conversacion.contexto = contexto;
    },
    async tocarActividad(id) {
      const conversacion = datos.get(id);
      if (conversacion) conversacion.actualizadaEn = new Date();
    },
  };
}

function crearPedidoRepoFake(): IPedidoRepository & { creados: Array<Omit<Pedido, 'id' | 'ciudad' | 'creadoEn'>> } {
  const creados: Array<Omit<Pedido, 'id' | 'ciudad' | 'creadoEn'>> = [];
  return {
    creados,
    async crear(datosPedido) {
      creados.push(datosPedido);
      return { id: 'pedido-fake', ...datosPedido, ciudad: null, creadoEn: new Date() };
    },
    async listarTodos() {
      return [];
    },
  };
}

function crearServicioClienteRepoFake(): IServicioClienteRepository & {
  creados: Array<Omit<RegistroServicioCliente, 'id' | 'creadoEn'>>;
} {
  const creados: Array<Omit<RegistroServicioCliente, 'id' | 'creadoEn'>> = [];
  return {
    creados,
    async crear(datosRegistro) {
      creados.push(datosRegistro);
      return { id: 'registro-fake', ...datosRegistro, creadoEn: new Date() };
    },
    async listarTodos() {
      return [];
    },
  };
}

function crearProveedorFake(): IProveedorMensajeria & {
  textos: Array<{ telefono: string; mensaje: string }>;
  documentos: Array<{ telefono: string; urlOBase64: string; nombre: string }>;
  imagenes: Array<{ telefono: string; urlOBase64: string }>;
  listas: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }>;
  botones: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }>;
} {
  const textos: Array<{ telefono: string; mensaje: string }> = [];
  const documentos: Array<{ telefono: string; urlOBase64: string; nombre: string }> = [];
  const imagenes: Array<{ telefono: string; urlOBase64: string }> = [];
  const listas: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }> = [];
  const botones: Array<{ telefono: string; texto: string; opciones: OpcionLista[] }> = [];
  return {
    textos,
    documentos,
    imagenes,
    listas,
    botones,
    async enviarTexto(telefono, mensaje) {
      textos.push({ telefono, mensaje });
    },
    async enviarDocumento(telefono, urlOBase64, nombre) {
      documentos.push({ telefono, urlOBase64, nombre });
    },
    async enviarImagen(telefono, urlOBase64) {
      imagenes.push({ telefono, urlOBase64 });
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

function payloadSeleccionBoton(telefono: string, id: string, title: string) {
  return {
    whatsappInboundMessage: {
      from: telefono,
      type: 'interactive',
      interactive: { type: 'button_reply', button_reply: { id, title } },
    },
  };
}

function payloadImagen(telefono: string) {
  return {
    whatsappInboundMessage: {
      from: telefono,
      type: 'image',
    },
  };
}

// Payload real de whatsapp.smb.message.echoes (confirmado 2026-08-13, ver mapeoYCloud.ts) — mensaje
// que el asesor manda desde la app nativa de WhatsApp, no desde el bot.
function payloadEcoAsesor(telefonoNegocio: string, telefonoCliente: string) {
  return {
    type: 'whatsapp.smb.message.echoes',
    whatsappMessage: {
      from: telefonoNegocio,
      to: telefonoCliente,
      type: 'text',
      text: { body: 'Ya te ayudo' },
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

const CATALOGO_FAKE_URL = 'https://ejemplo.test/catalogo-llano-lacteos.pdf';
const COMO_COMPRAR_FAKE_URL = 'https://ejemplo.test/como-comprar.jpg';
const CREDENCIALES_FAKE = { usuario: 'admin', contrasena: 'admin' };

describe('POST /webhook', () => {
  let clienteRepo: ReturnType<typeof crearClienteRepoFake>;
  let conversacionRepo: ReturnType<typeof crearConversacionRepoFake>;
  let pedidoRepo: ReturnType<typeof crearPedidoRepoFake>;
  let servicioClienteRepo: ReturnType<typeof crearServicioClienteRepoFake>;
  let proveedor: ReturnType<typeof crearProveedorFake>;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    clienteRepo = crearClienteRepoFake();
    conversacionRepo = crearConversacionRepoFake();
    pedidoRepo = crearPedidoRepoFake();
    servicioClienteRepo = crearServicioClienteRepoFake();
    proveedor = crearProveedorFake();

    const casoDeUso = new ProcesarMensajeEntrante(
      clienteRepo,
      conversacionRepo,
      pedidoRepo,
      servicioClienteRepo,
      proveedor,
      CATALOGO_FAKE_URL,
      COMO_COMPRAR_FAKE_URL,
      24, // ventanaInactividadHoras
      0, // delayTrasDocumentoMs — sin esperar de verdad en los tests
    );
    const registrarRespuestaAsesor = new RegistrarRespuestaAsesor(clienteRepo, conversacionRepo);
    const app = crearApp(
      casoDeUso,
      registrarRespuestaAsesor,
      { clienteRepositorio: clienteRepo, pedidoRepositorio: pedidoRepo, servicioClienteRepositorio: servicioClienteRepo },
      CREDENCIALES_FAKE,
    );
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

  async function enviarSeleccionBoton(telefono: string, id: string, title: string) {
    await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSeleccionBoton(telefono, id, title)),
    });
    await esperarProcesamiento();
  }

  async function enviarImagen(telefono: string) {
    await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadImagen(telefono)),
    });
    await esperarProcesamiento();
  }

  async function enviarEcoAsesor(telefonoCliente: string) {
    await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadEcoAsesor('+573000009999', telefonoCliente)),
    });
    await esperarProcesamiento();
  }

  // Lleva un cliente nuevo hasta MENU_PRINCIPAL (consentimiento + nombre), tal como lo haría un
  // cliente real que recién escribe por primera vez.
  async function registrarClienteNuevo(telefono: string, nombre: string) {
    await enviarMensaje(telefono, 'Hola');
    await enviarMensaje(telefono, 'Autorizo');
    await enviarMensaje(telefono, nombre);
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
      async buscarPorId() {
        return null;
      },
      async crear() {
        throw new Error('no debería llamarse');
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
    const casoDeUsoRoto = new ProcesarMensajeEntrante(
      clienteRepoRoto,
      conversacionRepo,
      pedidoRepo,
      servicioClienteRepo,
      proveedor,
      CATALOGO_FAKE_URL,
      COMO_COMPRAR_FAKE_URL,
      24,
      0,
    );
    const registrarRespuestaAsesorRoto = new RegistrarRespuestaAsesor(clienteRepoRoto, conversacionRepo);
    const appRoto = crearApp(
      casoDeUsoRoto,
      registrarRespuestaAsesorRoto,
      { clienteRepositorio: clienteRepo, pedidoRepositorio: pedidoRepo, servicioClienteRepositorio: servicioClienteRepo },
      CREDENCIALES_FAKE,
    );
    const { server: servidorRoto, baseUrl: urlRoto } = await levantarServidor(appRoto);

    const respuesta = await fetch(`${urlRoto}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadTexto('+573000000000', 'hola')),
    });
    expect(respuesta.status).toBe(200);

    await new Promise<void>((resolve) => servidorRoto.close(() => resolve()));
  });

  it('flujo completo de Ventas: nuevo → consentimiento → nombre → menú → detal → catálogo → handoff', async () => {
    const telefono = '+573001112233';

    await enviarMensaje(telefono, 'Hola');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(
      EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
    );

    await enviarMensaje(telefono, 'Autorizo');
    expect(clienteRepo.datos.get(telefono)?.aceptoTratamientoDatos).toBe(true);
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_NOMBRE);

    await enviarMensaje(telefono, 'Juan Pérez');
    expect(clienteRepo.datos.get(telefono)?.nombre).toBe('Juan Pérez');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(proveedor.botones.at(-1)?.texto).toContain('Juan Pérez');

    await enviarMensaje(telefono, 'Ventas');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_VENTAS);

    await enviarMensaje(telefono, 'Detal');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(proveedor.documentos).toHaveLength(1);
    expect(proveedor.documentos[0].urlOBase64).toBe(CATALOGO_FAKE_URL);
    expect(proveedor.imagenes).toHaveLength(1);
    expect(proveedor.imagenes[0].urlOBase64).toBe(COMO_COMPRAR_FAKE_URL);
    expect(proveedor.textos.some((t) => t.mensaje.includes('catálogo'))).toBe(true);

    await enviarMensaje(telefono, 'Continuar pedido');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(pedidoRepo.creados).toHaveLength(1);
    expect(pedidoRepo.creados[0]).toMatchObject({ canal: 'detal' });
    expect(proveedor.textos.some((t) => t.mensaje.includes('Resumen del pedido'))).toBe(true);
    expect(servicioClienteRepo.creados).toHaveLength(0);

    // Handoff no vuelve a seguir el flujo normal — pero si el cliente escribe de nuevo, recibe el
    // aviso de "mucha demanda" (no sabemos si el asesor ya respondió, ver docs/FLUJO_ESTADOS.md).
    await enviarMensaje(telefono, 'Sigo esperando');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(proveedor.textos.at(-1)?.mensaje).toContain('demanda');
  });

  it('bug reproducido: un botón "Menú anterior" de un menú viejo NO se guarda como nombre', async () => {
    const telefono = '+573006661122';

    // El cliente llega hasta ESPERANDO_NOMBRE (mismo camino que registrarClienteNuevo, pero sin
    // mandar el nombre todavía).
    await enviarMensaje(telefono, 'Hola');
    await enviarMensaje(telefono, 'Autorizo');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_NOMBRE);

    // En vez de escribir su nombre, toca un botón "Menú anterior" de un mensaje viejo que sigue
    // visible en el chat (WhatsApp no los invalida) — mismo id real: MENU_ANTERIOR_SERVICIO.
    await enviarSeleccionBoton(telefono, 'MENU_ANTERIOR_SERVICIO', 'Menú anterior');

    // No debe quedar guardado como nombre, ni avanzar de estado.
    expect(clienteRepo.datos.get(telefono)?.nombre).toBeNull();
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
    expect(proveedor.textos.at(-1)?.mensaje).toContain('menú anterior');

    // El flujo sigue intacto: si ahora sí escribe su nombre, se captura normalmente.
    await enviarMensaje(telefono, 'Laura Gómez');
    expect(clienteRepo.datos.get(telefono)?.nombre).toBe('Laura Gómez');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });

  it('rama Negocio: selección real de botones (no solo texto libre) y canal=negocio en el pedido', async () => {
    const telefono = '+573009998877';

    await registrarClienteNuevo(telefono, 'Ana');
    await enviarSeleccionBoton(telefono, 'VENTAS', 'Ventas');
    await enviarSeleccionBoton(telefono, 'NEGOCIO', 'Negocio');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.CATALOGO_ENVIADO);

    await enviarSeleccionBoton(telefono, 'QUIERO_COMPRAR', 'Continuar pedido');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(pedidoRepo.creados).toHaveLength(1);
    expect(pedidoRepo.creados[0]).toMatchObject({ canal: 'negocio' });
  });

  it('rama Servicio al cliente → PQRSF: queja de extremo a extremo, sin pedir nombre otra vez', async () => {
    const telefono = '+573005554433';

    await registrarClienteNuevo(telefono, 'Carlos');
    await enviarMensaje(telefono, 'Servicio al cliente');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.SERVICIO_CLIENTE);

    await enviarMensaje(telefono, 'PQRSF');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_TIPO_PQRSF);

    await enviarMensaje(telefono, 'PQR');
    // El cliente ya tiene nombre (registrarClienteNuevo) — PQR lo salta y va directo a
    // identificación.
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(
      EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
    );

    // El asesor lo lee tal cual — "123.456.789" se normaliza a solo dígitos.
    await enviarMensaje(telefono, '123.456.789');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);

    // Un correo con estructura inválida no avanza el estado.
    await enviarMensaje(telefono, 'no-es-un-correo');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);

    await enviarMensaje(telefono, 'carlos@example.com');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_QUEJA);

    await enviarMensaje(telefono, 'El pedido llegó incompleto');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);

    expect(servicioClienteRepo.creados).toHaveLength(1);
    expect(servicioClienteRepo.creados[0]).toMatchObject({
      descripcion: 'El pedido llegó incompleto',
      tipo: 'PQR',
    });
    expect(pedidoRepo.creados).toHaveLength(0);
    expect(clienteRepo.datos.get(telefono)?.identificacion).toBe('123456789');
    expect(clienteRepo.datos.get(telefono)?.correo).toBe('carlos@example.com');
    expect(proveedor.textos.some((t) => t.mensaje.includes('Resumen de tu solicitud'))).toBe(true);
  });

  it('rama Servicio al cliente → Sugerencia/Felicitación: no pide identificación ni correo, y vuelve al menú (no a handoff)', async () => {
    const telefono = '+573005557788';

    await registrarClienteNuevo(telefono, 'Marta');
    await enviarMensaje(telefono, 'Servicio al cliente');
    await enviarMensaje(telefono, 'PQRSF');
    await enviarMensaje(telefono, 'Sugerencia/Felicit');
    // Va directo a pedir el comentario — nunca pasa por identificación ni correo.
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_QUEJA);

    await enviarMensaje(telefono, 'Sería bueno tener más variedad de quesos');
    // No hay apromesa de asesor ni handoff — vuelve al menú principal.
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_PRINCIPAL);

    expect(servicioClienteRepo.creados).toHaveLength(1);
    expect(servicioClienteRepo.creados[0]).toMatchObject({
      descripcion: 'Sería bueno tener más variedad de quesos',
      tipo: 'Sugerencia',
    });
    expect(clienteRepo.datos.get(telefono)?.identificacion).toBeNull();
    expect(clienteRepo.datos.get(telefono)?.correo).toBeNull();
    expect(proveedor.textos.some((t) => t.mensaje.includes('asesor'))).toBe(false);
  });

  it('rama Servicio al cliente → Facturación: pide la tirilla y cierra sin pasar a un asesor', async () => {
    const telefono = '+573005556677';

    await registrarClienteNuevo(telefono, 'Diana');
    await enviarMensaje(telefono, 'Servicio al cliente');
    await enviarMensaje(telefono, 'Facturación');
    // Aunque "Diana" ya tiene nombre guardado, Facturación reconfirma el nombre completo.
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);

    await enviarMensaje(telefono, 'Diana Restrepo');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(
      EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
    );

    await enviarMensaje(telefono, '900123456-7');
    await enviarMensaje(telefono, 'diana@example.com');
    // Ya no va a HANDOFF_HUMANO — primero pide una foto de la tirilla/recibo.
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_PQRSF_TIRILLA);
    expect(servicioClienteRepo.creados).toHaveLength(0);

    // Si el cliente escribe texto en vez de mandar la foto, se queda esperando.
    await enviarMensaje(telefono, 'ya te la mando');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.ESPERANDO_PQRSF_TIRILLA);

    await enviarImagen(telefono);
    // Con la foto recibida, cierra directo (sin asesor) y sin reabrir el menú — queda en INICIO.
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.INICIO);

    expect(servicioClienteRepo.creados).toHaveLength(1);
    expect(servicioClienteRepo.creados[0]).toMatchObject({
      tipo: 'Facturacion',
      descripcion: 'Solicitud de facturación',
    });
    expect(proveedor.textos.some((t) => t.mensaje.includes('24 horas'))).toBe(true);
    expect(proveedor.textos.some((t) => t.mensaje.includes('asesor'))).toBe(false);

    // Si el cliente escribe de nuevo, arranca de cero con el saludo inicial (no sigue esperando
    // una opción de menú que nunca se mostró) — el saludo personalizado sale como botones, no como
    // texto libre (ver desdeInicio.ts).
    await enviarMensaje(telefono, 'Hola de nuevo');
    expect(proveedor.botones.at(-1)?.texto).toContain('Hola de nuevo, Diana Restrepo');
  });

  it('handoff: cada mensaje del cliente recibe el aviso de "mucha demanda" (no sabemos si el asesor ya respondió)', async () => {
    const telefono = '+573004443322';

    await registrarClienteNuevo(telefono, 'Pedro');
    await enviarMensaje(telefono, 'Servicio al cliente');
    await enviarMensaje(telefono, 'PQRSF');
    await enviarMensaje(telefono, 'PQR');
    await enviarMensaje(telefono, '111222333');
    await enviarMensaje(telefono, 'pedro@example.com');
    await enviarMensaje(telefono, 'Todo bien, solo una sugerencia');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);

    const textosAntes = proveedor.textos.length;
    await enviarMensaje(telefono, '¿Alguna novedad?');

    expect(proveedor.textos.length).toBe(textosAntes + 1);
    expect(proveedor.textos.at(-1)?.mensaje).toContain('demanda');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);

    // Se repite en cada mensaje sucesivo mientras el cliente siga en handoff.
    await enviarMensaje(telefono, '¿Hola?');
    expect(proveedor.textos.at(-1)?.mensaje).toContain('demanda');
  });

  it('handoff: pasada la ventana de inactividad, el siguiente mensaje del cliente NO reinicia el flujo (exento, ver tareaCierreHandoff)', async () => {
    const telefono = '+573004445566';

    await registrarClienteNuevo(telefono, 'Lucía');
    await enviarMensaje(telefono, 'Servicio al cliente');
    await enviarMensaje(telefono, 'PQRSF');
    await enviarMensaje(telefono, 'PQR');
    await enviarMensaje(telefono, '444555666');
    await enviarMensaje(telefono, 'lucia@example.com');
    await enviarMensaje(telefono, 'El domicilio llegó tarde');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);

    // Retrocede artificialmente la última actividad más allá de la ventana de inactividad (24h en
    // este test, ver beforeEach) — a diferencia de cualquier otro estado, HANDOFF_HUMANO queda
    // exento del reinicio reactivo (ver motorEstados.ts): el único camino de salida es el cierre
    // explícito de tareaCierreHandoff.ts.
    const conversacion = conversacionRepo.datos.get(telefono);
    if (conversacion) conversacion.actualizadaEn = new Date(Date.now() - 25 * 60 * 60 * 1000);

    await enviarMensaje(telefono, 'hola?');

    expect(proveedor.textos.at(-1)?.mensaje).toContain('demanda');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
  });

  it('eco del asesor (whatsapp.smb.message.echoes) en handoff: renueva la actividad sin generar respuesta del bot', async () => {
    const telefono = '+573004446677';

    await registrarClienteNuevo(telefono, 'Mario');
    await enviarMensaje(telefono, 'Servicio al cliente');
    await enviarMensaje(telefono, 'PQRSF');
    await enviarMensaje(telefono, 'PQR');
    await enviarMensaje(telefono, '777888999');
    await enviarMensaje(telefono, 'mario@example.com');
    await enviarMensaje(telefono, 'Falta un producto del pedido');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);

    const conversacion = conversacionRepo.datos.get(telefono);
    if (conversacion) conversacion.actualizadaEn = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const actualizadaAntes = conversacion?.actualizadaEn.getTime();

    const textosAntes = proveedor.textos.length;
    await enviarEcoAsesor(telefono);

    // No genera ninguna respuesta del bot (el asesor ya está hablando directamente con el
    // cliente) — solo renueva el reloj de inactividad.
    expect(proveedor.textos.length).toBe(textosAntes);
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(conversacionRepo.datos.get(telefono)?.actualizadaEn.getTime()).toBeGreaterThan(actualizadaAntes ?? 0);
    expect(conversacionRepo.datos.get(telefono)?.contexto['asesorRespondio']).toBe(true);
  });

  it('tras el eco del asesor, el bot deja de mandar el aviso de "mucha demanda" al cliente', async () => {
    const telefono = '+573004449900';

    await registrarClienteNuevo(telefono, 'Diego');
    await enviarMensaje(telefono, 'Servicio al cliente');
    await enviarMensaje(telefono, 'PQRSF');
    await enviarMensaje(telefono, 'PQR');
    await enviarMensaje(telefono, '999888777');
    await enviarMensaje(telefono, 'diego@example.com');
    await enviarMensaje(telefono, 'El domicilio nunca llegó');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);

    // Antes de que el asesor responda, el cliente sigue recibiendo el aviso de siempre.
    await enviarMensaje(telefono, '¿Alguna novedad?');
    expect(proveedor.textos.at(-1)?.mensaje).toContain('demanda');

    await enviarEcoAsesor(telefono);

    // Después de que el asesor respondió, el bot queda en silencio ante nuevos mensajes del
    // cliente — ya no tiene sentido seguir avisando "en breve te atendemos".
    const textosAntes = proveedor.textos.length;
    await enviarMensaje(telefono, '¿Ya casi?');
    expect(proveedor.textos.length).toBe(textosAntes);
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.HANDOFF_HUMANO);
  });

  it('eco del asesor a un teléfono desconocido (no es cliente del bot): se ignora sin error', async () => {
    const respuesta = await fetch(`${baseUrl}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadEcoAsesor('+573000009999', '+573000000000')),
    });
    expect(respuesta.status).toBe(200);
  });

  it('eco del asesor a un cliente que NO está en handoff: se ignora, no toca la conversación', async () => {
    const telefono = '+573004447788';
    await registrarClienteNuevo(telefono, 'Sofía');
    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_PRINCIPAL);
    const actualizadaAntes = conversacionRepo.datos.get(telefono)?.actualizadaEn.getTime();

    await enviarEcoAsesor(telefono);

    expect(conversacionRepo.datos.get(telefono)?.estadoActual).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(conversacionRepo.datos.get(telefono)?.actualizadaEn.getTime()).toBe(actualizadaAntes);
  });
});
