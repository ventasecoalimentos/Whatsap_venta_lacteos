# CLAUDE.md — Contexto del Proyecto

## Qué es este proyecto

Bot conversacional de WhatsApp con CRM base para una empresa de lácteos y derivados (cliente: María Paula). El bot atiende el primer contacto del cliente, captura sus datos e interés de compra, los guarda en base de datos y notifica al equipo humano para que cierre el pedido. **Sin IA en el flujo del bot: es un motor de estados determinista.**

## Contexto de negocio

- La empresa vende quesos, leche y derivados en múltiples presentaciones (ej: mozzarella en media libra, libra, entero, tajado por libra/kilo).
- Distribuyen con cobertura completa (cadena de frío) solo en: **Bogotá, Yopal, Villavicencio**.
- Para cualquier otra ciudad solo pueden vender **productos empaquetados** (sin cadena de frío), que son pocos.
- El equipo es pequeño: no hay lógica de horarios ni SLA de respuesta; el bot notifica y un humano responde cuando puede.
- Los clientes recurrentes suelen conocer los productos y piden directo ("quiero X queso en Y presentación").

## Flujo del bot (definido y aprobado por el cliente)

1. **Mensaje entrante** → webhook recibe el mensaje desde YCloud.
2. **Reconocimiento**: buscar el número en la tabla `clientes`.
   - Cliente existente → saludo personalizado con su nombre, ir al paso 4.
   - Cliente nuevo → saludo genérico de bienvenida, pedir nombre.
3. **Captura de ciudad**: preguntar ciudad.
   - Bogotá / Yopal / Villavicencio → enviar catálogo completo (link o PDF).
   - Otra ciudad → mensaje explicando cobertura + catálogo reducido (solo empaquetados).
4. **Captura de interés**: preguntar qué producto busca (texto libre, se guarda tal cual).
5. **Cierre del bot**: mensaje de "en breve te atiende alguien del equipo".
6. **Notificación al equipo**: mensaje al mismo chat de WhatsApp del negocio con formato destacado:
   `🔔 NUEVO CLIENTE — [Nombre] | [Ciudad] | Interés: [producto]`
7. **Handoff**: el bot NO responde más en esa conversación hasta que se reinicie el flujo (el humano toma el chat). Definir condición de reinicio (ej: 24h de inactividad o comando del equipo).

## Stack

- **Backend**: Node.js (JavaScript o TypeScript — preferir TypeScript si no complica).
- **Base de datos**: Supabase (PostgreSQL).
- **Mensajería**: YCloud (BSP de WhatsApp Business API) con coexistencia — el número sigue funcionando en la app normal de WhatsApp.
- **Hosting**: Railway o Render (necesita URL pública para el webhook).
- **Sin IA en el bot.** Motor de estados determinista.

## Modelo de datos (Supabase)

- `clientes`: id, telefono (unique), nombre, ciudad, fecha_registro, ultima_interaccion.
- `conversaciones`: id, cliente_id, estado_actual, contexto (jsonb), iniciada_en, actualizada_en.
- `pedidos` (registro de interés, el pedido real lo cierra el humano): id, cliente_id, producto_interes (texto libre), ciudad, creado_en.
- `mensajes` (log): id, conversacion_id, direccion (in/out), contenido, timestamp.

Nota: frecuencia de compra y preferencias se derivan de `pedidos` — no crear campos redundantes todavía. El panel CRM es Fase 2 (no incluida en este proyecto).

## Estados del motor de flujos

`INICIO` → `ESPERANDO_NOMBRE` (solo cliente nuevo) → `ESPERANDO_CIUDAD` → `CATALOGO_ENVIADO` → `ESPERANDO_INTERES` → `HANDOFF_HUMANO` (terminal hasta reinicio).

Reglas:
- Cada mensaje entrante se procesa según el estado actual de la conversación en `conversaciones.estado_actual`.
- Guardar el estado tras cada transición (el sistema debe sobrevivir reinicios del servidor).
- Múltiples conversaciones simultáneas sin interferencia (aislamiento por telefono/conversacion).
- Mensajes inesperados (audio, imagen, sticker) → respuesta genérica pidiendo texto, sin romper el estado.

## Integración YCloud

- Webhook entrante: YCloud envía POST con los mensajes recibidos → validar firma si YCloud la provee.
- Envío: API REST de YCloud para mandar mensajes de texto y documentos (catálogo PDF o link).
- Plantillas: los mensajes que inician conversación fuera de la ventana de 24h requieren plantilla aprobada por Meta. Dentro de la ventana de 24h (cliente escribió primero) son mensajes libres y gratuitos — el flujo del bot siempre ocurre dentro de la ventana porque el cliente inicia.
- El catálogo lo provee el cliente (PDF o link) — son dos: completo y reducido.

## Restricciones y decisiones ya tomadas (NO cambiar sin consultar)

- No usar IA/LLM en el flujo del bot.
- No hay pasarela de pagos en esta fase (era Fase 2, no aprobada).
- No hay panel web en esta fase (era Fase 2, no aprobada).
- No integrar con sistemas de facturación (Syscafé u otros).
- El handoff es notificación en el mismo chat — no email, no otro número.
- Timeline: 18 días hábiles. Hito día 6: flujo básico demo-able en pruebas. Hito día 12: captura + BD + notificación completas. Día 18: producción.

## Convenciones de código

- Comentarios y nombres de variables/tablas en español (consistencia con el dominio del negocio).
- Variables de entorno en `.env` (nunca commitear): YCLOUD_API_KEY, SUPABASE_URL, SUPABASE_KEY, etc.
- Manejo de errores explícito en el webhook: nunca dejar que una excepción tumbe el servidor; loggear y responder 200 a YCloud para evitar reintentos infinitos.
- Tests para el motor de estados (es la pieza crítica).
