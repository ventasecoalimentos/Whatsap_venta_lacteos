# Integración YCloud

Propiedad de la Parte 3 (`src/mensajeria/ycloudProveedor.ts`, `src/http/webhookController.ts`).

## Webhook entrante

- YCloud envía `POST` con el mensaje recibido a la URL pública configurada en su panel.
- El controlador responde `200` inmediatamente (ver `docs/ARQUITECTURA.md` → manejo de errores),
  y procesa de forma asíncrona sin bloquear la respuesta.
- Mapear el payload de YCloud al DTO interno `MensajeEntranteDto` (ver `docs/CONTRATOS.md`).
  **Antes de implementar el mapeo exacto, revisar la forma real del payload en la documentación
  de YCloud** (no asumir nombres de campo) — el equipo de la Parte 3 debe verificar esto contra
  la doc oficial de YCloud (o un payload de ejemplo real) antes de dar por cerrado el mapeo.
- Tipos de mensaje esperados: texto, audio, imagen, sticker, video. Cualquier tipo que no sea
  texto se mapea a `tipoMensaje` correspondiente con `texto: null` (ver `docs/FLUJO_ESTADOS.md` →
  mensajes inesperados).

## Validación de firma

CLAUDE.md indica "validar firma si YCloud la provee" — es condicional porque no está confirmado
que YCloud firme sus webhooks. **No implementar verificación criptográfica especulativa.** Antes
de escribir el middleware `validarFirmaYCloud`, confirmar en la documentación real de YCloud si
existe ese mecanismo (header de firma, secret compartido, etc.). Si no existe, omitir el
middleware y dejarlo anotado como pendiente de la API en sí, no como deuda técnica nuestra.

## Envío de mensajes

- `enviarTexto(telefono, mensaje)` — mensaje de texto libre vía API REST de YCloud.
- `enviarDocumento(telefono, urlOBase64, nombre)` — envío del catálogo (PDF completo o
  reducido) como documento adjunto.
- El flujo del bot **siempre ocurre dentro de la ventana de 24h** porque el cliente escribe
  primero — no se necesitan plantillas aprobadas por Meta para ningún mensaje de este flujo
  (bienvenida, catálogo, notificación al equipo). No implementar lógica de plantillas en esta
  fase.

## Catálogos

Dos catálogos, provistos por el cliente (María Paula) como PDF o link — no se generan
dinámicamente:

- `CATALOGO_COMPLETO_URL` — Bogotá, Yopal, Villavicencio.
- `CATALOGO_REDUCIDO_URL` — cualquier otra ciudad (solo empaquetados).

Si al momento de construir no se cuenta con los archivos/links reales, usar un placeholder y
dejarlo anotado como pendiente para antes de producción (ver hito día 18 en CLAUDE.md).

## Notificación al equipo

Ver `docs/FLUJO_ESTADOS.md` → "Notificación al equipo". Se implementa como un `enviarTexto()`
más, en el mismo hilo del cliente, disparado por el caso de uso cuando
`resultado.debeNotificarEquipo === true`.
