// Tarea programada: revisa periódicamente las conversaciones en HANDOFF_HUMANO y envía el aviso
// previo y el mensaje de cierre automático según el tiempo transcurrido desde el último mensaje
// del cliente — ver decidirAccionCierreHandoff.ts para la lógica pura y docs/FLUJO_ESTADOS.md
// para el comportamiento completo. A diferencia del resto del bot (100% reactivo a mensajes
// entrantes), esta es la única tarea de fondo del proyecto — necesaria porque el aviso y el
// cierre deben llegar aunque el cliente no vuelva a escribir.
import { EstadoConversacion } from '../dominio/estadoConversacion';
import type { IClienteRepository, IConversacionRepository } from '../datos/tipos';
import type { IProveedorMensajeria } from '../mensajeria/tipos';
import { decidirAccionCierreHandoff } from './decidirAccionCierreHandoff';
import { MENSAJE_AVISO_PREVIO_CIERRE } from './mensajeAvisoPrevioCierre';
import { MENSAJE_CIERRE_HANDOFF } from './mensajeCierreHandoff';

export class TareaCierreHandoff {
  constructor(
    private readonly conversacionRepositorio: IConversacionRepository,
    private readonly clienteRepositorio: IClienteRepository,
    private readonly proveedorMensajeria: IProveedorMensajeria,
    private readonly ventanaInactividadMin: number,
    private readonly avisoPrevioMin: number,
  ) {}

  async ejecutarUnaVez(): Promise<void> {
    const conversaciones = await this.conversacionRepositorio.listarPorEstado(
      EstadoConversacion.HANDOFF_HUMANO,
    );
    const ahora = new Date();

    for (const conversacion of conversaciones) {
      const accion = decidirAccionCierreHandoff(
        conversacion,
        ahora,
        this.ventanaInactividadMin,
        this.avisoPrevioMin,
      );
      if (accion.tipo === 'ninguna') continue;

      const cliente = await this.clienteRepositorio.buscarPorId(conversacion.clienteId);
      if (!cliente) continue;

      if (accion.tipo === 'aviso_previo') {
        await this.proveedorMensajeria.enviarTexto(cliente.telefono, MENSAJE_AVISO_PREVIO_CIERRE);
        await this.conversacionRepositorio.actualizarContexto(conversacion.id, accion.contextoActualizado);
      } else {
        await this.proveedorMensajeria.enviarTexto(cliente.telefono, MENSAJE_CIERRE_HANDOFF);
        await this.conversacionRepositorio.actualizarEstado(
          conversacion.id,
          EstadoConversacion.INICIO,
          conversacion.contexto,
        );
      }
    }
  }

  iniciar(intervaloMs: number): NodeJS.Timeout {
    return setInterval(() => {
      this.ejecutarUnaVez().catch((error: unknown) => {
        console.error('[tareaCierreHandoff] error revisando conversaciones en handoff:', error);
      });
    }, intervaloMs);
  }
}
