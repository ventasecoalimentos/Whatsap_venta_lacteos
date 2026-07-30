// Compartido por CATALOGO_ENVIADO cuando el cliente elige "Continuar pedido" — va directo a
// HANDOFF_HUMANO sin preguntar qué producto busca ni la ciudad (decisión del cliente: el asesor
// humano lo pregunta directamente y maneja la logística al tomar la conversación). Ver
// docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { ResultadoTransicion } from '../motorEstados';

const ETIQUETA_CANAL: Record<'detal' | 'distribucion' | 'negocio', string> = {
  detal: 'Detal',
  distribucion: 'Distribuidor',
  negocio: 'Negocio',
};
const NOMBRE_POR_DEFECTO = 'Cliente sin nombre registrado';

export function cerrarPedido(
  contexto: Record<string, unknown>,
  canal: 'detal' | 'distribucion' | 'negocio',
  nombreCliente: string | null,
): ResultadoTransicion {
  const nombre = nombreCliente ?? (contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;
  // Tarjeta resumen para que el asesor no tenga que subir en el chat a buscar los datos — ver
  // docs/FLUJO_ESTADOS.md.
  const resumen = `📦 *Resumen del pedido*\nCliente: ${nombre}\nCanal: ${ETIQUETA_CANAL[canal]}`;

  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [
      { tipo: 'texto', contenido: '¡Listo! 🙌\nEn un momento uno de nuestros asesores se comunica contigo para atender tu pedido.\n\n*¡Gracias por preferir Llano Lácteos!🐮🤠*' },
      { tipo: 'texto', contenido: resumen },
    ],
    contextoParcheado: contexto,
    registro: { tipo: 'pedido', productoInteres: '', canal },
  };
}
