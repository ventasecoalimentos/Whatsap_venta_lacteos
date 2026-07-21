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
  // Solo se alcanza si WhatsApp trae un nombre de perfil para el cliente nuevo — le ofrece usarlo
  // o escribir uno distinto, en vez de preguntar directamente (ver desdeMenuPrincipal.ts).
  CONFIRMAR_NOMBRE_PERFIL = 'CONFIRMAR_NOMBRE_PERFIL',
  ESPERANDO_NOMBRE = 'ESPERANDO_NOMBRE',
  ESPERANDO_CIUDAD = 'ESPERANDO_CIUDAD',
  MENU_VENTAS = 'MENU_VENTAS',
  CATALOGO_DETAL = 'CATALOGO_DETAL',
  CATALOGO_DISTRIB = 'CATALOGO_DISTRIB',
  // Terminal: bot en silencio, el humano responde por coexistencia. Equivale a "RESPUESTA_HUMANA"
  // en el diagrama de flujo que aprobó el cliente — se conserva este nombre interno para no
  // renombrar todo el código/tests ya construidos (mismo concepto).
  HANDOFF_HUMANO = 'HANDOFF_HUMANO',
}
