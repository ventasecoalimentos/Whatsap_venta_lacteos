# Contratos compartidos

Firmas y tipos exactos que las distintas capas del proyecto (motor puro, repos de datos, caso de
uso, mensajería) deben respetar entre sí. Nació como el contrato para construir el proyecto en 3
partes en paralelo (ver `docs/DELEGACION.md`, hoy histórico) — se mantiene como referencia
autoritativa de las firmas reales para quien mantenga el código después.

## `src/dominio/estadoConversacion.ts`

```typescript
export enum EstadoConversacion {
  INICIO = 'INICIO',
  // Solo se alcanza si el cliente aún no autorizó el tratamiento de datos (Ley 1581 de 2012) — se
  // repite en cada conversación nueva (o reinicio por inactividad) hasta que autorice una vez.
  ESPERANDO_CONSENTIMIENTO_DATOS = 'ESPERANDO_CONSENTIMIENTO_DATOS',
  MENU_PRINCIPAL = 'MENU_PRINCIPAL', // Reply Buttons: Servicio al cliente / Ventas
  SERVICIO_CLIENTE = 'SERVICIO_CLIENTE', // Reply Buttons: Facturación / PQRSF / Menú anterior
  // Clasificación del PQRSF (PQR vs Sugerencia), pedida antes de la descripción.
  ESPERANDO_TIPO_PQRSF = 'ESPERANDO_TIPO_PQRSF',
  ESPERANDO_PQRSF_NOMBRE = 'ESPERANDO_PQRSF_NOMBRE',
  ESPERANDO_PQRSF_IDENTIFICACION = 'ESPERANDO_PQRSF_IDENTIFICACION',
  ESPERANDO_PQRSF_CORREO = 'ESPERANDO_PQRSF_CORREO',
  // Solo Facturación: pide una foto de la tirilla/recibo, luego cierra directo a MENU_PRINCIPAL
  // sin pasar por HANDOFF_HUMANO.
  ESPERANDO_PQRSF_TIRILLA = 'ESPERANDO_PQRSF_TIRILLA',
  ESPERANDO_QUEJA = 'ESPERANDO_QUEJA', // descripción libre de PQR/Sugerencia (Facturación no pasa por aquí)
  // Se pregunta justo después de responder el consentimiento de datos (autorice o no) — no se
  // sugiere el nombre de perfil de WhatsApp, se pregunta directo.
  ESPERANDO_NOMBRE = 'ESPERANDO_NOMBRE',
  MENU_VENTAS = 'MENU_VENTAS', // Reply Buttons: Detal / Distribuidor / Negocio
  // Un solo catálogo para las 3 categorías de Ventas — reemplaza a los antiguos CATALOGO_DETAL /
  // CATALOGO_DISTRIB (el comportamiento posterior es idéntico sin importar el canal elegido).
  CATALOGO_ENVIADO = 'CATALOGO_ENVIADO',
  // Terminal: bot en silencio (salvo el aviso de "mucha demanda"), humano responde por
  // coexistencia.
  HANDOFF_HUMANO = 'HANDOFF_HUMANO',
}
```

Ya no existe `src/dominio/ciudad.ts` — el enum `Ciudad` y `parsearCiudad()` se eliminaron junto con
la pregunta de ciudad (ver `docs/FLUJO_ESTADOS.md`).

## `src/datos/tipos.ts`

```typescript
export interface Cliente {
  id: string;
  telefono: string; // E.164, ej: +573001234567
  nombre: string | null;
  ciudad: string | null; // legado — ya no se captura, solo clientes anteriores a este cambio la tienen
  fechaRegistro: Date;
  ultimaInteraccion: Date | null;
  aceptoTratamientoDatos: boolean; // Ley 1581 de 2012
  identificacion: string | null; // capturado en PQRSF/Facturación
  correo: string | null; // capturado en PQRSF/Facturación
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
  productoInteres: string; // ya no se captura — siempre vacío en pedidos nuevos
  ciudad: string | null; // legado — ya no se captura
  canal: 'detal' | 'distribucion' | 'negocio';
  creadoEn: Date;
}

// Un registro de PQR, Sugerencia o Facturación (tabla `servicio_cliente`, se llamaba `quejas`).
export interface RegistroServicioCliente {
  id: string;
  clienteId: string;
  descripcion: string; // texto libre para PQR/Sugerencia; fijo ("Solicitud de facturación") para Facturación
  tipo: 'PQR' | 'Sugerencia' | 'Facturacion';
  creadoEn: Date;
}

export interface IClienteRepository {
  buscarPorTelefono(telefono: string): Promise<Cliente | null>;
  buscarPorId(id: string): Promise<Cliente | null>; // usado por tareaCierreHandoff.ts
  crear(datos: { telefono: string; nombre: string | null; ciudad: string | null }): Promise<Cliente>;
  actualizarNombre(id: string, nombre: string): Promise<void>;
  actualizarUltimaInteraccion(id: string): Promise<void>;
  actualizarConsentimiento(id: string, aceptoTratamientoDatos: boolean): Promise<void>;
  actualizarIdentificacion(id: string, identificacion: string): Promise<void>;
  actualizarCorreo(id: string, correo: string): Promise<void>;
  listarTodos(): Promise<Cliente[]>; // usado por /dashboard
}

export interface IConversacionRepository {
  // Una sola conversación por cliente (upsert) — obtiene o crea.
  obtenerOCrear(clienteId: string): Promise<Conversacion>;
  actualizarEstado(
    id: string,
    estado: EstadoConversacion,
    contexto: Record<string, unknown>,
  ): Promise<void>;
  listarPorEstado(estado: EstadoConversacion): Promise<Conversacion[]>; // usado por tareaCierreHandoff.ts
  // A diferencia de actualizarEstado, no toca actualizada_en — usado por tareaCierreHandoff.ts
  // para marcar el aviso previo enviado sin resetear el reloj de inactividad.
  actualizarContexto(id: string, contexto: Record<string, unknown>): Promise<void>;
  // Lo opuesto: SOLO toca actualizada_en, sin tocar estado ni contexto — usado por
  // registrarRespuestaAsesor.ts cuando el asesor responde desde la app nativa (whatsapp.smb.message.echoes).
  tocarActividad(id: string): Promise<void>;
}

export interface IPedidoRepository {
  crear(datos: {
    clienteId: string;
    productoInteres: string;
    canal: 'detal' | 'distribucion' | 'negocio';
  }): Promise<Pedido>;
  listarTodos(): Promise<Pedido[]>; // usado por /dashboard
}

export interface IServicioClienteRepository {
  crear(datos: {
    clienteId: string;
    descripcion: string;
    tipo: 'PQR' | 'Sugerencia' | 'Facturacion';
  }): Promise<RegistroServicioCliente>;
  listarTodos(): Promise<RegistroServicioCliente[]>; // usado por /dashboard
}
```

No hay `Mensaje`/`IMensajeRepository` — se decidió no llevar log de mensajes (ver
`docs/MODELO_DATOS.md`).

## `src/mensajeria/tipos.ts`

```typescript
export interface IProveedorMensajeria {
  enviarTexto(telefono: string, mensaje: string): Promise<void>;
  enviarDocumento(telefono: string, urlOBase64: string, nombre: string): Promise<void>;
  enviarImagen(telefono: string, urlOBase64: string): Promise<void>;
  enviarLista(telefono: string, texto: string, opciones: OpcionLista[]): Promise<void>;
  enviarBotones(telefono: string, texto: string, opciones: OpcionLista[]): Promise<void>;
}
```

`enviarImagen` — imagen inline (sin nombre de archivo, a diferencia de `enviarDocumento`), hoy solo
usada por `MENU_VENTAS` para la imagen fija de "cómo comprar" (ver `RespuestaBot` abajo).

`enviarUbicacion(...)` existió en una versión anterior (para la opción "Conocer sedes", ya
eliminada) — no forma parte del contrato actual.

## `src/motor/motorEstados.ts`

```typescript
// Qué debe persistir el caso de uso — ya no implica necesariamente que la conversación llegó a
// HANDOFF_HUMANO (Facturación genera este registro y cierra directo a MENU_PRINCIPAL, ver
// desdeEsperandoPqrsfTirilla.ts). El motor es puro y no toca BD — solo describe la intención.
// `null` = transición normal, nada que persistir.
export type RegistroAlHandoff =
  | { tipo: 'pedido'; productoInteres: string; canal: 'detal' | 'distribucion' | 'negocio' }
  | { tipo: 'queja'; descripcion: string; tipoPqrsf: 'PQR' | 'Sugerencia' | 'Facturacion' };

export interface ResultadoTransicion {
  nuevoEstado: EstadoConversacion;
  respuestas: RespuestaBot[]; // una transición puede generar más de un mensaje de salida
  contextoParcheado: Record<string, unknown>;
  registro: RegistroAlHandoff | null;
}

// El motor es puro y no conoce la URL real del catálogo (vive en env) — el caso de uso
// (procesarMensajeEntrante.ts) la resuelve antes de llamar a IProveedorMensajeria.enviarDocumento.
// Un solo catálogo para las 3 categorías de Ventas — 'documento' ya no trae un discriminador de
// canal (existió como 'catalogo': 'detal'|'distribucion' en una versión anterior).
//
// 'lista' (List Message) sigue en el contrato por si algún menú futuro necesita más de 3
// opciones, pero hoy ningún estado activo la usa — todos los menús actuales usan 'botones'
// (2-3 opciones cada uno).
export interface OpcionLista {
  id: string; // valor que vuelve en `mensajeTexto` cuando el cliente selecciona esta opción
  titulo: string; // texto visible para el cliente en el menú
}

export type RespuestaBot =
  | { tipo: 'texto'; contenido: string }
  | { tipo: 'documento'; nombre: string }
  | { tipo: 'imagen' } // imagen fija de "cómo comprar" (MENU_VENTAS) — el caso de uso la resuelve a COMO_COMPRAR_URL
  | { tipo: 'lista'; texto: string; opciones: OpcionLista[] }
  | { tipo: 'botones'; texto: string; opciones: OpcionLista[] };

export interface EntradaMotor {
  estadoActual: EstadoConversacion;
  mensajeTexto: string | null; // null si el mensaje entrante no es texto (audio/imagen/sticker)
  // Si el mensaje entrante es una foto/imagen — usado solo por ESPERANDO_PQRSF_TIRILLA.
  esImagen: boolean;
  contexto: Record<string, unknown>;
  clienteYaTieneNombre: boolean;
  nombreCliente: string | null;
  huboInactividad: boolean; // calculado por la Parte 3 antes de llamar al motor
  // Si el cliente ya autorizó el tratamiento de datos (Ley 1581 de 2012).
  aceptoTratamientoDatos: boolean;
  // true si `mensajeTexto` es el id de un botón/lista tocado, no texto libre escrito por el
  // cliente (ver mapeoYCloud.ts) — los botones de WhatsApp no caducan visualmente, así que puede
  // llegar el id de un menú anterior mientras se espera un dato real. Las transiciones de captura
  // de datos (nombre, identificación, correo, queja) lo rechazan en vez de guardarlo tal cual.
  esSeleccionInteractiva: boolean;
}

export function procesarTransicion(entrada: EntradaMotor): ResultadoTransicion;
```

Es una función pura: no hace `await`, no llama a Supabase ni a YCloud. Firma real (objeto único
`EntradaMotor`, no parámetros posicionales). Ver tabla completa de transiciones en
`docs/FLUJO_ESTADOS.md`.

`EntradaMotor` **ya no tiene** `nombrePerfilWhatsApp` — existió mientras el bot ofrecía confirmar
el nombre de perfil de WhatsApp (`CONFIRMAR_NOMBRE_PERFIL`, eliminado). El caso de uso sigue
recibiendo `customerProfile.name` del webhook (`MensajeEntranteDto.nombrePerfil`, ver abajo), pero
hoy no lo pasa al motor — queda disponible para un uso futuro si hiciera falta.

## `src/application/procesarMensajeEntrante.ts` — DTO de entrada

```typescript
export interface MensajeEntranteDto {
  telefono: string; // E.164
  tipoMensaje: 'texto' | 'audio' | 'imagen' | 'sticker' | 'video' | 'otro';
  texto: string | null; // null si tipoMensaje !== 'texto'
  nombrePerfil: string | null; // customerProfile.name de WhatsApp, si vino en el mensaje
  esSeleccionInteractiva: boolean; // true si `texto` es el id de un botón/lista, no texto libre
}
```

`ProcesarMensajeEntrante` recibe por constructor (en este orden): los 4 repositorios
(`IClienteRepository`, `IConversacionRepository`, `IPedidoRepository`,
`IServicioClienteRepository`), el `IProveedorMensajeria`, `catalogoUrl: string`,
`comoComprarUrl: string`, `ventanaInactividadHoras: number` y `delayTrasDocumentoMs: number` — ver
`docs/VARIABLES_ENTORNO.md` para de dónde sale cada uno.

## Notas de compatibilidad entre capas

- El motor (`src/motor/**`) y el caso de uso (`src/application/**`) importan tipos de
  `src/datos/tipos.ts` y `src/dominio/*` sin depender del SDK de Supabase directamente.
- `src/datos/tipos.ts` no requiere el SDK de Supabase — es solo TypeScript plano.
