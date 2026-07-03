// Contrato del proveedor de mensajería (WhatsApp vía YCloud u otro BSP).
// Firma exacta según docs/CONTRATOS.md — no modificar sin actualizar el contrato compartido.
export interface IProveedorMensajeria {
  enviarTexto(telefono: string, mensaje: string): Promise<void>;
  enviarDocumento(telefono: string, urlOBase64: string, nombre: string): Promise<void>;
}
