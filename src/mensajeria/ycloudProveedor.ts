import type { IProveedorMensajeria } from './tipos';
import type { OpcionLista } from '../motor/motorEstados';

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

  // Interactive List Message — forma de payload estilo WhatsApp Cloud API. `sections[].title` es
  // obligatorio para WhatsApp (máx. 24 caracteres) aunque solo haya una sección — su ausencia
  // causaba un 502 al enviar (ver docs/INTEGRACION_YCLOUD.md, confirmado 2026-07-18).
  async enviarLista(telefono: string, texto: string, opciones: OpcionLista[]): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      to: telefono,
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
  async enviarBotones(telefono: string, texto: string, opciones: OpcionLista[]): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      to: telefono,
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

  // Location message — pin en el mapa (ver desdeServicioCliente.ts, opción "Conocer sedes").
  async enviarUbicacion(
    telefono: string,
    latitud: number,
    longitud: number,
    nombre: string,
    direccion: string,
  ): Promise<void> {
    await this.enviar({
      from: this.numeroNegocio,
      to: telefono,
      type: 'location',
      location: { latitude: latitud, longitude: longitud, name: nombre, address: direccion },
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
