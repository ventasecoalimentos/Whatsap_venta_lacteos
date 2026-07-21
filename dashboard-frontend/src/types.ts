// Reflejan Cliente/Pedido/Queja de src/datos/tipos.ts (backend) — duplicados a propósito: este
// frontend es un proyecto Vite separado, sin acceso directo al código del servidor.
export interface Cliente {
  id: string;
  telefono: string;
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
  ciudad: string;
  canal: 'detal' | 'distribucion';
  creadoEn: string;
}

export interface Queja {
  id: string;
  clienteId: string;
  descripcion: string;
  tipo: 'PQR' | 'Sugerencia';
  creadoEn: string;
}
