# Guion de conversación del bot

Este documento recoge **exactamente** los textos que el bot envía en cada punto del flujo,
extraídos del código (`src/motor/transiciones/`) — si el código cambia, este documento debe
actualizarse para no desincronizarse.

## Escenario 1 — Cliente nuevo, Ventas, Detal

| Quién | Mensaje |
|---|---|
| Cliente | (escribe por primera vez, cualquier texto) |
| Bot | Hola 👋🏻, ¿cómo estás? \n Bienvenido al Centro de Ventas y Servicios de Llano Lácteos 🐮❤️💚, estamos felices de que estés aquí con nosotros. |
| Bot | Antes de continuar 📋\n\nEn *Llano Lácteos* cuidamos tus datos. Al continuar, autorizas el tratamiento de tu información (nombre, teléfono y ciudad) para gestionar tus pedidos y contactarte, conforme a la Ley 1581 de 2012.\n\nConsulta nuestra política aquí: [enlace]\n\n¿Autorizas el tratamiento de tus datos? *(botones: Autorizo / No autorizo)* |
| Cliente | *(toca "Autorizo")* |
| Bot | Para darte una atención más personalizada, ¿cuál es tu nombre? |
| Cliente | Juan Pérez |
| Bot | ¿Juan Pérez, en qué te podemos ayudar? *(botones: Servicio al cliente / Ventas)* |
| Cliente | *(toca "Ventas")* |
| Bot | ¿Buscas comprar al detal, eres distribuidor o tienes un negocio? *(botones: Detal / Distribuidor / Negocio)* |
| Cliente | *(toca "Detal")* |
| Bot | 📖 *Catálogo:* *(se adjunta PDF, un solo catálogo para las 3 categorías)* |
| Bot | 📌 Antes de comprar, ten en cuenta esta información: *(se adjunta imagen fija con tiempos de entrega, valor del domicilio, etc. — provista por el negocio, ver `COMO_COMPRAR_URL` en `docs/VARIABLES_ENTORNO.md`)* |
| Bot | ¿Seguimos con tu pedido?\n\n_Escribe 1️⃣ para volver al menú principal._ *(botones: Continuar pedido / Menú anterior)* |
| Cliente | *(toca "Continuar pedido")* |
| Bot | ¡Listo! 🙌\nEn un momento uno de nuestros asesores se comunica contigo para atender tu pedido.\n\n*¡Gracias por preferir Llano Lácteos!🐮🤠* |
| Bot | 📦 *Resumen del pedido*\nCliente: Juan Pérez\nCanal: Detal |

A partir de aquí el bot queda en silencio (salvo el aviso de "mucha demanda", ver Escenario 6) —
responde el equipo humano desde la app normal de WhatsApp (coexistencia).

Nota: ya no se pregunta la ciudad ni qué producto busca (ver `docs/FLUJO_ESTADOS.md`) — el asesor
humano lo pregunta directamente al tomar la conversación.

## Escenario 2 — Cliente nuevo, "No autorizo" el tratamiento de datos

Igual al escenario 1 hasta el consentimiento, pero el bot pregunta el nombre **sin importar la
respuesta** (decisión del cliente: se pide en ambos casos):

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "No autorizo")* |
| Bot | Para darte una atención más personalizada, ¿cuál es tu nombre? |

Continúa exactamente igual que el escenario 1 desde ahí en adelante.

## Escenario 3 — Cliente recurrente (ya con nombre y ya autorizó)

| Quién | Mensaje |
|---|---|
| Cliente | (escribe, cualquier texto) |
| Bot | ¡Hola de nuevo, Juan Pérez! 👋🏻 \n Bienvenido nuevamente al Centro de Ventas y Servicios de Llano Lácteos 🐮❤️💚, qué bueno tenerte de vuelta.\n\n¿En qué te podemos ayudar? *(botones: Servicio al cliente / Ventas)* |
| Cliente | *(toca "Ventas")* |
| Bot | ¿Buscas comprar al detal, eres distribuidor o tienes un negocio? *(no vuelve a pedir el nombre ni el consentimiento)* |

Continúa igual que el escenario 1 desde el menú de Ventas en adelante.

## Escenario 4 — Servicio al cliente → PQRSF → PQR (queja o reclamo)

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Servicio al cliente" desde MENU_PRINCIPAL)* |
| Bot | ¿En qué te podemos ayudar? *(botones: Facturación / PQRSF / Menú anterior)* |
| Cliente | *(toca "PQRSF")* |
| Bot | Con gusto te ayudamos con tu PQRSF 📋\n\nCuéntanos, ¿qué tipo de solicitud tienes?\n\n• *PQR*: Petición, queja o reclamo\n• *Sugerencia/Felicitación*: Cuéntanos una sugerencia o compártenos una felicitación *(botones: PQR / Sugerencia/Felicit — título truncado por el límite de 20 caracteres, el texto completo va arriba)* |
| Cliente | *(toca "PQR")* |
| Bot | Gracias, Juan Pérez. Antes de continuar: verifica que los datos que nos compartas sean correctos, ya que se usarán para tu trámite. ¿Me compartes tu número de identificación (cédula o NIT)? *(si el cliente ya tenía nombre guardado — si no, primero pregunta "¿Cuál es tu nombre completo?", y el mismo aviso aparece cuando después le pide la identificación)* |
| Cliente | nit: 123 |
| Bot | Ese número de identificación no parece válido 🤔 ¿me compartes solo los números de tu cédula o NIT? *(menos de 5 dígitos — se queda esperando)* |
| Cliente | 1234567890 |
| Bot | Perfecto. ¿A qué correo electrónico podemos escribirte para dar respuesta? 📧 |
| Cliente | no tengo correo |
| Bot | Ese correo no parece válido 🤔 ¿me lo compartes de nuevo? (ej: nombre@correo.com) *(no tiene forma de correo — se queda esperando)* |
| Cliente | juan@example.com |
| Bot | Ya casi terminamos 🙌 Cuéntanos con detalle qué sucedió, para poder ayudarte de la mejor manera. |
| Cliente | El pedido llegó incompleto |
| Bot | ¡Gracias por contarnos, Juan Pérez!🤠 \nTu solicitud ya quedó registrada.\n En breve un miembro de nuestro equipo se comunica contigo para darte una respuesta.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮 |
| Bot | 📋 *Resumen de tu solicitud*\nTipo: PQR\nNombre: Juan Pérez\nIdentificación: 1234567890\nCorreo: juan@example.com\nDescripción: El pedido llegó incompleto |

La validación de identificación (mínimo 5 dígitos, extraídos ignorando prefijos/puntuación) y de
correo (estructura `algo@algo.algo`, sin validar el dominio) aplica igual en Facturación (Escenario
5) porque ambas ramas comparten los mismos estados `ESPERANDO_PQRSF_IDENTIFICACION` /
`ESPERANDO_PQRSF_CORREO`.

## Escenario 4b — Servicio al cliente → PQRSF → Sugerencia/Felicitación

A diferencia de PQR, esta rama **no pide identificación ni correo** y **no promete que un asesor se
comunique** — solo agradece, guarda el comentario y vuelve al menú principal (no pasa por
`HANDOFF_HUMANO`, no genera tarjeta resumen):

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Sugerencia/Felicit" en el menú de PQRSF)* |
| Bot | ¡Con gusto! 🙌 Cuéntanos tu sugerencia o felicitación con toda confianza. |
| Cliente | Sería bueno tener más variedad de quesos |
| Bot | ¡Muchas gracias por tu comentario, Juan Pérez! 🤠 Lo tendremos muy en cuenta.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮 |
| Bot | *(reabre el menú principal — botones: Servicio al cliente / Ventas)* |

## Escenario 5 — Servicio al cliente → Facturación

Igual patrón de captura (nombre → identificación → correo), pero **siempre** vuelve a pedir el
nombre completo (aunque el cliente ya lo tenga guardado). A diferencia de Ventas y PQR, **no pasa
por `HANDOFF_HUMANO`** — no hace falta que un asesor tome la conversación, así que el bot pide una
foto de la tirilla/recibo (con la que el equipo tramita la factura electrónica) y cierra solo:

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Facturación")* |
| Bot | Para el área de facturación necesitamos confirmar nuevamente algunos datos, ¿cuál es tu nombre completo? |
| Cliente | Juan Pérez Gómez |
| Bot | Gracias, Juan Pérez Gómez. Antes de continuar: verifica que los datos que nos compartas sean correctos, ya que se usarán para tu trámite. ¿Me compartes tu número de identificación (cédula o NIT)? |
| Cliente | 900123456-7 |
| Bot | Perfecto. ¿A qué correo electrónico podemos escribirte para dar respuesta? 📧 |
| Cliente | facturacion@empresa.com |
| Bot | Para tramitar tu factura electrónica, compártenos una foto de la tirilla o recibo de tu compra 🧾 |
| Cliente | *(envía la foto)* |
| Bot | ¡Listo, Juan Pérez Gómez! 🙌 Tu solicitud de facturación quedó registrada. La factura se gestionará y la recibirás en tu correo dentro de las próximas 24 horas.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮 |
| Bot | *(reabre el menú principal — botones: Servicio al cliente / Ventas)* |

Si el cliente escribe texto en vez de mandar la foto (o manda audio/sticker/video), el bot se queda
esperando: "Necesito que sea una foto de la tirilla o recibo, por favor. 📷".

Se guardan nombre, identificación y correo (mismos campos que PQR) — no razón social ni número de
factura. Se registra en `servicio_cliente` con `tipo: 'Facturacion'` y descripción fija "Solicitud
de facturación" (no hay texto libre en esta rama). El bot no guarda la foto de la tirilla en
ningún lado — el equipo ya la ve en el mismo chat de WhatsApp (coexistencia).

## Escenario 6 — Aviso de "mucha demanda" en HANDOFF_HUMANO

Después de llegar a `HANDOFF_HUMANO` (Ventas o PQR — Facturación y Sugerencia/Felicitación no
llegan ahí, ver Escenarios 4b y 5), **cada mensaje** que el cliente escriba recibe el mismo aviso
de vuelta:

| Quién | Mensaje |
|---|---|
| Cliente | ¿Alguna novedad? |
| Bot | Gracias por tu paciencia. 🐮💚❤️<br><br>En este momento estamos atendiendo una alta demanda de solicitudes. Nuestro equipo estará contigo en breve para brindarte la atención que necesitas.<br><br>✨ Agradecemos mucho tu comprensión y esperamos atenderte muy pronto. |

Responde siempre igual, sin condiciones — es puramente reactivo, solo se dispara si el cliente
escribe. Cuando el asesor responde desde la app nativa, en cambio, no pasa por aquí en absoluto
(ver Escenario 6b).

## Escenario 6b — Cierre automático de HANDOFF_HUMANO (sin que el cliente escriba)

A diferencia del Escenario 6, esto **no depende de que el cliente escriba** — una tarea de fondo
(ver `docs/FLUJO_ESTADOS.md` → "Cierre automático de HANDOFF_HUMANO") revisa el tiempo transcurrido
desde el último mensaje de CUALQUIERA de los dos (cliente o asesor) y manda estos dos mensajes por
su cuenta:

| Cuándo | Mensaje |
|---|---|
| 20 min sin actividad (aviso previo) | ¿Sigues ahí? 🐮 En unos minutos este chat se cerrará por inactividad. Escríbenos si necesitas algo más y seguimos ayudándote. |
| 30 min sin actividad (cierre) | El chat se cerrará automáticamente por inactividad pero no te preocupes, en cuanto estés de regreso puedes volver a consultarnos. 🐮💚❤️<br><br>¡Te deseamos un excelente día 🤝! |

Desde 2026-08-13, YCloud sí notifica al webhook cuando el asesor responde desde la app nativa de
WhatsApp (evento `whatsapp.smb.message.echoes`) — así que un mensaje del asesor también reinicia el
reloj de los 30 min, igual que uno del cliente (ver `registrarRespuestaAsesor.ts`). Solo se cierra
cuando pasan los 30 min sin que **ninguno de los dos** escriba — mientras el asesor esté activo, la
conversación nunca se corta a mitad de una atención.

Después del cierre, el flujo queda en `INICIO` — el siguiente mensaje del cliente (sea cuando sea)
arranca de cero desde el saludo (ver Escenario 1). A diferencia de cualquier otro estado, un
mensaje tardío del cliente en `HANDOFF_HUMANO` **no** dispara por sí solo el reinicio por
inactividad de siempre — mientras siga en este estado, siempre recibe el aviso de "mucha demanda"
(Escenario 6); el único camino de salida es este cierre explícito de la tarea de fondo.

## Mensajes inesperados (audio, imagen, sticker, video)

Varían el texto según el punto del flujo, pero siempre piden texto (o repiten el menú) sin perder
el progreso de la conversación — ver tabla completa en `docs/FLUJO_ESTADOS.md`. La única excepción
es `ESPERANDO_PQRSF_TIRILLA` (Escenario 5), que es al revés: necesita una imagen, y cualquier otro
tipo de mensaje (incluido texto) se rechaza pidiendo la foto de nuevo.

## Opción no reconocida en un menú

Si el cliente escribe algo que no coincide con ninguna opción del menú actual, el bot responde
"No entendí esa opción, por favor elige una del menú:" y vuelve a mostrar las mismas opciones —
nunca se pierde ni avanza a un estado equivocado.

## Después del handoff

El bot no vuelve a responder normalmente en esa conversación — solo el equipo humano, desde la
misma app de WhatsApp — hasta que pasen `VENTANA_INACTIVIDAD_HORAS` (30 min por defecto) sin
actividad de NINGUNO de los dos (cliente o asesor, ver Escenario 6b). El aviso de "mucha demanda"
(Escenario 6) no cambia el estado de la conversación; el cierre automático de la tarea de fondo
(Escenario 6b) sí lo hace, apenas se cumplen los 30 min, sin esperar a que el cliente escriba.

## Qué falta para cerrar la aprobación con el cliente

- [ ] Confirmar con el cliente el tono y el saludo genérico actual (editado directamente en
      `src/motor/transiciones/saludoBienvenida.ts`).
- [ ] Confirmar el formato de las 2 tarjetas resumen (pedido / PQR) — Facturación y Sugerencia/
      Felicitación no generan tarjeta ni pasan por handoff, ver Escenarios 4b y 5.
- [ ] Confirmar si el aviso de "mucha demanda" debería tener un texto distinto según cuántas veces
      se repita (hoy es siempre el mismo).
- [ ] Confirmar si "Servicio al cliente" tendrá más opciones a futuro (el menú ya soporta hasta 3
      sin rediseñar el flujo — hoy usa las 3: Facturación / PQRSF / Menú anterior).
