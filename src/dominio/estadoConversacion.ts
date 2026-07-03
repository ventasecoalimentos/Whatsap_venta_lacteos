// Estados posibles de una conversación del bot (motor de estados determinista).
// Ver la tabla completa de transiciones en docs/FLUJO_ESTADOS.md.
export enum EstadoConversacion {
  INICIO = 'INICIO',
  ESPERANDO_NOMBRE = 'ESPERANDO_NOMBRE',
  ESPERANDO_CIUDAD = 'ESPERANDO_CIUDAD',
  CATALOGO_ENVIADO = 'CATALOGO_ENVIADO',
  ESPERANDO_INTERES = 'ESPERANDO_INTERES',
  HANDOFF_HUMANO = 'HANDOFF_HUMANO',
}
