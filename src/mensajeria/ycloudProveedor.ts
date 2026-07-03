import type { IProveedorMensajeria } from './tipos';

const YCLOUD_API_URL = 'https://api.ycloud.com/v2/whatsapp/messages';

// Implementación de IProveedorMensajeria contra la API REST de YCloud (BSP de WhatsApp Business).
export class YCloudProveedor implements IProveedorMensajeria {
  constructor(
    private readonly apiKey: string,
    private readonly numeroNegocio: string,
  ) {}

  async enviarTexto(telefono: string, mensaje: string): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      to: telefono,
      type: 'text',
      text: { body: mensaje },
    });
  }

  async enviarDocumento(telefono: string, urlOBase64: string, nombre: string): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      to: telefono,
      type: 'document',
      document: { link: urlOBase64, filename: nombre },
    });
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
