// Reflejan Cliente/Pedido/RegistroServicioCliente de src/datos/tipos.ts (backend) — duplicados a propósito: este
// frontend es un proyecto Vite separado, sin acceso directo al código del servidor.
export interface Cliente {
  id: string;
  telefono: string | null; // null si el cliente solo tiene bsuid (escribió con username de WhatsApp)
  bsuid: string | null;
  nombre: string | null;
  ciudad: string | null;
  fechaRegistro: string;
  ultimaInteraccion: string | null;
  aceptoTratamientoDatos: boolean;
  identificacion: string | null;
  correo: string | null;
}

export interface Pedido {
  id: string;
  clienteId: string;
  productoInteres: string;
  ciudad: string | null; // legado — ya no se captura, solo pedidos anteriores al cambio la tienen
  canal: 'detal' | 'distribucion' | 'negocio';
  creadoEn: string;
}

export interface RegistroServicioCliente {
  id: string;
  clienteId: string;
  descripcion: string;
  tipo: 'PQR' | 'Sugerencia' | 'Facturacion';
  creadoEn: string;
}
