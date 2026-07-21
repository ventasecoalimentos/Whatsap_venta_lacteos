# Guion de conversación del bot (para aprobación del cliente)

Este documento recoge **exactamente** los textos que el bot envía en cada punto del flujo,
extraídos del código (`src/motor/transiciones/`) — si el código cambia, este documento debe
actualizarse para no desincronizarse. Es el insumo para que Ecoalimentos del Llano S.A.S revise
y apruebe el tono y contenido de los mensajes, como pide la cotización (sección 6).

Flujo ampliado (aprobado por el cliente): desde un menú principal se elige entre **Servicio al
cliente** (quejas) y **Ventas** (captura de datos + interés, con distinción Detal/Distribución).

## Escenario 1 — Cliente nuevo, elige Ventas, Detal, en ciudad con cobertura completa

| Quién | Mensaje |
|---|---|
| Cliente | (escribe por primera vez, cualquier texto) |
| Bot | ¡Hola! Bienvenido/a a nuestra tienda de lácteos y derivados. ¿En qué te podemos ayudar? *(botones: Servicio al cliente / Ventas)* |
| Cliente | *(toca "Ventas")* |
| Bot | Para atenderte, ¿cuál es tu nombre? |
| Cliente | María Fernández |
| Bot | ¡Un gusto, María Fernández! ¿Desde qué ciudad nos escribes? *(lista: Bogotá / Yopal / Villavicencio / Otra ciudad)* |
| Cliente | *(toca "Bogotá")* |
| Bot | ¡Perfecto! En Bogotá entregamos con cadena de frío completa. |
| Bot | ¿Buscas comprar al detal o eres distribuidor? *(botones: Detal / Distribución)* |
| Cliente | *(toca "Detal")* |
| Bot | Aquí tienes nuestro catálogo al detal: *(se adjunta PDF catálogo detal)* |
| Bot | ¿Seguimos con tu pedido?\n\nEscribe *1* para volver al menú principal. *(botones: Menú anterior / Continuar pedido)* |
| Cliente | *(toca "Continuar pedido")* |
| Bot | ¡Listo! 🙌\nEn un momento uno de nuestros asesores se comunica contigo para atender tu pedido.\n\n*¡Gracias por preferir Llano Lácteos!🐮🤠* |
| Bot | 💬 *(simula que el equipo ya está escribiendo)* |

A partir de aquí el bot queda en silencio — responde el equipo humano desde la app normal de
WhatsApp (coexistencia).

## Escenario 1b — Cliente nuevo con nombre de perfil de WhatsApp disponible

Igual al escenario 1 hasta tocar "Ventas", pero si WhatsApp trae el nombre de perfil del
remitente (ej. "Andrew"), no se pregunta el nombre a secas:

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Ventas")* |
| Bot | ¡Hola, Andrew! ¿Te puedo llamar así, o prefieres escribir tu nombre? *(botones: Usar este nombre / Escribir otro)* |
| Cliente | *(toca "Usar este nombre")* |
| Bot | ¡Un gusto, Andrew! ¿Desde qué ciudad nos escribes? *(lista: Bogotá / Yopal / Villavicencio / Otra ciudad)* |

Si en cambio toca "Escribir otro", continúa exactamente como el escenario 1 (pregunta "¿cuál es
tu nombre?" y usa lo que el cliente escriba). Si WhatsApp no trae nombre de perfil, se salta este
paso y se pregunta directamente (escenario 1).

## Escenario 2 — Cliente elige Distribución (mayorista)

Igual al escenario 1 hasta el menú Detal/Distribución:

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Distribución")* |
| Bot | Aquí tienes nuestro catálogo para distribución mayorista, con las condiciones de venta al por mayor: *(se adjunta PDF catálogo distribución)* |
| Bot | ¿Seguimos con tu pedido?\n\nEscribe *1* para volver al menú principal. *(botones: Menú anterior / Continuar pedido)* |

El resto (cierre) es igual al escenario 1. Distribución aplica en cualquier ciudad, no solo las de
cobertura completa.

## Escenario 3 — Cliente nuevo, ciudad sin cadena de frío completa

Igual al escenario 1 hasta la respuesta de ciudad:

| Quién | Mensaje |
|---|---|
| Cliente | *(toca "Otra ciudad", o escribe "Medellín")* |
| Bot | Por ahora solo tenemos cobertura con cadena de frío en Bogotá, Yopal y Villavicencio. Para tu ciudad podemos ofrecerte nuestros productos empaquetados. |
| Bot | ¿Buscas comprar al detal o eres distribuidor? *(botones: Detal / Distribución)* |

El resto continúa igual — la ciudad ya no determina qué catálogo se envía (ver
`docs/FLUJO_ESTADOS.md`), solo informa sobre disponibilidad.

## Escenario 4 — Cliente recurrente (ya registrado, con nombre guardado)

| Quién | Mensaje |
|---|---|
| Cliente | (escribe, cualquier texto) |
| Bot | ¡Hola de nuevo, María Fernández! ¿En qué te podemos ayudar hoy? *(botones: Servicio al cliente / Ventas)* |
| Cliente | *(toca "Ventas")* |
| Bot | ¿Desde qué ciudad nos escribes? *(no vuelve a pedir el nombre)* |

Continúa igual que el escenario 1 desde la respuesta de ciudad en adelante.

## Escenario 5 — Servicio al cliente (queja o reclamo)

| Quién | Mensaje |
|---|---|
| Cliente | (escribe, cualquier texto) |
| Bot | ¡Hola! Bienvenido/a a nuestra tienda de lácteos y derivados. ¿En qué te podemos ayudar? *(botones: Servicio al cliente / Ventas)* |
| Cliente | *(toca "Servicio al cliente")* |
| Bot | ¿En qué te podemos ayudar? *(botones: Quejas o reclamos)* |
| Cliente | *(toca "Quejas o reclamos")* |
| Bot | Cuéntanos qué pasó, con gusto te ayudamos. |
| Cliente | El pedido llegó incompleto |
| Bot | Gracias por contarnos. En breve te atiende alguien de nuestro equipo. |
| Bot → equipo *(mismo chat)* | 🔔 QUEJA/RECLAMO — María Fernández — El pedido llegó incompleto |

Nota: en esta rama **no se pide nombre ni ciudad** (decisión confirmada) — si el cliente es nuevo
y nunca dio su nombre, la notificación dice "Cliente sin nombre registrado".

## Mensajes inesperados (audio, imagen, sticker, video)

Varían el texto según el punto del flujo, pero siempre piden texto (o repiten el menú) sin perder
el progreso de la conversación — ver tabla completa en `docs/FLUJO_ESTADOS.md`.

## Opción no reconocida en un menú

Si el cliente escribe algo que no coincide con ninguna opción del menú actual, el bot responde
"No entendí esa opción, por favor elige una del menú:" y vuelve a mostrar las mismas opciones —
nunca se pierde ni avanza a un estado equivocado.

## Después del handoff

El bot no vuelve a responder en esa conversación — solo el equipo humano, desde la misma app de
WhatsApp — hasta que pasen 24 horas sin actividad, momento en el cual un nuevo mensaje del cliente
reinicia el flujo desde el saludo (`MENU_PRINCIPAL`).

## Qué falta para cerrar la aprobación

- [ ] Confirmar con el cliente si el tono (tuteo/formal, uso de emojis) es el deseado.
- [ ] Confirmar el texto exacto de bienvenida ("tienda de lácteos y derivados" — ¿usar el nombre
      comercial real del negocio en vez de una descripción genérica?).
- [ ] Confirmar el formato de las notificaciones al equipo (🔔 NUEVO CLIENTE / 🔔 QUEJA-RECLAMO).
- [ ] Confirmar que los menús (Reply Buttons y, para ciudad, List Message) se ven bien en la
      versión de WhatsApp del cliente promedio — el cliente puede seguir escribiendo si prefiere
      no usar el menú.
- [ ] Confirmar si "Servicio al cliente" tendrá más opciones además de "Quejas o reclamos" a
      futuro (el menú ya está preparado para agregarlas sin rediseñar el flujo).
- [ ] Formalizar este cambio de alcance frente a la cotización original (control de cambios).
