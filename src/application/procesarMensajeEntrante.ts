import { EstadoConversacion } from '../dominio/estadoConversacion';
import { parsearCiudad } from '../dominio/ciudad';
import type {
  Cliente,
  IClienteRepository,
  IConversacionRepository,
  IPedidoRepository,
  IQuejaRepository,
} from '../datos/tipos';
import type { IProveedorMensajeria } from '../mensajeria/tipos';
import { procesarTransicion } from '../motor/motorEstados';
import type { RespuestaBot } from '../motor/motorEstados';

// DTO de entrada del caso de uso — firma exacta según docs/CONTRATOS.md.
export interface MensajeEntranteDto {
  telefono: string; // E.164
  tipoMensaje: 'texto' | 'audio' | 'imagen' | 'sticker' | 'video' | 'otro';
  texto: string | null; // null si tipoMensaje !== 'texto'
  nombrePerfil: string | null; // customerProfile.name de WhatsApp, si vino en el mensaje
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// El motor es puro y no tiene acceso a variables de entorno, así que las transiciones de
// MENU_VENTAS/CATALOGO_DETAL/CATALOGO_DISTRIB identifican el catálogo por nombre semántico
// (`RespuestaBot.catalogo`, ver src/motor/transiciones/desdeMenuVentas.ts). Este caso de uso es
// quien sí conoce el entorno real, así que resuelve ese nombre a la URL/base64 real antes de
// enviar el documento.
export interface CatalogosUrls {
  CATALOGO_DETAL_URL: string;
  CATALOGO_DISTRIBUCION_URL: string;
}

// Orquesta el flujo completo de un mensaje entrante: BD (repos) + motor puro + envío de
// respuestas. El motor de estados (src/motor/motorEstados.ts) no toca BD ni YCloud — este caso
// de uso es el único punto donde se hacen esos efectos.
export class ProcesarMensajeEntrante {
  constructor(
    private readonly clienteRepositorio: IClienteRepository,
    private readonly conversacionRepositorio: IConversacionRepository,
    private readonly pedidoRepositorio: IPedidoRepository,
    private readonly quejaRepositorio: IQuejaRepository,
    private readonly proveedorMensajeria: IProveedorMensajeria,
    private readonly catalogos: CatalogosUrls,
    // Horas sin actividad antes de reiniciar el flujo (ver docs/FLUJO_ESTADOS.md) — configurable
    // vía env (VENTANA_INACTIVIDAD_HORAS) para poder acortarlo en pruebas locales sin tocar
    // código; en producción se deja en 24 (la ventana real de mensajería libre de WhatsApp).
    private readonly ventanaInactividadHoras: number,
    // WhatsApp acepta el mensaje de documento casi al instante mientras internamente sigue
    // descargando y procesando el archivo desde `link` — si el siguiente mensaje (ej. el menú
    // "¿Qué quieres hacer?") se manda inmediatamente después, a veces llega al celular ANTES que
    // el documento, aunque lo hayamos enviado en el orden correcto. Esta pausa le da tiempo a
    // WhatsApp de entregar el documento primero (confirmado con prueba real 2026-07-18).
    // Configurable vía env (DELAY_TRAS_DOCUMENTO_MS) — en tests se pone en 0 para no esperar de
    // verdad ni desordenar las llamadas concurrentes del propio test.
    private readonly delayTrasDocumentoMs: number,
  ) {}

  async ejecutar(dto: MensajeEntranteDto): Promise<void> {
    const cliente = await this.buscarOCrearCliente(dto.telefono);
    const conversacion = await this.conversacionRepositorio.obtenerOCrear(cliente.id);
    const estadoAntes = conversacion.estadoActual;

    const ventanaInactividadMs = this.ventanaInactividadHoras * 60 * 60 * 1000;
    const huboInactividad =
      Date.now() - conversacion.actualizadaEn.getTime() > ventanaInactividadMs;

    const resultado = procesarTransicion({
      estadoActual: estadoAntes,
      mensajeTexto: dto.tipoMensaje === 'texto' ? dto.texto : null,
      contexto: conversacion.contexto,
      clienteYaTieneNombre: cliente.nombre !== null,
      nombreCliente: cliente.nombre,
      nombrePerfilWhatsApp: dto.nombrePerfil,
      huboInactividad,
      aceptoTratamientoDatos: cliente.aceptoTratamientoDatos,
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
      } else if (estadoAntes === EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL) {
        // El motor ya resolvió el nombre confirmado (perfil de WhatsApp o "Cliente" de respaldo)
        // en `contextoParcheado.nombre` — ver desdeConfirmarNombre.ts. Si en vez de confirmar el
        // cliente eligió "Escribir otro", el nuevo estado es ESPERANDO_NOMBRE y no hay `nombre`
        // en el contexto todavía, así que no se persiste nada aquí.
        const nombreConfirmado = resultado.contextoParcheado['nombre'] as string | undefined;
        if (nombreConfirmado) {
          await this.clienteRepositorio.actualizarNombre(cliente.id, nombreConfirmado);
        }
      } else if (estadoAntes === EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS) {
        // El motor deja la decisión en `contextoParcheado.aceptoTratamientoDatos` (ver
        // desdeConsentimientoDatos.ts) — ausente si el mensaje no fue una opción reconocida.
        const aceptoTratamientoDatos = resultado.contextoParcheado['aceptoTratamientoDatos'] as
          | boolean
          | undefined;
        if (aceptoTratamientoDatos !== undefined) {
          await this.clienteRepositorio.actualizarConsentimiento(cliente.id, aceptoTratamientoDatos);
          // Si declina, no se le pregunta el nombre (ver desdeMenuPrincipal.ts) — se guarda el de
          // perfil de WhatsApp si vino en el mensaje, para no dejarlo sin nombre innecesariamente.
          if (!aceptoTratamientoDatos && dto.nombrePerfil) {
            await this.clienteRepositorio.actualizarNombre(cliente.id, dto.nombrePerfil);
          }
        }
      } else if (estadoAntes === EstadoConversacion.ESPERANDO_PQRSF_NOMBRE) {
        // Mismo campo `clientes.nombre` que usa el resto del bot — solo se llega aquí si el
        // cliente aún no tenía nombre guardado (ver desdeEsperandoTipoPqrsf.ts).
        await this.clienteRepositorio.actualizarNombre(cliente.id, dto.texto);
      } else if (estadoAntes === EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION) {
        await this.clienteRepositorio.actualizarIdentificacion(cliente.id, dto.texto);
      } else if (estadoAntes === EstadoConversacion.ESPERANDO_PQRSF_CORREO) {
        await this.clienteRepositorio.actualizarCorreo(cliente.id, dto.texto);
      }
    }

    for (const [indice, respuesta] of resultado.respuestas.entries()) {
      await this.enviarRespuesta(dto.telefono, respuesta);
      const quedanMasRespuestas = indice < resultado.respuestas.length - 1;
      if (respuesta.tipo === 'documento' && quedanMasRespuestas && this.delayTrasDocumentoMs > 0) {
        await esperar(this.delayTrasDocumentoMs);
      }
    }

    if (resultado.registro?.tipo === 'pedido') {
      await this.pedidoRepositorio.crear({
        clienteId: cliente.id,
        productoInteres: resultado.registro.productoInteres,
        ciudad: resultado.registro.ciudad,
        canal: resultado.registro.canal,
      });
    } else if (resultado.registro?.tipo === 'queja') {
      await this.quejaRepositorio.crear({
        clienteId: cliente.id,
        descripcion: resultado.registro.descripcion,
        tipo: resultado.registro.tipoPqrsf,
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
    } else if (respuesta.tipo === 'documento') {
      const urlOBase64 = this.resolverUrlCatalogo(respuesta.catalogo);
      await this.proveedorMensajeria.enviarDocumento(telefono, urlOBase64, respuesta.nombre);
    } else if (respuesta.tipo === 'lista') {
      await this.proveedorMensajeria.enviarLista(telefono, respuesta.texto, respuesta.opciones);
    } else if (respuesta.tipo === 'ubicacion') {
      await this.proveedorMensajeria.enviarUbicacion(
        telefono,
        respuesta.latitud,
        respuesta.longitud,
        respuesta.nombre,
        respuesta.direccion,
      );
    } else {
      await this.proveedorMensajeria.enviarBotones(telefono, respuesta.texto, respuesta.opciones);
    }
  }

  // El motor identifica el catálogo por nombre semántico ('detal' | 'distribucion') porque es
  // puro y no conoce variables de entorno — este es el único punto que traduce ese nombre a la
  // URL/base64 real antes de llamar a IProveedorMensajeria.
  private resolverUrlCatalogo(catalogo: 'detal' | 'distribucion'): string {
    return catalogo === 'detal'
      ? this.catalogos.CATALOGO_DETAL_URL
      : this.catalogos.CATALOGO_DISTRIBUCION_URL;
  }

}
