import { EstadoConversacion } from '../dominio/estadoConversacion';
import { parsearCiudad } from '../dominio/ciudad';
import type {
  Cliente,
  IClienteRepository,
  IConversacionRepository,
  IPedidoRepository,
  IMensajeRepository,
} from '../datos/tipos';
import type { IProveedorMensajeria } from '../mensajeria/tipos';
import { procesarTransicion } from '../motor/motorEstados';
import type { RespuestaBot } from '../motor/motorEstados';

// DTO de entrada del caso de uso — firma exacta según docs/CONTRATOS.md.
export interface MensajeEntranteDto {
  telefono: string; // E.164
  tipoMensaje: 'texto' | 'audio' | 'imagen' | 'sticker' | 'video' | 'otro';
  texto: string | null; // null si tipoMensaje !== 'texto'
}

const VENTANA_INACTIVIDAD_MS = 24 * 60 * 60 * 1000;

// El motor es puro y no tiene acceso a variables de entorno, así que las transiciones de
// ESPERANDO_CIUDAD devuelven estos nombres de variable como placeholder en `urlOBase64`
// (ver src/motor/transiciones/desdeEsperandoCiudad.ts). Este caso de uso es quien sí conoce el
// entorno real, así que resuelve el token a la URL/base64 real antes de enviar el documento.
export interface CatalogosUrls {
  CATALOGO_COMPLETO_URL: string;
  CATALOGO_REDUCIDO_URL: string;
}

// Orquesta el flujo completo de un mensaje entrante: BD (repos) + motor puro + envío de
// respuestas. El motor de estados (src/motor/motorEstados.ts) no toca BD ni YCloud — este caso
// de uso es el único punto donde se hacen esos efectos.
export class ProcesarMensajeEntrante {
  constructor(
    private readonly clienteRepositorio: IClienteRepository,
    private readonly conversacionRepositorio: IConversacionRepository,
    private readonly pedidoRepositorio: IPedidoRepository,
    private readonly mensajeRepositorio: IMensajeRepository,
    private readonly proveedorMensajeria: IProveedorMensajeria,
    private readonly catalogos: CatalogosUrls,
  ) {}

  async ejecutar(dto: MensajeEntranteDto): Promise<void> {
    const cliente = await this.buscarOCrearCliente(dto.telefono);
    const conversacion = await this.conversacionRepositorio.obtenerOCrear(cliente.id);
    const estadoAntes = conversacion.estadoActual;

    const huboInactividad =
      Date.now() - conversacion.actualizadaEn.getTime() > VENTANA_INACTIVIDAD_MS;

    await this.mensajeRepositorio.registrar({
      conversacionId: conversacion.id,
      direccion: 'in',
      contenido: dto.texto ?? `[${dto.tipoMensaje}]`,
    });

    const resultado = procesarTransicion({
      estadoActual: estadoAntes,
      mensajeTexto: dto.tipoMensaje === 'texto' ? dto.texto : null,
      contexto: conversacion.contexto,
      clienteYaTieneNombre: cliente.nombre !== null,
      nombreCliente: cliente.nombre,
      huboInactividad,
    });

    await this.conversacionRepositorio.actualizarEstado(
      conversacion.id,
      resultado.nuevoEstado,
      resultado.contextoParcheado,
    );

    // El motor es puro y no toca `clientes` — la captura de nombre/ciudad (columna "Efecto en
    // contexto/BD" de docs/FLUJO_ESTADOS.md) se resuelve aquí, a partir del estado de origen y el
    // texto crudo entrante (no del contexto interno del motor, que es opaco para este caso de uso).
    // Se omite si el mensaje fue reinterpretado como reinicio por inactividad (no es una respuesta
    // real a "¿cuál es tu nombre/ciudad?").
    const esReinicioPorInactividad = huboInactividad && estadoAntes !== EstadoConversacion.INICIO;
    if (!esReinicioPorInactividad && dto.tipoMensaje === 'texto' && dto.texto) {
      if (estadoAntes === EstadoConversacion.ESPERANDO_NOMBRE) {
        await this.clienteRepositorio.actualizarNombre(cliente.id, dto.texto);
      } else if (estadoAntes === EstadoConversacion.ESPERANDO_CIUDAD) {
        await this.clienteRepositorio.actualizarCiudad(cliente.id, parsearCiudad(dto.texto));
      }
    }

    for (const respuesta of resultado.respuestas) {
      await this.enviarRespuesta(dto.telefono, respuesta);
      await this.mensajeRepositorio.registrar({
        conversacionId: conversacion.id,
        direccion: 'out',
        contenido: this.contenidoDeRespuesta(respuesta),
      });
    }

    if (resultado.debeNotificarEquipo) {
      await this.pedidoRepositorio.crear({
        clienteId: cliente.id,
        productoInteres: dto.texto ?? '',
        ciudad: cliente.ciudad ?? '',
      });
    }

    await this.clienteRepositorio.actualizarUltimaInteraccion(cliente.id);
  }

  private async buscarOCrearCliente(telefono: string): Promise<Cliente> {
    const existente = await this.clienteRepositorio.buscarPorTelefono(telefono);
    if (existente) {
      return existente;
    }
    return this.clienteRepositorio.crear({ telefono, nombre: null, ciudad: null });
  }

  private async enviarRespuesta(telefono: string, respuesta: RespuestaBot): Promise<void> {
    if (respuesta.tipo === 'texto') {
      await this.proveedorMensajeria.enviarTexto(telefono, respuesta.contenido);
    } else {
      const urlOBase64 = this.resolverUrlCatalogo(respuesta.urlOBase64);
      await this.proveedorMensajeria.enviarDocumento(telefono, urlOBase64, respuesta.nombre);
    }
  }

  // El motor devuelve el nombre de la variable de entorno como placeholder (ver comentario en
  // CatalogosUrls); si no coincide con un token conocido, se usa tal cual (permite que el motor
  // en el futuro devuelva una URL/base64 real directamente sin cambios acá).
  private resolverUrlCatalogo(urlOBase64: string): string {
    if (urlOBase64 === 'CATALOGO_COMPLETO_URL' || urlOBase64 === 'CATALOGO_REDUCIDO_URL') {
      return this.catalogos[urlOBase64];
    }
    return urlOBase64;
  }

  private contenidoDeRespuesta(respuesta: RespuestaBot): string {
    return respuesta.tipo === 'texto' ? respuesta.contenido : `[documento] ${respuesta.nombre}`;
  }
}
