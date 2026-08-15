// Compartido por CATALOGO_ENVIADO cuando el cliente elige "Continuar pedido" — va directo a
// HANDOFF_HUMANO sin preguntar qué producto busca ni la ciudad (decisión del cliente: el asesor
// humano lo pregunta directamente y maneja la logística al tomar la conversación). Ver
// docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { ResultadoTransicion } from '../motorEstados';

export function cerrarPedido(
  contexto: Record<string, unknown>,
  canal: 'detal' | 'distribucion' | 'negocio',
): ResultadoTransicion {
  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [
      { tipo: 'texto', contenido: '¡Listo! 🙌\nEn un momento uno de nuestros asesores se comunica contigo para atender tu pedido.\n\n*¡Gracias por preferir Llano Lácteos!🐮🤠*' },
    ],
    contextoParcheado: contexto,
    registro: { tipo: 'pedido', productoInteres: '', canal },
  };
}
