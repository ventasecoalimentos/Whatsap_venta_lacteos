# Integración YCloud

Propiedad de la Parte 3 (`src/mensajeria/ycloudProveedor.ts`, `src/http/webhookController.ts`).

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
  `customerProfile.name` (nombre de perfil de WhatsApp) se usa para ofrecer "¿te puedo llamar
  así?" a un cliente nuevo en la rama Ventas, en vez de preguntar el nombre a secas (ver
  `CONFIRMAR_NOMBRE_PERFIL` en `docs/FLUJO_ESTADOS.md`) — no se autocompleta sin confirmar.
- Tipos de mensaje esperados: texto, audio, imagen, sticker, video. Cualquier tipo que no sea
  texto se mapea a `tipoMensaje` correspondiente con `texto: null` (ver `docs/FLUJO_ESTADOS.md` →
  mensajes inesperados).
- **Respuesta a List Message** (`type: 'interactive'`, `interactive.type: 'list_reply'`) o a
  **Reply Button** (`interactive.type: 'button_reply'`): ambas se mapean como si fueran texto
  normal — `mensajeTexto` = `interactive.list_reply.id` o `interactive.button_reply.id` (ver
  `src/http/mapeoYCloud.ts`). **Aún sin confirmar contra un payload real** — falta probar
  seleccionando una opción de un menú (no solo escribiendo texto) y revisar el JSON en el
  inspector de ngrok (`http://127.0.0.1:4040`).

## Validación de firma

CLAUDE.md indica "validar firma si YCloud la provee" — es condicional porque no está confirmado
que YCloud firme sus webhooks. **No implementar verificación criptográfica especulativa.** Antes
de escribir el middleware `validarFirmaYCloud`, confirmar en la documentación real de YCloud si
existe ese mecanismo (header de firma, secret compartido, etc.). Si no existe, omitir el
middleware y dejarlo anotado como pendiente de la API en sí, no como deuda técnica nuestra.

## Envío de mensajes

- `enviarTexto(telefono, mensaje)` — mensaje de texto libre vía API REST de YCloud.
- `enviarDocumento(telefono, urlOBase64, nombre)` — envío del catálogo (PDF al detal o
  distribución) como documento adjunto.
- `enviarLista(telefono, texto, opciones)` — WhatsApp List Message (menú de selección única, hasta
  10 opciones), usado solo para la pregunta de ciudad (4 opciones — ver `docs/FLUJO_ESTADOS.md` →
  "Menús: Reply Buttons o List Message"). Requiere `sections[].title` (obligatorio para WhatsApp,
  máx. 24 caracteres) — su ausencia causó un 502 real al probar (confirmado 2026-07-18).
- `enviarBotones(telefono, texto, opciones)` — WhatsApp Reply Buttons (máx. 3 opciones, un solo
  toque), usado en el resto de menús (principal, servicio al cliente, ventas, catálogo). Título de
  cada botón máx. 20 caracteres.
- Confirmado que YCloud soporta ambos tipos de mensaje interactivo de forma nativa (`POST
  /v2/whatsapp/messages` con `type: 'interactive'`).
- **Orden de entrega de documento + siguiente mensaje**: aunque el caso de uso envía el documento
  y luego el menú en el orden correcto (esperando cada respuesta de la API), a veces el menú
  llegaba antes que el documento al celular — WhatsApp acepta el envío casi al instante pero sigue
  procesando/entregando el archivo de forma asíncrona. `procesarMensajeEntrante.ts` agrega una
  pausa configurable (`DELAY_TRAS_DOCUMENTO_MS`, default 1500ms) después de cada `documento` que
  tenga un mensaje después, para darle tiempo a WhatsApp de entregarlo primero (confirmado con
  prueba real 2026-07-18). En tests de integración se pasa en `0` para no depender de temporizadores
  reales.
- El flujo del bot **siempre ocurre dentro de la ventana de 24h** porque el cliente escribe
  primero — no se necesitan plantillas aprobadas por Meta para ningún mensaje de este flujo
  (bienvenida, catálogo, notificación al equipo). No implementar lógica de plantillas en esta
  fase.

## Catálogos

Dos catálogos, provistos por el cliente (María Paula) como PDF o link — no se generan
dinámicamente. Reemplazan la distinción anterior por cobertura de ciudad:

- `CATALOGO_DETAL_URL` — venta al por menor.
- `CATALOGO_DISTRIBUCION_URL` — venta al por mayor (distribución), aplica en cualquier ciudad.

Si al momento de construir no se cuenta con los archivos/links reales, usar un placeholder y
dejarlo anotado como pendiente para antes de producción (ver hito día 18 en CLAUDE.md).

## Notificaciones al equipo

Ver `docs/FLUJO_ESTADOS.md` → "Notificaciones al equipo". Se implementan como `enviarTexto()`, en
el mismo hilo del cliente, disparadas por el caso de uso según `resultado.registro?.tipo`
(`'pedido'` o `'queja'`).
