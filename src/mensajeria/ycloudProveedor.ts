import type { IProveedorMensajeria } from './tipos';
import type { OpcionLista } from '../motor/motorEstados';
import type { IdentificadorCliente } from '../dominio/identificadorCliente';

const YCLOUD_API_URL = 'https://api.ycloud.com/v2/whatsapp/messages';

// Implementación de IProveedorMensajeria contra la API REST de YCloud (BSP de WhatsApp Business).
export class YCloudProveedor implements IProveedorMensajeria {
  constructor(
    private readonly apiKey: string,
    private readonly numeroNegocio: string,
  ) {}

  async enviarTexto(destinatario: IdentificadorCliente, mensaje: string): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      ...this.direccion(destinatario),
      type: 'text',
      text: { body: mensaje },
    });
  }

  async enviarDocumento(destinatario: IdentificadorCliente, urlOBase64: string, nombre: string): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      ...this.direccion(destinatario),
      type: 'document',
      document: { link: urlOBase64, filename: nombre },
    });
  }

  // Imagen inline (no un documento descargable) — a diferencia de enviarDocumento, no lleva
  // nombre de archivo. Hoy solo la usa MENU_VENTAS para la imagen fija de "cómo comprar" (ver
  // desdeMenuVentas.ts).
  async enviarImagen(destinatario: IdentificadorCliente, urlOBase64: string): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      ...this.direccion(destinatario),
      type: 'image',
      image: { link: urlOBase64 },
    });
  }

  // Interactive List Message — forma de payload estilo WhatsApp Cloud API. `sections[].title` es
  // obligatorio para WhatsApp (máx. 24 caracteres) aunque solo haya una sección — su ausencia
  // causaba un 502 al enviar (ver docs/INTEGRACION_YCLOUD.md, confirmado 2026-07-18).
  async enviarLista(destinatario: IdentificadorCliente, texto: string, opciones: OpcionLista[]): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      ...this.direccion(destinatario),
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: texto },
        action: {
          button: 'Elegir',
          sections: [
            {
              title: 'Opciones',
              rows: opciones.map((opcion) => ({ id: opcion.id, title: opcion.titulo })),
            },
          ],
        },
      },
    });
  }

  // Reply Buttons — máximo 3 botones, título de cada uno máx. 20 caracteres (WhatsApp). Se usa en
  // vez de List Message cuando hay 3 opciones o menos: un solo toque, sin abrir un menú (ver
  // docs/FLUJO_ESTADOS.md). `opciones` con más de 3 elementos rompería el mensaje — las
  // transiciones del motor ya se encargan de no llamar esto con más de 3 (ver docs/CONTRATOS.md).
  async enviarBotones(destinatario: IdentificadorCliente, texto: string, opciones: OpcionLista[]): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      ...this.direccion(destinatario),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: texto },
        action: {
          buttons: opciones.map((opcion) => ({
            type: 'reply',
            reply: { id: opcion.id, title: opcion.titulo },
          })),
        },
      },
    });
  }

  // YCloud direcciona el destinatario con campos distintos y mutuamente excluyentes según el tipo
  // de identificador: `to` para teléfono en E.164, `recipient` para BSUID (cliente que escribió
  // con username, sin compartir su número) — confirmado contra la documentación oficial de YCloud
  // 2026-08-19 (ver docs/INTEGRACION_YCLOUD.md).
  private direccion(destinatario: IdentificadorCliente): Record<string, string> {
    return destinatario.tipo === 'telefono' ? { to: destinatario.valor } : { recipient: destinatario.valor };
  }

  // Forma de payload estilo WhatsApp Cloud API/BSP — mapeo exacto pendiente de confirmar contra
  // la documentación oficial de YCloud antes de producción (ver docs/INTEGRACION_YCLOUD.md).
  private async enviar(payload: Record<string, unknown>): Promise<void> {
    const respuesta = await fetch(YCLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!respuesta.ok) {
      const cuerpo = await respuesta.text().catch(() => '');
      throw new Error(`YCloud respondió ${respuesta.status}: ${cuerpo}`);
    }
  }
}
