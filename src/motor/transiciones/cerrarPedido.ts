// Compartido por CATALOGO_DETAL y CATALOGO_DISTRIB cuando el cliente elige "Continuar pedido" —
// va directo a HANDOFF_HUMANO sin preguntar qué producto busca (decisión del cliente: el asesor
// humano lo pregunta directamente al tomar la conversación). Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { ResultadoTransicion } from '../motorEstados';

const CIUDAD_POR_DEFECTO = 'Ciudad no especificada';

export function cerrarPedido(
  contexto: Record<string, unknown>,
  canal: 'detal' | 'distribucion',
): ResultadoTransicion {
  const ciudad = (contexto['ciudad'] as string | undefined) ?? CIUDAD_POR_DEFECTO;

  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [
      { tipo: 'texto', contenido: '¡Listo! 🙌\nEn un momento uno de nuestros asesores se comunica contigo para atender tu pedido.\n\n*¡Gracias por preferir Llano Lácteos!🐮🤠*' },
      { tipo: 'texto', contenido: '💬' },
    ],
    contextoParcheado: contexto,
    registro: { tipo: 'pedido', productoInteres: '', ciudad, canal },
  };
}
