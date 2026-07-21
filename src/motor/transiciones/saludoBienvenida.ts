// Compartido por desdeInicio.ts y desdeConsentimientoDatos.ts — mismo saludo con el que se abre
// MENU_PRINCIPAL, sea que se llegue ahí directo (consentimiento ya dado) o justo después de
// responder al consentimiento de datos.
export function construirSaludoBienvenida(
  clienteYaTieneNombre: boolean,
  nombreCliente: string | null,
): string {
  return clienteYaTieneNombre
    ? `¡Hola de nuevo, ${nombreCliente}!
  \nBienvenido a *Llano Lácteos S.A.S* 🐮🤠.\n¿En qué te podemos ayudar?`
    : '¡Hola! 👋\n Bienvenido a *Llano Lácteos S.A.S* 🐮🤠 \n _Lácteos y derivados._\n\n ¿En qué te podemos ayudar?';
}
