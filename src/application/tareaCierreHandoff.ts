// Tarea programada: revisa periódicamente dos grupos de conversaciones y envía el aviso previo y
// el mensaje de cierre automático según el tiempo transcurrido sin actividad — ver
// decidirAccionCierreHandoff.ts para la lógica pura y docs/FLUJO_ESTADOS.md para el comportamiento
// completo. A diferencia del resto del bot (100% reactivo a mensajes entrantes), esta es la única
// tarea de fondo del proyecto:
//
// 1. Conversaciones en HANDOFF_HUMANO donde el asesor YA respondió al menos una vez
//    (contexto.asesorRespondio) — mientras el asesor no haya respondido, no hay límite de tiempo
//    ni cierre automático (el equipo no tiene SLA, puede tardar en atender — ver CLAUDE.md).
// 2. Conversaciones "en progreso": a medias de un menú del bot (ni INICIO ni HANDOFF_HUMANO), que
//    el cliente abandonó sin volver a escribir. Antes de esto solo existía el reinicio reactivo
//    (que solo actúa SI el cliente escribe de nuevo algún día) — esta tarea cierra proactivamente
//    aunque el cliente nunca vuelva.
import { EstadoConversacion } from '../dominio/estadoConversacion';
import type { Conversacion, IClienteRepository, IConversacionRepository } from '../datos/tipos';
import type { IProveedorMensajeria } from '../mensajeria/tipos';
import { decidirAccionCierreHandoff, CLAVE_AVISO_ENVIADO } from './decidirAccionCierreHandoff';
import { MENSAJE_AVISO_PREVIO_CIERRE } from './mensajeAvisoPrevioCierre';
import { MENSAJE_CIERRE_HANDOFF } from './mensajeCierreHandoff';
import { CLAVE_ASESOR_RESPONDIO } from '../motor/transiciones/desdeHandoff';

export class TareaCierreHandoff {
  constructor(
    private readonly conversacionRepositorio: IConversacionRepository,
    private readonly clienteRepositorio: IClienteRepository,
    private readonly proveedorMensajeria: IProveedorMensajeria,
    private readonly ventanaInactividadMin: number,
    private readonly avisoPrevioMin: number,
  ) {}

  async ejecutarUnaVez(): Promise<void> {
    const ahora = new Date();

    const enHandoff = await this.conversacionRepositorio.listarPorEstado(EstadoConversacion.HANDOFF_HUMANO);
    for (const conversacion of enHandoff) {
      // El asesor no ha respondido todavía: sin límite de tiempo, no se evalúa cierre (ver
      // comentario del encabezado).
      if (conversacion.contexto[CLAVE_ASESOR_RESPONDIO] !== true) continue;
      await this.procesarConversacion(conversacion, ahora);
    }

    const enProgreso = await this.conversacionRepositorio.listarEnProgreso();
    for (const conversacion of enProgreso) {
      await this.procesarConversacion(conversacion, ahora);
    }
  }

  private async procesarConversacion(conversacion: Conversacion, ahora: Date): Promise<void> {
    const accion = decidirAccionCierreHandoff(conversacion, ahora, this.ventanaInactividadMin, this.avisoPrevioMin);
    if (accion.tipo === 'ninguna') return;

    const cliente = await this.clienteRepositorio.buscarPorId(conversacion.clienteId);
    if (!cliente) return;

    if (accion.tipo === 'aviso_previo') {
      await this.proveedorMensajeria.enviarTexto(cliente.telefono, MENSAJE_AVISO_PREVIO_CIERRE);
      await this.conversacionRepositorio.actualizarContexto(conversacion.id, accion.contextoActualizado);
      return;
    }

    // Limpia las marcas de este ciclo (aviso previo ya enviado, asesor ya respondió) antes de
    // resetear — si no, se arrastrarían a una futura conversación de este mismo cliente: el aviso
    // previo se autocorrige solo (compara contra actualizada_en), pero asesorRespondio no tiene esa
    // protección y dejaría el aviso de "mucha demanda" apagado para siempre en un futuro handoff.
    const contextoLimpio = { ...conversacion.contexto };
    delete contextoLimpio[CLAVE_AVISO_ENVIADO];
    delete contextoLimpio[CLAVE_ASESOR_RESPONDIO];
    await this.proveedorMensajeria.enviarTexto(cliente.telefono, MENSAJE_CIERRE_HANDOFF);
    await this.conversacionRepositorio.actualizarEstado(conversacion.id, EstadoConversacion.INICIO, contextoLimpio);
  }

  iniciar(intervaloMs: number): NodeJS.Timeout {
    return setInterval(() => {
      this.ejecutarUnaVez().catch((error: unknown) => {
        console.error('[tareaCierreHandoff] error revisando conversaciones en handoff:', error);
      });
    }, intervaloMs);
  }
}
