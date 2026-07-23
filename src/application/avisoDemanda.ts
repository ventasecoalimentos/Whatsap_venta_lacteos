import type { IConversacionRepository } from '../datos/tipos';
import type { IProveedorMensajeria } from '../mensajeria/tipos';

const MENSAJE_AVISO_DEMANDA =
  'Gracias por tu paciencia 🙏 En este momento tenemos mucha demanda, en breve te atiende alguien de nuestro equipo.';

// Tarea programada (ver src/index.ts): revisa conversaciones en HANDOFF_HUMANO calladas hace más
// de `umbralMs` sin aviso enviado, y les manda un mensaje de relleno. El bot no puede saber si el
// asesor humano ya respondió (la coexistencia de YCloud no expone al webhook los mensajes que el
// equipo manda desde la app normal de WhatsApp) — el aviso se dispara solo por silencio del
// cliente, que es la señal que sí tenemos disponible.
export async function ejecutarAvisoDemanda(
  conversacionRepositorio: IConversacionRepository,
  proveedorMensajeria: IProveedorMensajeria,
  umbralMs: number,
): Promise<void> {
  const pendientes = await conversacionRepositorio.listarParaAvisoDemanda(umbralMs);

  for (const { conversacionId, telefono } of pendientes) {
    try {
      await proveedorMensajeria.enviarTexto(telefono, MENSAJE_AVISO_DEMANDA);
      await conversacionRepositorio.marcarAvisoDemandaEnviado(conversacionId);
    } catch (error) {
      // Una falla puntual (ej. YCloud caído) no debe bloquear el aviso a las demás conversaciones
      // pendientes ni tumbar el proceso — se reintenta en el siguiente tick.
      console.error(`[avisoDemanda] error avisando a conversación ${conversacionId}:`, error);
    }
  }
}
