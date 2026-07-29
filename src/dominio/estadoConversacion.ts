// Estados posibles de una conversación del bot (motor de estados determinista).
// Ver la tabla completa de transiciones en docs/FLUJO_ESTADOS.md.
export enum EstadoConversacion {
  INICIO = 'INICIO',
  // Solo se alcanza si el cliente aún no autorizó el tratamiento de datos (Ley 1581 de 2012) —
  // se repite en cada conversación nueva (o reinicio por inactividad) hasta que autorice una vez;
  // a partir de ahí no se vuelve a mostrar (ver desdeInicio.ts / desdeConsentimientoDatos.ts).
  ESPERANDO_CONSENTIMIENTO_DATOS = 'ESPERANDO_CONSENTIMIENTO_DATOS',
  MENU_PRINCIPAL = 'MENU_PRINCIPAL',
  SERVICIO_CLIENTE = 'SERVICIO_CLIENTE',
  // Clasificación del PQRSF (PQR vs Sugerencia/Felicitación) y datos, pedidos en secuencia antes
  // de la descripción (ESPERANDO_QUEJA) — ver desdeServicioCliente.ts.
  ESPERANDO_TIPO_PQRSF = 'ESPERANDO_TIPO_PQRSF',
  ESPERANDO_PQRSF_NOMBRE = 'ESPERANDO_PQRSF_NOMBRE',
  ESPERANDO_PQRSF_IDENTIFICACION = 'ESPERANDO_PQRSF_IDENTIFICACION',
  ESPERANDO_PQRSF_CORREO = 'ESPERANDO_PQRSF_CORREO',
  ESPERANDO_QUEJA = 'ESPERANDO_QUEJA',
  // Se pregunta justo después de responder el consentimiento de datos (autorice o no) — ya no se
  // sugiere el nombre de perfil de WhatsApp, se pregunta directo (ver desdeConsentimientoDatos.ts).
  ESPERANDO_NOMBRE = 'ESPERANDO_NOMBRE',
  // Ya no se pregunta ciudad (decisión del cliente: el asesor humano maneja la logística) — el
  // nombre lleva directo aquí. Un solo catálogo para las 3 categorías (ver opcionesMenuVentas.ts).
  MENU_VENTAS = 'MENU_VENTAS',
  // Reemplaza a los antiguos CATALOGO_DETAL/CATALOGO_DISTRIB — con un solo catálogo para las 3
  // categorías (Detal/Distribuidor/Negocio), el comportamiento posterior es idéntico sin importar
  // cuál se eligió, así que es un solo estado (el canal elegido vive en el contexto).
  CATALOGO_ENVIADO = 'CATALOGO_ENVIADO',
  // Terminal: bot en silencio, el humano responde por coexistencia. Equivale a "RESPUESTA_HUMANA"
  // en el diagrama de flujo que aprobó el cliente — se conserva este nombre interno para no
  // renombrar todo el código/tests ya construidos (mismo concepto).
  HANDOFF_HUMANO = 'HANDOFF_HUMANO',
}
