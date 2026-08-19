import type { OpcionLista } from '../motor/motorEstados';
import type { IdentificadorCliente } from '../dominio/identificadorCliente';

// Contrato del proveedor de mensajería (WhatsApp vía YCloud u otro BSP).
// Firma exacta según docs/CONTRATOS.md — no modificar sin actualizar el contrato compartido.
// `destinatario` es telefono o bsuid (ver dominio/identificadorCliente.ts) — YCloud usa un campo
// distinto en su API de envío según cuál sea (`to` vs `recipient`, ver ycloudProveedor.ts).
export interface IProveedorMensajeria {
  enviarTexto(destinatario: IdentificadorCliente, mensaje: string): Promise<void>;
  enviarDocumento(destinatario: IdentificadorCliente, urlOBase64: string, nombre: string): Promise<void>;
  enviarImagen(destinatario: IdentificadorCliente, urlOBase64: string): Promise<void>;
  enviarLista(destinatario: IdentificadorCliente, texto: string, opciones: OpcionLista[]): Promise<void>;
  enviarBotones(destinatario: IdentificadorCliente, texto: string, opciones: OpcionLista[]): Promise<void>;
}
