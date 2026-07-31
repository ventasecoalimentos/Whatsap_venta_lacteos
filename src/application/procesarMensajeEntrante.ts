import { EstadoConversacion } from '../dominio/estadoConversacion';
import type {
  Cliente,
  IClienteRepository,
  IConversacionRepository,
  IPedidoRepository,
  IServicioClienteRepository,
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

// Orquesta el flujo completo de un mensaje entrante: BD (repos) + motor puro + envío de
// respuestas. El motor de estados (src/motor/motorEstados.ts) no toca BD ni YCloud — este caso
// de uso es el único punto donde se hacen esos efectos.
export class ProcesarMensajeEntrante {
  constructor(
    private readonly clienteRepositorio: IClienteRepository,
    private readonly conversacionRepositorio: IConversacionRepository,
    private readonly pedidoRepositorio: IPedidoRepository,
    private readonly servicioClienteRepositorio: IServicioClienteRepository,
    private readonly proveedorMensajeria: IProveedorMensajeria,
    // Un solo catálogo para las 3 categorías de Ventas (ver desdeMenuVentas.ts) — el motor es
    // puro y no conoce env, así que este caso de uso resuelve la URL real antes de enviar.
    private readonly catalogoUrl: string,
    // Horas sin actividad antes de reiniciar el flujo (ver docs/FLUJO_ESTADOS.md) — configurable
    // vía env (VENTANA_INACTIVIDAD_HORAS). También es la ventana durante la cual, en
    // HANDOFF_HUMANO, cada mensaje del cliente recibe el aviso de "mucha demanda" (ver
    // desdeHandoff.ts) — pasado ese tiempo, el siguiente mensaje ya reinicia el flujo.
    private readonly ventanaInactividadHoras: number,
    // WhatsApp acepta el mensaje de documento casi al instante mientras internamente sigue
    // descargando y procesando el archivo desde `link` — si el siguiente mensaje (ej. el menú
    // "¿Seguimos con tu pedido?") se manda inmediatamente después, a veces llega al celular ANTES
    // que el documento, aunque lo hayamos enviado en el orden correcto. Esta pausa le da tiempo a
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
      huboInactividad,
      aceptoTratamientoDatos: cliente.aceptoTratamientoDatos,
    });

    await this.conversacionRepositorio.actualizarEstado(
      conversacion.id,
      resultado.nuevoEstado,
      resultado.contextoParcheado,
    );

    // El motor es puro y no toca `clientes` — la captura de nombre (columna "Efecto en
    // contexto/BD" de docs/FLUJO_ESTADOS.md) se resuelve aquí, a partir del estado de origen y el
    // texto crudo entrante (no del contexto interno del motor, que es opaco para este caso de uso).
    // Se omite si el mensaje fue reinterpretado como reinicio por inactividad (no es una respuesta
    // real a "¿cuál es tu nombre?").
    const esReinicioPorInactividad = huboInactividad && estadoAntes !== EstadoConversacion.INICIO;
    if (!esReinicioPorInactividad && dto.tipoMensaje === 'texto' && dto.texto) {
      if (estadoAntes === EstadoConversacion.ESPERANDO_NOMBRE) {
        await this.clienteRepositorio.actualizarNombre(cliente.id, dto.texto);
      } else if (estadoAntes === EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS) {
        // El motor deja la decisión en `contextoParcheado.aceptoTratamientoDatos` (ver
        // desdeConsentimientoDatos.ts) — ausente si el mensaje no fue una opción reconocida.
        const aceptoTratamientoDatos = resultado.contextoParcheado['aceptoTratamientoDatos'] as
          | boolean
          | undefined;
        if (aceptoTratamientoDatos !== undefined) {
          await this.clienteRepositorio.actualizarConsentimiento(cliente.id, aceptoTratamientoDatos);
        }
      } else if (estadoAntes === EstadoConversacion.ESPERANDO_PQRSF_NOMBRE) {
        // Mismo campo `clientes.nombre` que usa el resto del bot — solo se llega aquí si el
        // cliente aún no tenía nombre guardado (ver iniciarCapturaPqrsf.ts).
        await this.clienteRepositorio.actualizarNombre(cliente.id, dto.texto);
      } else if (
        estadoAntes === EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION &&
        resultado.nuevoEstado !== EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION
      ) {
        // El motor valida y normaliza (solo dígitos, ver desdeEsperandoPqrsfIdentificacion.ts) —
        // se persiste el valor ya normalizado del contexto, no el texto crudo. Si el motor rechazó
        // el valor se queda en el mismo estado y no se llega aquí, evitando guardar basura.
        const identificacion = resultado.contextoParcheado['pqrsfIdentificacion'] as string;
        await this.clienteRepositorio.actualizarIdentificacion(cliente.id, identificacion);
      } else if (
        estadoAntes === EstadoConversacion.ESPERANDO_PQRSF_CORREO &&
        resultado.nuevoEstado !== EstadoConversacion.ESPERANDO_PQRSF_CORREO
      ) {
        // Mismo criterio: si el correo no pasó la validación de formato, el motor no avanza de
        // estado y no se persiste.
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
        canal: resultado.registro.canal,
      });
    } else if (resultado.registro?.tipo === 'queja') {
      await this.servicioClienteRepositorio.crear({
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
      await this.proveedorMensajeria.enviarDocumento(telefono, this.catalogoUrl, respuesta.nombre);
    } else if (respuesta.tipo === 'lista') {
      await this.proveedorMensajeria.enviarLista(telefono, respuesta.texto, respuesta.opciones);
    } else {
      await this.proveedorMensajeria.enviarBotones(telefono, respuesta.texto, respuesta.opciones);
    }
  }
}
