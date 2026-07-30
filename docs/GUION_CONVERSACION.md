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
| Bot | Aquí tienes nuestro catálogo: *(se adjunta PDF, un solo catálogo para las 3 categorías)* |
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

## Escenario 4 — Servicio al cliente → PQRSF (queja o sugerencia)

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Servicio al cliente" desde MENU_PRINCIPAL)* |
| Bot | ¿En qué te podemos ayudar? *(botones: Facturación / PQRSF / Menú anterior)* |
| Cliente | *(toca "PQRSF")* |
| Bot | Con gusto te ayudamos con tu PQRSF 📋\n\nCuéntanos, ¿qué tipo de solicitud tienes?\n\n• *PQR*: Petición, queja o reclamo\n• *Sugerencia*: Sugerencia o felicitación *(botones: PQR / Sugerencia)* |
| Cliente | *(toca "PQR")* |
| Bot | Gracias, Juan Pérez. ¿Me compartes tu número de identificación (cédula o NIT)? *(si el cliente ya tenía nombre guardado — si no, primero pregunta "¿Cuál es tu nombre completo?")* |
| Cliente | 1234567890 |
| Bot | Perfecto. ¿A qué correo electrónico podemos escribirte para dar respuesta? 📧 |
| Cliente | juan@example.com |
| Bot | Ya casi terminamos 🙌 Cuéntanos con detalle qué sucedió, para poder ayudarte de la mejor manera. |
| Cliente | El pedido llegó incompleto |
| Bot | ¡Gracias por contarnos, Juan Pérez!🤠 \nTu solicitud ya quedó registrada.\n En breve un miembro de nuestro equipo se comunica contigo para darte una respuesta.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮 |
| Bot | 📋 *Resumen de tu solicitud*\nTipo: PQR\nNombre: Juan Pérez\nIdentificación: 1234567890\nCorreo: juan@example.com\nDescripción: El pedido llegó incompleto |

## Escenario 5 — Servicio al cliente → Facturación

Igual patrón de captura (nombre → identificación → correo), pero **siempre** vuelve a pedir el
nombre completo (aunque el cliente ya lo tenga guardado) y va directo a `HANDOFF_HUMANO` sin pedir
descripción libre:

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Facturación")* |
| Bot | Para el área de facturación necesitamos confirmar nuevamente algunos datos, ¿cuál es tu nombre completo? |
| Cliente | Juan Pérez Gómez |
| Bot | Gracias, Juan Pérez Gómez. ¿Me compartes tu número de identificación (cédula o NIT)? |
| Cliente | 900123456-7 |
| Bot | Perfecto. ¿A qué correo electrónico podemos escribirte para dar respuesta? 📧 |
| Cliente | facturacion@empresa.com |
| Bot | ¡Listo, Juan Pérez Gómez! 🙌 Ya tenemos tus datos para facturación. En breve un miembro de nuestro equipo se comunica contigo.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮 |
| Bot | 📃 *Resumen de facturación*\nNombre completo: Juan Pérez Gómez\nIdentificación (Cédula/NIT): 900123456-7\nCorreo: facturacion@empresa.com |

Se guardan nombre, identificación y correo (mismos campos que PQR) — no razón social ni número de
factura. Se registra en `servicio_cliente` con `tipo: 'Facturacion'` y descripción fija "Solicitud
de facturación" (no hay texto libre en esta rama).

## Escenario 6 — Aviso de "mucha demanda" en HANDOFF_HUMANO

Después de llegar a `HANDOFF_HUMANO` (cualquiera de los escenarios anteriores), si el cliente
vuelve a escribir (o la tarea de fondo revisa) y ya pasó `INTERVALO_AVISO_DEMANDA_MIN` (10 min por
defecto) desde el último mensaje/aviso, sin que se haya superado `VENTANA_INACTIVIDAD_HORAS` (30
min por defecto) de silencio total:

| Quién | Mensaje |
|---|---|
| Cliente | ¿Alguna novedad? *(pasados 10+ minutos sin que el asesor haya escrito — o simplemente pasa el tiempo, sin que el cliente escriba, y corre la tarea de fondo)* |
| Bot | Gracias por tu paciencia 🙏 En este momento tenemos mucha demanda, en breve te atiende alguien de nuestro equipo. |

Esto se puede repetir hasta 3 veces por estadía en handoff con los valores por defecto (10 min ×
3 = 30 min, el tope de `VENTANA_INACTIVIDAD_HORAS`). El bot no puede saber si el asesor ya
respondió (limitación de la coexistencia de YCloud) — el aviso se dispara solo por silencio del
cliente. Ver `docs/FLUJO_ESTADOS.md` → "Aviso de mucha demanda" para el detalle técnico completo.

## Mensajes inesperados (audio, imagen, sticker, video)

Varían el texto según el punto del flujo, pero siempre piden texto (o repiten el menú) sin perder
el progreso de la conversación — ver tabla completa en `docs/FLUJO_ESTADOS.md`.

## Opción no reconocida en un menú

Si el cliente escribe algo que no coincide con ninguna opción del menú actual, el bot responde
"No entendí esa opción, por favor elige una del menú:" y vuelve a mostrar las mismas opciones —
nunca se pierde ni avanza a un estado equivocado.

## Después del handoff

El bot no vuelve a responder normalmente en esa conversación — solo el equipo humano, desde la
misma app de WhatsApp — hasta que pasen `VENTANA_INACTIVIDAD_HORAS` (30 min por defecto) sin
actividad del cliente, momento en el cual un nuevo mensaje suyo reinicia el flujo desde el saludo.
La única excepción es el aviso de "mucha demanda" (Escenario 6), que no cambia el estado de la
conversación.

## Qué falta para cerrar la aprobación con el cliente

- [ ] Confirmar con el cliente el tono y el saludo genérico actual (editado directamente en
      `src/motor/transiciones/saludoBienvenida.ts`).
- [ ] Confirmar el formato de las 3 tarjetas resumen (pedido / PQRSF / facturación).
- [ ] Confirmar si el aviso de "mucha demanda" debería tener un texto distinto según cuántas veces
      se repita (hoy es siempre el mismo).
- [ ] Confirmar si "Servicio al cliente" tendrá más opciones a futuro (el menú ya soporta hasta 3
      sin rediseñar el flujo — hoy usa las 3: Facturación / PQRSF / Menú anterior).
