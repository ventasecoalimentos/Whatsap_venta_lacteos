// Usado por desdeInicio.ts para el saludo con el que se abre MENU_PRINCIPAL cuando el cliente ya
// tiene nombre y ya autorizó el tratamiento de datos (cliente recurrente que vuelve a escribir).
export function construirSaludoBienvenida(
  clienteYaTieneNombre: boolean,
  nombreCliente: string | null,
): string {
  return clienteYaTieneNombre
    ? `¡Hola de nuevo, ${nombreCliente}! 👋🏻 \n\n Bienvenido nuevamente al Centro de Ventas y Servicios de Llano Lácteos 🐮❤️💚, qué bueno tenerte de vuelta.\n\n¿En qué te podemos ayudar?`
    : 'Hola 👋🏻, ¿cómo estás? \n\n Bienvenido al Centro de Ventas y Servicios de Llano Lácteos 🐮❤️💚\nEstamos felices de que estés aquí con nosotros. ';
}
