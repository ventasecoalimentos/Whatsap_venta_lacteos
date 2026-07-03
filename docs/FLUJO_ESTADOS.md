# Flujo de estados del bot

Motor de estados determinista. Sin IA. Es una función pura:

```
procesarTransicion(estadoActual, mensajeTexto, contexto, huboInactividad)
  → { nuevoEstado, respuesta, contextoParcheado, debeNotificarEquipo }
```

Ver la firma exacta en `docs/CONTRATOS.md`.

## Regla de reinicio por inactividad (decidida — no cron)

Antes de invocar el motor, el caso de uso (`application/procesarMensajeEntrante.ts`, Parte 3)
calcula `huboInactividad = (ahora - conversacion.actualizada_en) > 24h`.

- Si `huboInactividad === true` y `estadoActual !== 'INICIO'` → el motor ignora el estado
  guardado, trata el mensaje como si viniera de `INICIO` y devuelve `nuevoEstado = ESPERANDO_NOMBRE`
  o `ESPERANDO_CIUDAD` según si el cliente ya tiene `nombre` guardado (ver tabla abajo).
- Esto reemplaza cualquier mecanismo de cron: se resuelve de forma perezosa en cada mensaje
  entrante, así que sobrevive reinicios del servidor sin estado adicional.
- El motor en sí no consulta la hora ni la BD — recibe `huboInactividad` ya calculado como
  parámetro (se mantiene puro).

## Tabla de transiciones

| Estado origen | Condición del input | Estado destino | Respuesta del bot | Efecto en contexto/BD |
|---|---|---|---|---|
| `INICIO` (cliente nuevo, `nombre === null`) | cualquier texto | `ESPERANDO_NOMBRE` | Saludo genérico de bienvenida + pedir nombre | — |
| `INICIO` (cliente existente, `nombre !== null`) | cualquier texto | `ESPERANDO_CIUDAD` | Saludo personalizado con nombre + pedir ciudad | — |
| `ESPERANDO_NOMBRE` | texto libre (se usa tal cual como nombre) | `ESPERANDO_CIUDAD` | Confirmar nombre + pedir ciudad | Guardar `nombre` en `clientes` |
| `ESPERANDO_CIUDAD` | texto → `parsearCiudad()` resuelve Bogotá/Yopal/Villavicencio | `CATALOGO_ENVIADO` | Enviar catálogo completo (documento) | Guardar `ciudad` en `clientes` |
| `ESPERANDO_CIUDAD` | texto → `parsearCiudad()` no coincide (`Ciudad.OTRA`) | `CATALOGO_ENVIADO` | Explicar cobertura limitada + enviar catálogo reducido | Guardar `ciudad` en `clientes` |
| `CATALOGO_ENVIADO` | cualquier texto | `ESPERANDO_INTERES` | Preguntar qué producto busca | — |
| `ESPERANDO_INTERES` | texto libre (se guarda tal cual) | `HANDOFF_HUMANO` | "En breve te atiende alguien del equipo" + notificación destacada en el mismo hilo | Crear registro en `pedidos` (`producto_interes`, `ciudad`); `debeNotificarEquipo = true` |
| `HANDOFF_HUMANO` | cualquier texto (sin inactividad) | `HANDOFF_HUMANO` | El bot no responde nada (silencio) | — |
| cualquier estado | `huboInactividad === true` y `estadoActual !== INICIO` | `ESPERANDO_NOMBRE` o `ESPERANDO_CIUDAD` (según tenga nombre) | Igual que el flujo `INICIO` correspondiente | Se trata como reinicio de conversación |

Nota sobre `parsearCiudad`: siempre devuelve un valor válido (`Ciudad.OTRA` como catch-all), por
lo que `ESPERANDO_CIUDAD` nunca queda en loop de "no entendí" — cualquier texto avanza el flujo.

## Mensajes inesperados (audio, imagen, sticker, video)

En cualquier estado que no sea `HANDOFF_HUMANO`: si el mensaje entrante no es texto, la
transición correspondiente devuelve el **mismo estado** (`nuevoEstado === estadoActual`) con una
respuesta genérica pidiendo texto. No se pierde el progreso de la conversación.

En `HANDOFF_HUMANO`: se ignora igual que cualquier otro mensaje (silencio total del bot).

## Notificación al equipo

Se dispara únicamente en la transición `ESPERANDO_INTERES → HANDOFF_HUMANO`. Es un mensaje de
texto **en el mismo hilo de WhatsApp del cliente** (no un chat separado) con el formato:

```
🔔 NUEVO CLIENTE — [Nombre] | [Ciudad] | Interés: [producto]
```

Esto funciona porque el número tiene coexistencia con la app normal de WhatsApp: el equipo
humano ve este mensaje resaltado dentro del mismo chat cuando abre la app y puede responder
directamente ahí, tomando la conversación.

## Condición de "conversación activa" (simplificada)

Una sola fila en `conversaciones` por `cliente_id`, reutilizada indefinidamente (upsert, no
buscar "la activa entre varias"). El reinicio por inactividad resetea `estado_actual` sobre esa
misma fila en vez de crear una nueva.
