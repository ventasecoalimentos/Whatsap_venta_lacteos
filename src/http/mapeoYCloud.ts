import type { MensajeEntranteDto } from '../application/procesarMensajeEntrante';

// Forma provisional del payload entrante de YCloud, siguiendo el patrón habitual de BSPs de
// WhatsApp (estilo Cloud API). PENDIENTE confirmar contra la doc oficial de YCloud o un payload
// de ejemplo real antes de producción (ver docs/INTEGRACION_YCLOUD.md).
interface PayloadYCloud {
  whatsappInboundMessage?: {
    from?: string;
    type?: string;
    text?: { body?: string };
  };
}

const TIPOS_SOPORTADOS: Record<string, MensajeEntranteDto['tipoMensaje']> = {
  text: 'texto',
  audio: 'audio',
  image: 'imagen',
  sticker: 'sticker',
  video: 'video',
};

// Devuelve null cuando el payload no trae un mensaje entrante reconocible (ej. eventos de estado
// de entrega/lectura, que YCloud también podría enviar al mismo webhook) — el controlador lo
// ignora en ese caso sin tratarlo como error.
export function mapearPayloadYCloud(body: unknown): MensajeEntranteDto | null {
  const payload = body as PayloadYCloud | null | undefined;
  const mensaje = payload?.whatsappInboundMessage;
  if (!mensaje?.from) {
    return null;
  }

  const tipoMensaje = TIPOS_SOPORTADOS[mensaje.type ?? ''] ?? 'otro';

  return {
    telefono: mensaje.from,
    tipoMensaje,
    texto: tipoMensaje === 'texto' ? (mensaje.text?.body ?? null) : null,
  };
}
