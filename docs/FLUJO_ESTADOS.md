# Flujo de estados del bot

Motor de estados determinista. Sin IA. Es una función pura:

```
procesarTransicion(entrada: EntradaMotor) → ResultadoTransicion
```

`EntradaMotor` es un único objeto con los campos `estadoActual`, `mensajeTexto`, `contexto`,
`clienteYaTieneNombre`, `nombreCliente`, `nombrePerfilWhatsApp` y `huboInactividad`;
`ResultadoTransicion` trae
`nuevoEstado`, `respuestas` (plural — un turno puede generar más de un mensaje), `contextoParcheado`
y `registro` (qué debe persistir el caso de uso al llegar a handoff: un pedido, una queja, o nada).
**La firma completa y autoritativa vive en `docs/CONTRATOS.md`** — este documento solo describe el
comportamiento de cada transición, no repite la firma en detalle.

## Origen de este flujo

Este es el flujo ampliado que el cliente (Ecoalimentos del Llano / Paula) aprobó a partir de un
diagrama de estados que compartió, con dos ramas desde un menú principal: **Servicio al cliente**
(quejas/reclamos) y **Ventas** (el flujo de captura de datos + interés que ya existía, ahora con
una distinción adicional Detal/Distribución). Es un cambio de alcance real frente a la cotización
original (`Cotizacion_Fase1.pdf`) — debe formalizarse como control de cambios aparte, no queda
implícito en este documento.

## Regla de reinicio por inactividad (decidida — no cron)

Antes de invocar el motor, el caso de uso (`application/procesarMensajeEntrante.ts`) calcula
`huboInactividad = (ahora - conversacion.actualizada_en) > ventana`, donde la ventana es
configurable vía `VENTANA_INACTIVIDAD_HORAS` (env, default `24` — ver `docs/VARIABLES_ENTORNO.md`).

- Si `huboInactividad === true` y `estadoActual !== 'INICIO'` → el motor ignora el estado guardado
  y trata el mensaje como si viniera de `INICIO` (`desdeInicio`, que siempre lleva a
  `MENU_PRINCIPAL`, con saludo genérico o personalizado según si el cliente ya tiene nombre).
- Esto reemplaza cualquier mecanismo de cron: se resuelve de forma perezosa en cada mensaje
  entrante, así que sobrevive reinicios del servidor sin estado adicional.
- El motor en sí no consulta la hora ni la BD — recibe `huboInactividad` ya calculado como
  parámetro (se mantiene puro).
- El valor de 24h en producción corresponde a la ventana real de mensajería libre de WhatsApp — no
  bajarlo en producción sin motivo. Se puede bajar libremente en `.env` local para probar más
  rápido durante desarrollo.

## Diagrama de estados

```
INICIO ──(saludo)──> MENU_PRINCIPAL ──┬─(Servicio al cliente)─> SERVICIO_CLIENTE ─(Quejas)─> ESPERANDO_QUEJA ─(texto)─> HANDOFF_HUMANO
                                       │
                                       └─(Ventas)─┬─(sin nombre, hay nombrePerfilWhatsApp)─> CONFIRMAR_NOMBRE_PERFIL ─┬─(usar este)────> ESPERANDO_CIUDAD
                                                  │                                                                  └─(escribir otro)─> ESPERANDO_NOMBRE ─> ESPERANDO_CIUDAD
                                                  ├─(sin nombre, sin nombrePerfilWhatsApp)──> ESPERANDO_NOMBRE ─> ESPERANDO_CIUDAD
                                                  └─(ya tiene nombre)───────────────────────────────────────────────────────────────> ESPERANDO_CIUDAD

ESPERANDO_CIUDAD ─> MENU_VENTAS ─┬─(Detal)────────> CATALOGO_DETAL   ─(Continuar pedido)─> HANDOFF_HUMANO
                                 └─(Distribución)─> CATALOGO_DISTRIB ─(Continuar pedido)─> HANDOFF_HUMANO
```

`HANDOFF_HUMANO` es terminal (self-loop en silencio) hasta reinicio por inactividad.

## Tabla de transiciones

| Estado origen | Condición del input | Estado destino | Respuesta del bot | Efecto en contexto/BD |
|---|---|---|---|---|
| `INICIO` | cualquier texto | `MENU_PRINCIPAL` | Saludo genérico (nuevo) o personalizado con `nombreCliente` (recurrente) + **Reply Buttons**: "Servicio al cliente" / "Ventas" | — |
| `MENU_PRINCIPAL` | selección "Servicio al cliente" | `SERVICIO_CLIENTE` | Reply Buttons con opciones de servicio (hoy: "Quejas o reclamos") | — |
| `MENU_PRINCIPAL` | selección "Ventas", cliente sin nombre, **sin** `nombrePerfilWhatsApp` | `ESPERANDO_NOMBRE` | "Para atenderte, ¿cuál es tu nombre?" | — |
| `MENU_PRINCIPAL` | selección "Ventas", cliente sin nombre, **con** `nombrePerfilWhatsApp` | `CONFIRMAR_NOMBRE_PERFIL` | "¡Hola, {nombre de perfil}! ¿Te puedo llamar así, o prefieres escribir tu nombre?" (Reply Buttons) | `contexto.nombrePerfilWhatsApp` guardado (respaldo) |
| `MENU_PRINCIPAL` | selección "Ventas", cliente ya tiene nombre | `ESPERANDO_CIUDAD` | List Message de ciudad (salta captura de nombre) | — |
| `MENU_PRINCIPAL` | opción no reconocida | `MENU_PRINCIPAL` (mismo estado) | "No entendí esa opción" + reenvía el menú (Reply Buttons) | — |
| `SERVICIO_CLIENTE` | selección "Quejas o reclamos" | `ESPERANDO_QUEJA` | "Cuéntanos qué pasó" | — |
| `ESPERANDO_QUEJA` | texto libre (se guarda tal cual) | `HANDOFF_HUMANO` | Cierre + notificación al equipo (ver abajo) | Crear registro en `quejas` (`descripcion`) |
| `CONFIRMAR_NOMBRE_PERFIL` | selección "Usar este nombre" | `ESPERANDO_CIUDAD` | "¡Un gusto, {nombre}!" + List Message de ciudad | Guardar `nombre` (de perfil) en `clientes` |
| `CONFIRMAR_NOMBRE_PERFIL` | selección "Escribir otro" | `ESPERANDO_NOMBRE` | "Para atenderte, ¿cuál es tu nombre?" | — |
| `CONFIRMAR_NOMBRE_PERFIL` | opción no reconocida | mismo estado | "No entendí esa opción" + reenvía el menú | — |
| `ESPERANDO_NOMBRE` | texto libre (se usa tal cual como nombre) | `ESPERANDO_CIUDAD` | Confirmar nombre + List Message de ciudad | Guardar `nombre` en `clientes` |
| `ESPERANDO_CIUDAD` | selección del menú o texto libre → `parsearCiudad()` | `MENU_VENTAS` | Texto informativo (cobertura completa u productos empaquetados según ciudad) + Reply Buttons "Detal" / "Distribución" | Guardar `ciudad` en `clientes` |
| `MENU_VENTAS` | selección "Detal" | `CATALOGO_DETAL` | Envía catálogo al detal (documento) + Reply Buttons "Menú anterior" / "Continuar pedido", con texto "¿Seguimos con tu pedido?" + aviso de "escribe 1" | `contexto.canal = 'detal'` |
| `MENU_VENTAS` | selección "Distribución" | `CATALOGO_DISTRIB` | Envía catálogo de distribución + condiciones mayoristas (texto) + mismos Reply Buttons que Detal | `contexto.canal = 'distribucion'` |
| `CATALOGO_DETAL` / `CATALOGO_DISTRIB` | selección "Menú anterior" (botón, id `'1'`) o texto libre `"1"` | `MENU_PRINCIPAL` | "¡Claro(, {nombre})! ¿En qué más te podemos ayudar?" + Reply Buttons de menú principal | — |
| `CATALOGO_DETAL` / `CATALOGO_DISTRIB` | selección "Continuar pedido" | `HANDOFF_HUMANO` | Mensaje de cierre ("¡Listo! 🙌...") + "💬" (simula que el equipo ya está escribiendo); **no** se envía notificación destacada | Crear registro en `pedidos` (`ciudad`, `canal`; `producto_interes` queda vacío — ya no se pregunta, el asesor humano lo consulta directamente) |
| `HANDOFF_HUMANO` | cualquier texto (sin inactividad) | `HANDOFF_HUMANO` | El bot no responde nada (silencio) | — |
| cualquier estado | `huboInactividad === true` y `estadoActual !== INICIO` | `MENU_PRINCIPAL` | Igual que el flujo `INICIO` | Se trata como reinicio de conversación |

Nota sobre `parsearCiudad`: siempre devuelve un valor válido (`Ciudad.OTRA` como catch-all), por lo
que `ESPERANDO_CIUDAD` nunca queda en loop de "no entendí" — cualquier texto avanza el flujo.

## Menús: Reply Buttons o List Message (decidido — no texto libre)

Para evitar datos sucios (ej. "bogota", "btá", "kesito mozarela"), las preguntas de respuesta
cerrada usan mensajes interactivos de WhatsApp en vez de texto libre — pero no todas el mismo
tipo, por una restricción real de la plataforma:

- **Reply Buttons** (`RespuestaBot` tipo `'botones'`): `MENU_PRINCIPAL`, `SERVICIO_CLIENTE`,
  `MENU_VENTAS`, `CATALOGO_DETAL`/`CATALOGO_DISTRIB` — todos con **2-3 opciones**. Un solo toque,
  sin abrir un menú aparte — mejor UX. WhatsApp limita esto a **máximo 3 botones**, título de cada
  uno máx. 20 caracteres.
- **List Message** (`RespuestaBot` tipo `'lista'`): solo `ESPERANDO_CIUDAD`, porque tiene **4
  opciones** (Bogotá/Yopal/Villavicencio/Otra) — supera el límite de 3 de los botones. Título de
  cada fila máx. 24 caracteres, y cada sección requiere un `title` (ver
  `src/mensajeria/ycloudProveedor.ts`).

Ambos tipos comparten el mismo mecanismo de selección: el `id` de la opción elegida vuelve como
`mensajeTexto` (la Parte 3 lo mapea igual desde `list_reply`/`button_reply` en el webhook — ver
`docs/INTEGRACION_YCLOUD.md`), así que el motor no distingue entre los dos al procesar la
respuesta.

- **Ciudad**: el `id` de cada opción es igual al valor del enum `Ciudad` (ej. `"Bogotá"`), así que
  `parsearCiudad()` lo reconoce sin cambios — mismo camino que el texto libre.
- **Los demás menús** (principal, servicio, ventas, catálogo) usan `buscarOpcionSeleccionada()`
  (`src/motor/transiciones/seleccionDeLista.ts`), que compara por `id` o `titulo` sin distinguir
  mayúsculas — si el cliente escribe algo que no coincide con ninguna opción, el bot repite el
  mismo menú con un mensaje corto de "no entendí" en vez de perderse.
- El cliente **siempre puede escribir en vez de tocar el menú** — ningún camino queda bloqueado
  esperando exclusivamente una interacción táctil.
- **Ya no se pregunta qué producto busca el cliente** (decisión del cliente: el bot pasa directo de
  "Continuar pedido" al cierre + handoff). Esto se aparta de lo que describe `CLAUDE.md` en la raíz
  del repo ("Captura de interés: preguntar qué producto busca") — ese documento queda desactualizado
  en este punto y debería actualizarse aparte. `pedidos.producto_interes` queda vacío en estos
  registros; el asesor humano pregunta el producto directamente al tomar la conversación.
- Si algún menú de botones llegara a necesitar una 4ª opción en el futuro, hay que migrarlo a
  `'lista'` — no caben más de 3 en Reply Buttons.

## Catálogos: Detal vs. Distribución (reemplaza la distinción por cobertura)

Antes había 2 catálogos según cobertura de ciudad (completo/reducido). Ahora hay **2 catálogos
según canal**: `CATALOGO_DETAL_URL` (venta al por menor) y `CATALOGO_DISTRIBUCION_URL` (venta al
por mayor) — confirmado con el cliente, aplica en cualquier ciudad. La ciudad se sigue capturando y
guardando (útil para logística y para el mensaje de notificación) pero **ya no determina** qué
catálogo se envía.

## Mensajes inesperados (audio, imagen, sticker, video)

En cualquier estado que no sea `HANDOFF_HUMANO`: si el mensaje entrante no es texto, la transición
correspondiente devuelve el **mismo estado** (`nuevoEstado === estadoActual`) con una respuesta
genérica pidiendo texto (o repitiendo el menú, en los estados que preguntan vía lista). No se
pierde el progreso de la conversación.

En `HANDOFF_HUMANO`: se ignora igual que cualquier otro mensaje (silencio total del bot).

## Notificaciones al equipo

La rama de quejas dispara un mensaje de texto **en el mismo hilo de WhatsApp del cliente** (no un
chat separado) al llegar a `HANDOFF_HUMANO`:

```
🔔 QUEJA/RECLAMO — [Nombre] — [descripción]
```

La rama de Ventas (`CATALOGO_DETAL`/`CATALOGO_DISTRIB` → "Continuar pedido") **ya no envía** un
mensaje destacado equivalente — decisión del cliente (ver nota en la sección de decisiones más
abajo). El equipo se entera del pedido leyendo la conversación normal en el mismo chat
(coexistencia), no por un mensaje resaltado aparte.

## Condición de "conversación activa" (simplificada)

Una sola fila en `conversaciones` por `cliente_id`, reutilizada indefinidamente (upsert, no buscar
"la activa entre varias"). El reinicio por inactividad resetea `estado_actual` sobre esa misma fila
en vez de crear una nueva.
