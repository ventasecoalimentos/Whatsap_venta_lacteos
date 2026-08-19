# Integración YCloud

Implementación real en `src/mensajeria/ycloudProveedor.ts`, `src/http/webhookController.ts` y
`src/http/mapeoYCloud.ts`.

## Webhook entrante

- YCloud envía `POST` con el mensaje recibido a la URL pública configurada en su panel.
- El controlador responde `200` inmediatamente (ver `docs/ARQUITECTURA.md` → manejo de errores),
  y procesa de forma asíncrona sin bloquear la respuesta.
- Mapear el payload de YCloud al DTO interno `MensajeEntranteDto` (ver `docs/CONTRATOS.md`).
- **Confirmado contra un payload real** (prueba end-to-end vía ngrok, 2026-07-18) para mensajes de
  texto — la forma es exactamente la asumida en `src/http/mapeoYCloud.ts`:
  ```json
  {
    "id": "evt_...", "type": "whatsapp.inbound_message.received", "apiVersion": "v2",
    "whatsappInboundMessage": {
      "from": "+573228438554",
      "customerProfile": { "name": "Andrew" },
      "to": "+573213787920",
      "type": "text",
      "text": { "body": "Hola" }
    }
  }
  ```
  `customerProfile.name` (nombre de perfil de WhatsApp) se captura en `MensajeEntranteDto.nombrePerfil`
  pero **hoy no lo usa el motor** — existió mientras el bot ofrecía confirmar ese nombre en vez de
  preguntarlo (`CONFIRMAR_NOMBRE_PERFIL`, eliminado, ver `docs/FLUJO_ESTADOS.md`). Se conserva el
  campo por si hace falta para un uso futuro.
- Tipos de mensaje esperados: texto, audio, imagen, sticker, video. Cualquier tipo que no sea
  texto se mapea a `tipoMensaje` correspondiente con `texto: null` (ver `docs/FLUJO_ESTADOS.md` →
  mensajes inesperados).
- **Respuesta a Reply Button** (`type: 'interactive'`, `interactive.type: 'button_reply'`): se
  mapea como si fuera texto normal — `mensajeTexto` = `interactive.button_reply.id` (ver
  `src/http/mapeoYCloud.ts`). El mapeo también soporta `list_reply` por si algún menú futuro vuelve
  a usar List Message (ver `docs/FLUJO_ESTADOS.md` → "Menús"), aunque hoy ningún estado activo lo
  necesita.
- **Los botones de WhatsApp no caducan visualmente** — un mensaje con botones enviado hace rato
  sigue siendo tocable en el chat del cliente, aunque la conversación ya haya avanzado a un estado
  totalmente distinto. Por eso `mapearPayloadYCloud` marca `esSeleccionInteractiva: true` cuando el
  mensaje viene de un botón/lista (en vez de texto libre real): las transiciones que capturan datos
  (nombre, identificación, correo, descripción de queja) usan esa marca para rechazar el id en vez
  de guardarlo tal cual como si el cliente lo hubiera escrito. Bug real detectado en producción
  2026-08-13: un cliente tocó "Menú anterior" de `SERVICIO_CLIENTE` (`id: MENU_ANTERIOR_SERVICIO`)
  mientras el bot esperaba su nombre, y ese id quedó guardado como `clientes.nombre` hasta este fix.

## Clientes con username de WhatsApp, sin número (BSUID)

WhatsApp permite escribir a un negocio usando un username (`@alias`) sin compartir el número de
teléfono — función de privacidad relativamente nueva. **Confirmado contra un payload real**
(2026-08-19), el bot no le respondía a estos clientes: el payload entrante no trae `from` en
absoluto, sino `fromUserId` con un BSUID (Business-Scoped User ID, formato `PAÍS.dígitos`):

```json
{
  "id": "evt_...", "type": "whatsapp.inbound_message.received", "apiVersion": "v2",
  "whatsappInboundMessage": {
    "fromUserId": "CO.1037313505747798",
    "customerProfile": { "name": "Ing Andres F Romero", "username": "idecon.Andres.Romero" },
    "to": "+573213787920",
    "type": "text",
    "text": { "body": "Hola" }
  }
}
```

`mapearPayloadYCloud` (ver `src/http/mapeoYCloud.ts`) usa `from` si viene, y si no `fromUserId`,
produciendo un `IdentificadorCliente` (`src/dominio/identificadorCliente.ts`) de tipo `telefono` o
`bsuid`. Este identificador viaja por todo el flujo en vez de un `string` de teléfono crudo — el
modelo de datos (`clientes.telefono`/`clientes.bsuid`, ver `docs/MODELO_DATOS.md`) y el envío de
mensajes (siguiente sección) también lo soportan.

**Para responder** hay que usar un campo distinto en el `POST /v2/whatsapp/messages` de YCloud:
`to` (teléfono, E.164) o `recipient` (BSUID) — son mutuamente excluyentes, confirmado contra la
documentación oficial de YCloud (`WhatsApp Usernames & BSUID Explained`, `Send a message directly`)
2026-08-19. `ycloudProveedor.ts::direccion()` resuelve cuál usar según
`IdentificadorCliente.tipo`.

**No confirmado** (a diferencia de todo lo anterior en esta sección): cuando el ASESOR responde
desde la app nativa a un cliente identificado por BSUID, `mapearEventoEcoAsesor` asume que el eco
trae `whatsappMessage.toUserId` (por analogía con `fromUserId` del lado entrante y con
`toUserId`/`recipientUserId` que sí aparecen confirmados en la respuesta del endpoint de envío) —
si el nombre real resultara ser otro, esa rama específica simplemente no dispara (el resto del
bot sigue funcionando igual, solo se pierde la detección de esa respuesta puntual del asesor).

## Coexistencia: mensajes del asesor (whatsapp.smb.message.echoes)

Cuando el equipo responde desde la app nativa de WhatsApp (no desde el bot), YCloud sincroniza ese
mensaje al mismo webhook con un evento aparte. **Confirmado contra un payload real** (2026-08-13):

```json
{
  "id": "evt_...", "type": "whatsapp.smb.message.echoes", "apiVersion": "v2",
  "whatsappMessage": {
    "from": "+573213787920", "to": "+573228438554",
    "type": "text", "text": { "body": "Ya te ayudo" }, "status": "sent"
  }
}
```

`whatsappMessage.to` es el teléfono del cliente al que le respondió el asesor (ver
`mapearEventoEcoAsesor` en `src/http/mapeoYCloud.ts`). Manejado por
`src/application/registrarRespuestaAsesor.ts` — ver `docs/FLUJO_ESTADOS.md` → "Detección de la
respuesta del asesor" para el comportamiento completo.

**Requiere configuración manual en el panel de YCloud**: este tipo de evento no viene suscrito por
defecto — hay que habilitarlo explícitamente en la sección de configuración del webhook (checkbox
`whatsapp.smb.message.echoes`, junto a los demás tipos de evento). Sin esto, el bot sigue
funcionando igual (el resto del flujo no depende de este evento), pero pierde la capacidad de
detectar la actividad del asesor — `tareaCierreHandoff.ts` cerraría la conversación solo por el
silencio del cliente, sin considerar si el asesor sigue escribiendo.

## Validación de firma

CLAUDE.md indica "validar firma si YCloud la provee" — es condicional porque no está confirmado
que YCloud firme sus webhooks. **No implementar verificación criptográfica especulativa.** Antes
de escribir un middleware de validación, confirmar en la documentación real de YCloud si existe
ese mecanismo (header de firma, secret compartido, etc.). Si no existe, dejarlo anotado como
pendiente de la API en sí, no como deuda técnica nuestra. (Sin implementar a la fecha.)

## Envío de mensajes

- `enviarTexto(destinatario, mensaje)` — mensaje de texto libre vía API REST de YCloud. Usado para
  saludos, preguntas de texto libre, cierres de handoff, tarjetas resumen y el aviso de "mucha
  demanda".
- `enviarDocumento(destinatario, urlOBase64, nombre)` — envío del catálogo (un solo PDF, ver
  `CATALOGO_URL` en `docs/VARIABLES_ENTORNO.md`) como documento adjunto.
- `enviarImagen(destinatario, urlOBase64)` — imagen inline (`type: 'image'`), sin nombre de archivo.
  Hoy solo la usa `MENU_VENTAS` para la imagen fija de "cómo comprar" (ver `COMO_COMPRAR_URL` en
  `docs/VARIABLES_ENTORNO.md`), enviada justo después del catálogo.
- `enviarLista(destinatario, texto, opciones)` — WhatsApp List Message (menú de selección única, hasta
  10 opciones). Sigue implementado (contrato en `docs/CONTRATOS.md`) pero **ningún estado activo
  lo usa hoy** — la única pregunta que lo necesitaba (ciudad, 4 opciones) se eliminó.
- `enviarBotones(destinatario, texto, opciones)` — WhatsApp Reply Buttons (máx. 3 opciones, un solo
  toque), usado en **todos** los menús actuales (principal, servicio al cliente, tipo de PQRSF,
  ventas, catálogo). Título de cada botón máx. 20 caracteres.
- `destinatario` es un `IdentificadorCliente` (teléfono o bsuid, ver sección anterior) — cada
  método de `ycloudProveedor.ts` lo traduce al campo `to` o `recipient` que YCloud espera.
- Confirmado que YCloud soporta ambos tipos de mensaje interactivo de forma nativa (`POST
  /v2/whatsapp/messages` con `type: 'interactive'`).
- **Orden de entrega de documento + siguiente mensaje**: aunque el caso de uso envía el documento
  y luego el menú en el orden correcto (esperando cada respuesta de la API), a veces el menú
  llegaba antes que el documento al celular — WhatsApp acepta el envío casi al instante pero sigue
  procesando/entregando el archivo de forma asíncrona. `procesarMensajeEntrante.ts` agrega una
  pausa configurable (`DELAY_TRAS_DOCUMENTO_MS`, default 4000ms) después de cada `documento` que
  tenga un mensaje después, para darle tiempo a WhatsApp de entregarlo primero. El valor original
  (1500ms) resultó insuficiente en pruebas reales y se subió a 4000ms — sigue siendo una
  heurística de tiempo fijo, no una confirmación real de entrega. En tests de integración se pasa
  en `0` para no depender de temporizadores reales.
- El flujo del bot **siempre ocurre dentro de la ventana de 24h** porque el cliente escribe
  primero — no se necesitan plantillas aprobadas por Meta para ningún mensaje de este flujo. No
  implementar lógica de plantillas en esta fase.

## Catálogo

Un solo catálogo (`CATALOGO_URL`), provisto por el cliente (María Paula) como PDF o link — no se
genera dinámicamente. Sirve para las 3 categorías de Ventas (Detal/Distribuidor/Negocio); la lista
de precios la manda el asesor humano, no el bot (ver `docs/FLUJO_ESTADOS.md`).

Antes había 2 catálogos (por canal, y antes de eso por cobertura de ciudad) — se simplificó a uno
solo por decisión del cliente.

Justo después del catálogo se envía una segunda imagen fija, "cómo comprar" (`COMO_COMPRAR_URL`,
ver `docs/VARIABLES_ENTORNO.md`) — tiempos de entrega, valor del domicilio, etc. A diferencia del
catálogo, va como `enviarImagen` (inline), no como `enviarDocumento`.

## Notificaciones al equipo → tarjeta resumen

El handoff ya no envía un mensaje destacado tipo `"🔔 NUEVO CLIENTE — ..."`. Solo la rama PQR manda
una tarjeta resumen con `enviarTexto()` (en el mismo hilo del cliente, construida por el motor a
partir de `resultado.registro?.tipo === 'queja'` y los datos ya capturados) — Ventas ya no la manda
(se quitó por decisión del cliente, ver `docs/FLUJO_ESTADOS.md` → "Tarjeta resumen en el handoff").

Facturación y Sugerencia/Felicitación **no llegan a `HANDOFF_HUMANO`** (ver
`docs/FLUJO_ESTADOS.md`), así que no generan tarjeta resumen — cierran solas con un mensaje de
agradecimiento/confirmación.

`YCLOUD_NUMERO_EQUIPO` se sigue validando en el arranque pero ningún código la usa hoy — no hay un
número/chat separado para notificar al equipo (decisión: todo en el mismo hilo del cliente).
