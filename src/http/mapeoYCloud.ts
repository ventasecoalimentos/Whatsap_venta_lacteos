import type { MensajeEntranteDto } from '../application/procesarMensajeEntrante';

// Forma provisional del payload entrante de YCloud, siguiendo el patrón habitual de BSPs de
// WhatsApp (estilo Cloud API). PENDIENTE confirmar contra la doc oficial de YCloud o un payload
// de ejemplo real antes de producción (ver docs/INTEGRACION_YCLOUD.md).
interface PayloadYCloud {
  whatsappInboundMessage?: {
    from?: string;
    type?: string;
    text?: { body?: string };
    interactive?: {
      type?: string;
      list_reply?: { id?: string; title?: string };
      button_reply?: { id?: string; title?: string };
    };
    customerProfile?: { name?: string };
  };
}

const TIPOS_SOPORTADOS: Record<string, MensajeEntranteDto['tipoMensaje']> = {
  text: 'texto',
  audio: 'audio',
  image: 'imagen',
  sticker: 'sticker',
  video: 'video',
};

// Payload de whatsapp.smb.message.echoes — mensaje que el equipo envía desde la app nativa de
// WhatsApp en modo coexistencia (no desde el bot). Confirmado contra un payload real 2026-08-13:
// { "type": "whatsapp.smb.message.echoes", "whatsappMessage": { "from": NUMERO_NEGOCIO,
// "to": NUMERO_CLIENTE, ... } }. Ver registrarRespuestaAsesor.ts.
interface PayloadEcoAsesor {
  type?: string;
  whatsappMessage?: { to?: string };
}

// Devuelve el teléfono del cliente al que el asesor le respondió, o null si el evento no es un
// eco de mensaje del asesor (ej. mensaje entrante del cliente, status de entrega, etc.).
export function mapearEventoEcoAsesor(body: unknown): string | null {
  const payload = body as PayloadEcoAsesor | null | undefined;
  if (payload?.type !== 'whatsapp.smb.message.echoes') {
    return null;
  }
  return payload.whatsappMessage?.to ?? null;
}

// Devuelve null cuando el payload no trae un mensaje entrante reconocible (ej. eventos de estado
// de entrega/lectura, que YCloud también podría enviar al mismo webhook) — el controlador lo
// ignora en ese caso sin tratarlo como error.
export function mapearPayloadYCloud(body: unknown): MensajeEntranteDto | null {
  const payload = body as PayloadYCloud | null | undefined;
  const mensaje = payload?.whatsappInboundMessage;
  if (!mensaje?.from) {
    return null;
  }

  // Nombre de perfil de WhatsApp del remitente — disponible tanto en mensajes de texto como en
  // respuestas a menús (ver docs/INTEGRACION_YCLOUD.md, pendiente confirmar en el segundo caso).
  const nombrePerfil = mensaje.customerProfile?.name ?? null;

  // Respuesta a un List Message o a un Reply Button (ver RespuestaBot 'lista'/'botones' en
  // motorEstados.ts): se trata como texto normal — el `id` de la opción seleccionada ya es un
  // valor limpio, así que fluye por el mismo camino que un mensaje de texto libre sin que el
  // motor tenga que saber que vino de un menú. `esSeleccionInteractiva: true` sí viaja aparte —
  // los botones de WhatsApp no caducan visualmente en el chat, así que el cliente puede tocar uno
  // de un menú anterior mientras el bot espera texto libre (nombre, identificación, etc.); sin esta
  // marca ese `id` se guardaría tal cual como si el cliente lo hubiera escrito (ver
  // desdeEsperandoNombre.ts y las demás transiciones de captura de datos).
  if (mensaje.type === 'interactive') {
    const id = mensaje.interactive?.list_reply?.id ?? mensaje.interactive?.button_reply?.id;
    if (id) {
      return {
        telefono: mensaje.from,
        tipoMensaje: 'texto',
        texto: id,
        nombrePerfil,
        esSeleccionInteractiva: true,
      };
    }
  }

  const tipoMensaje = TIPOS_SOPORTADOS[mensaje.type ?? ''] ?? 'otro';

  return {
    telefono: mensaje.from,
    tipoMensaje,
    texto: tipoMensaje === 'texto' ? (mensaje.text?.body ?? null) : null,
    nombrePerfil,
    esSeleccionInteractiva: false,
  };
}
