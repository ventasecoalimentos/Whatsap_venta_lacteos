# Contratos compartidos

Este es el contrato que **todas las partes delegadas deben respetar exactamente** (mismos
nombres, mismas firmas). Permite construir Parte 1, 2 y 3 en paralelo sin que ninguna necesite
el código real de las otras — solo este documento.

## `src/dominio/estadoConversacion.ts` (Parte 2)

```typescript
export enum EstadoConversacion {
  INICIO = 'INICIO',
  MENU_PRINCIPAL = 'MENU_PRINCIPAL', // Reply Buttons: Servicio al cliente / Ventas
  SERVICIO_CLIENTE = 'SERVICIO_CLIENTE',
  ESPERANDO_QUEJA = 'ESPERANDO_QUEJA',
  // Solo se alcanza si WhatsApp trae nombre de perfil para un cliente nuevo — ofrece usarlo o
  // escribir uno distinto (ver desdeConfirmarNombre.ts).
  CONFIRMAR_NOMBRE_PERFIL = 'CONFIRMAR_NOMBRE_PERFIL',
  ESPERANDO_NOMBRE = 'ESPERANDO_NOMBRE', // solo se alcanza desde la rama Ventas, cliente nuevo
  ESPERANDO_CIUDAD = 'ESPERANDO_CIUDAD',
  MENU_VENTAS = 'MENU_VENTAS', // Reply Buttons: Detal / Distribución
  CATALOGO_DETAL = 'CATALOGO_DETAL',
  CATALOGO_DISTRIB = 'CATALOGO_DISTRIB',
  // Terminal: bot en silencio, humano responde por coexistencia. Equivale a "RESPUESTA_HUMANA"
  // en el diagrama de flujo del cliente — mismo concepto, nombre interno sin cambiar.
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
  canal: 'detal' | 'distribucion';
  creadoEn: Date;
}

export interface Queja {
  id: string;
  clienteId: string;
  descripcion: string;
  creadoEn: Date;
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
  crear(datos: {
    clienteId: string;
    productoInteres: string;
    ciudad: string;
    canal: 'detal' | 'distribucion';
  }): Promise<Pedido>;
}

export interface IQuejaRepository {
  crear(datos: { clienteId: string; descripcion: string }): Promise<Queja>;
}
```

No hay `Mensaje`/`IMensajeRepository` — se decidió no llevar log de mensajes (ver
`docs/MODELO_DATOS.md`).

## `src/mensajeria/tipos.ts` (Parte 3 lo implementa)

```typescript
export interface IProveedorMensajeria {
  enviarTexto(telefono: string, mensaje: string): Promise<void>;
  enviarDocumento(telefono: string, urlOBase64: string, nombre: string): Promise<void>;
  enviarLista(telefono: string, texto: string, opciones: OpcionLista[]): Promise<void>;
  enviarBotones(telefono: string, texto: string, opciones: OpcionLista[]): Promise<void>;
}
```

## `src/motor/motorEstados.ts` (Parte 2)

```typescript
// Qué debe persistir el caso de uso al llegar a HANDOFF_HUMANO. El motor es puro y no toca BD —
// solo describe la intención. `null` = transición normal, nada que persistir.
export type RegistroAlHandoff =
  | { tipo: 'pedido'; productoInteres: string; ciudad: string; canal: 'detal' | 'distribucion' }
  | { tipo: 'queja'; descripcion: string };

export interface ResultadoTransicion {
  nuevoEstado: EstadoConversacion;
  respuestas: RespuestaBot[]; // una transición puede generar más de un mensaje de salida (ej. texto + catálogo)
  contextoParcheado: Record<string, unknown>;
  registro: RegistroAlHandoff | null;
}

// El motor es puro y no conoce URLs reales de catálogo (viven en env, Parte 1/3) — identifica el
// catálogo por nombre semántico. El caso de uso (Parte 3) resuelve 'detal'/'distribucion' a la URL
// real (CATALOGO_DETAL_URL / CATALOGO_DISTRIBUCION_URL) antes de llamar a
// IProveedorMensajeria.enviarDocumento. Decisión fijada aquí para que Parte 2 y Parte 3 no asuman
// cosas distintas sobre cómo se resuelve el documento.
//
// 'lista' (List Message) y 'botones' (Reply Buttons) son las dos formas de pregunta cerrada de
// WhatsApp — se usan en vez de texto libre para capturar datos limpios desde el origen. `id` de
// cada opción es lo que vuelve en `mensajeTexto` cuando el cliente selecciona esa opción (la
// Parte 3 lo mapea así desde el webhook — ver docs/INTEGRACION_YCLOUD.md). El cliente siempre
// puede optar por escribir texto libre en vez de tocar una opción; las transiciones deben seguir
// aceptando eso como respaldo (ver `buscarOpcionSeleccionada` en
// `src/motor/transiciones/seleccionDeLista.ts`, y `parsearCiudad` para el caso de ciudad).
//
// Cuál usar: 'botones' si hay ≤3 opciones (un solo toque, mejor UX — título máx. 20 caracteres);
// 'lista' si hay más de 3 (título de fila máx. 24 caracteres). Hoy solo ciudad (4 opciones) usa
// 'lista'; el resto de menús (principal, servicio, ventas, catálogo) usan 'botones'.
export interface OpcionLista {
  id: string;
  titulo: string;
}

export type RespuestaBot =
  | { tipo: 'texto'; contenido: string }
  | { tipo: 'documento'; catalogo: 'detal' | 'distribucion'; nombre: string }
  | { tipo: 'lista'; texto: string; opciones: OpcionLista[] }
  | { tipo: 'botones'; texto: string; opciones: OpcionLista[] };

export interface EntradaMotor {
  estadoActual: EstadoConversacion;
  mensajeTexto: string | null; // null si el mensaje entrante no es texto (audio/imagen/sticker)
  contexto: Record<string, unknown>;
  clienteYaTieneNombre: boolean; // para decidir si hace falta pedir nombre en la rama Ventas
  nombreCliente: string | null; // ver nota abajo sobre su uso en el saludo de INICIO
  nombrePerfilWhatsApp: string | null; // customerProfile.name del webhook, si vino — ver nota abajo
  huboInactividad: boolean; // calculado por la Parte 3 antes de llamar al motor
}

export function procesarTransicion(entrada: EntradaMotor): ResultadoTransicion;
```

Es una función pura: no hace `await`, no llama a Supabase ni a YCloud. Firma real (objeto único
`EntradaMotor`, no parámetros posicionales) — es la que manda sobre cualquier pseudocódigo
simplificado en otros documentos. Ver tabla completa de transiciones en `docs/FLUJO_ESTADOS.md`.

**Nota sobre `nombreCliente`**: en la transición `INICIO`, el saludo usa `entrada.nombreCliente`
para personalizarlo cuando `clienteYaTieneNombre === true` (`"¡Hola de nuevo, {nombre}!"`) — no es
opcional. Ambas ramas (nuevo/recurrente) van a `MENU_PRINCIPAL`; el nombre de un cliente nuevo se
pide más adelante, solo si elige "Ventas" (`desdeMenuPrincipal.ts`) — ver `docs/FLUJO_ESTADOS.md` y
`docs/GUION_CONVERSACION.md`.

**Nota sobre `nombrePerfilWhatsApp`**: si un cliente nuevo elige "Ventas" y este campo trae un
valor, `desdeMenuPrincipal.ts` no pregunta el nombre directamente — pasa por
`CONFIRMAR_NOMBRE_PERFIL` ofreciendo usarlo o escribir uno distinto (ver
`desdeConfirmarNombre.ts`). Si es `null` (WhatsApp no lo proveyó), se sigue preguntando el nombre
como antes.

## `src/application/procesarMensajeEntrante.ts` — DTO de entrada (Parte 3)

```typescript
export interface MensajeEntranteDto {
  telefono: string; // E.164
  tipoMensaje: 'texto' | 'audio' | 'imagen' | 'sticker' | 'video' | 'otro';
  texto: string | null; // null si tipoMensaje !== 'texto'
  nombrePerfil: string | null; // customerProfile.name de WhatsApp, si vino en el mensaje
}
```

## Notas de compatibilidad entre partes

- Parte 2 y Parte 3 importan tipos de `src/datos/tipos.ts` y `src/dominio/*` — pueden escribir
  contra este documento sin esperar a que Parte 1 termine de implementar los repos reales.
- Ningún archivo de `datos/tipos.ts` requiere el SDK de Supabase — es solo TypeScript plano, así
  que puede existir (con estas firmas) incluso antes de que Parte 1 termine su implementación,
  si hiciera falta para desbloquear tipado en Parte 2/3.
