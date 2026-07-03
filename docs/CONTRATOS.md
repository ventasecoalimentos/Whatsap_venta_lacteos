# Contratos compartidos

Este es el contrato que **todas las partes delegadas deben respetar exactamente** (mismos
nombres, mismas firmas). Permite construir Parte 1, 2 y 3 en paralelo sin que ninguna necesite
el código real de las otras — solo este documento.

## `src/dominio/estadoConversacion.ts` (Parte 2)

```typescript
export enum EstadoConversacion {
  INICIO = 'INICIO',
  ESPERANDO_NOMBRE = 'ESPERANDO_NOMBRE',
  ESPERANDO_CIUDAD = 'ESPERANDO_CIUDAD',
  CATALOGO_ENVIADO = 'CATALOGO_ENVIADO',
  ESPERANDO_INTERES = 'ESPERANDO_INTERES',
  HANDOFF_HUMANO = 'HANDOFF_HUMANO',
}
```

## `src/dominio/ciudad.ts` (Parte 2)

```typescript
export enum Ciudad {
  BOGOTA = 'Bogotá',
  YOPAL = 'Yopal',
  VILLAVICENCIO = 'Villavicencio',
  OTRA = 'Otra',
}

export const CIUDADES_COBERTURA_COMPLETA: Ciudad[] = [Ciudad.BOGOTA, Ciudad.YOPAL, Ciudad.VILLAVICENCIO];

export function tieneCobertura(ciudad: Ciudad): boolean;
export function parsearCiudad(texto: string): Ciudad; // normaliza mayúsculas/tildes; Ciudad.OTRA si no coincide (nunca falla)
```

## `src/datos/tipos.ts` (Parte 1 lo implementa; Parte 2 y 3 solo importan tipos)

```typescript
export interface Cliente {
  id: string;
  telefono: string; // E.164, ej: +573001234567
  nombre: string | null;
  ciudad: string | null;
  fechaRegistro: Date;
  ultimaInteraccion: Date | null;
}

export interface Conversacion {
  id: string;
  clienteId: string;
  estadoActual: EstadoConversacion;
  contexto: Record<string, unknown>;
  iniciadaEn: Date;
  actualizadaEn: Date;
}

export interface Pedido {
  id: string;
  clienteId: string;
  productoInteres: string;
  ciudad: string;
  creadoEn: Date;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  direccion: 'in' | 'out';
  contenido: string;
  timestamp: Date;
}

export interface IClienteRepository {
  buscarPorTelefono(telefono: string): Promise<Cliente | null>;
  crear(datos: { telefono: string; nombre: string | null; ciudad: string | null }): Promise<Cliente>;
  actualizarNombre(id: string, nombre: string): Promise<void>;
  actualizarCiudad(id: string, ciudad: string): Promise<void>;
  actualizarUltimaInteraccion(id: string): Promise<void>;
}

export interface IConversacionRepository {
  // Una sola conversación por cliente (ver docs/MODELO_DATOS.md) — obtiene o crea.
  obtenerOCrear(clienteId: string): Promise<Conversacion>;
  actualizarEstado(
    id: string,
    estado: EstadoConversacion,
    contexto: Record<string, unknown>,
  ): Promise<void>;
}

export interface IPedidoRepository {
  crear(datos: { clienteId: string; productoInteres: string; ciudad: string }): Promise<Pedido>;
}

export interface IMensajeRepository {
  registrar(datos: { conversacionId: string; direccion: 'in' | 'out'; contenido: string }): Promise<void>;
}
```

## `src/mensajeria/tipos.ts` (Parte 3 lo implementa)

```typescript
export interface IProveedorMensajeria {
  enviarTexto(telefono: string, mensaje: string): Promise<void>;
  enviarDocumento(telefono: string, urlOBase64: string, nombre: string): Promise<void>;
}
```

## `src/motor/motorEstados.ts` (Parte 2)

```typescript
export interface ResultadoTransicion {
  nuevoEstado: EstadoConversacion;
  respuestas: RespuestaBot[]; // una transición puede generar más de un mensaje de salida (ej. texto + catálogo)
  contextoParcheado: Record<string, unknown>;
  debeNotificarEquipo: boolean; // true solo en la transición hacia HANDOFF_HUMANO
}

export type RespuestaBot =
  | { tipo: 'texto'; contenido: string }
  | { tipo: 'documento'; urlOBase64: string; nombre: string };

export interface EntradaMotor {
  estadoActual: EstadoConversacion;
  mensajeTexto: string | null; // null si el mensaje entrante no es texto (audio/imagen/sticker)
  contexto: Record<string, unknown>;
  clienteYaTieneNombre: boolean; // para decidir INICIO → ESPERANDO_NOMBRE o ESPERANDO_CIUDAD
  nombreCliente: string | null;
  huboInactividad: boolean; // calculado por la Parte 3 antes de llamar al motor
}

export function procesarTransicion(entrada: EntradaMotor): ResultadoTransicion;
```

Es una función pura: no hace `await`, no llama a Supabase ni a YCloud. Ver tabla completa de
transiciones en `docs/FLUJO_ESTADOS.md`.

## `src/application/procesarMensajeEntrante.ts` — DTO de entrada (Parte 3)

```typescript
export interface MensajeEntranteDto {
  telefono: string; // E.164
  tipoMensaje: 'texto' | 'audio' | 'imagen' | 'sticker' | 'video' | 'otro';
  texto: string | null; // null si tipoMensaje !== 'texto'
}
```

## Notas de compatibilidad entre partes

- Parte 2 y Parte 3 importan tipos de `src/datos/tipos.ts` y `src/dominio/*` — pueden escribir
  contra este documento sin esperar a que Parte 1 termine de implementar los repos reales.
- Ningún archivo de `datos/tipos.ts` requiere el SDK de Supabase — es solo TypeScript plano, así
  que puede existir (con estas firmas) incluso antes de que Parte 1 termine su implementación,
  si hiciera falta para desbloquear tipado en Parte 2/3.
