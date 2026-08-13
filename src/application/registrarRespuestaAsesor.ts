// Caso de uso disparado por el evento whatsapp.smb.message.echoes de YCloud (ver
// mapeoYCloud.ts::mapearEventoEcoAsesor) — el asesor le respondió a un cliente desde la app nativa
// de WhatsApp, fuera del bot. Ese evento llega para CUALQUIER mensaje que el equipo mande desde la
// app (no solo a clientes en HANDOFF_HUMANO, ni siquiera solo a clientes del bot), así que este
// caso de uso solo actúa cuando el destinatario es un cliente conocido cuya conversación sigue en
// HANDOFF_HUMANO — en cualquier otro caso lo ignora en silencio.
//
// A diferencia de ProcesarMensajeEntrante, no toca el motor de estados: el mensaje del asesor no
// es una transición. Dos efectos:
// 1. Renueva el reloj de inactividad (tocarActividad, ver datos/tipos.ts) para que aplace el
//    cierre automático igual que lo hace un mensaje del cliente.
// 2. Marca `contexto.asesorRespondio = true` — desdeHandoff.ts lo usa para dejar de mandar el
//    aviso de "mucha demanda" en cada mensaje del cliente una vez que el asesor ya está
//    respondiendo directamente (no tiene sentido seguir avisando "en breve te atendemos" si ya lo
//    están atendiendo). tareaCierreHandoff.ts limpia esta marca al cerrar, para que no se arrastre
//    a un futuro handoff de la misma conversación.
import { EstadoConversacion } from '../dominio/estadoConversacion';
import type { IClienteRepository, IConversacionRepository } from '../datos/tipos';
import { CLAVE_ASESOR_RESPONDIO } from '../motor/transiciones/desdeHandoff';

export class RegistrarRespuestaAsesor {
  constructor(
    private readonly clienteRepositorio: IClienteRepository,
    private readonly conversacionRepositorio: IConversacionRepository,
  ) {}

  async ejecutar(telefonoCliente: string): Promise<void> {
    // DIAGNÓSTICO TEMPORAL — quitar una vez confirmado que el flujo llega hasta el final.
    console.log('[registrarRespuestaAsesor] ejecutar, telefonoCliente=', telefonoCliente);

    const cliente = await this.clienteRepositorio.buscarPorTelefono(telefonoCliente);
    if (!cliente) {
      console.log('[registrarRespuestaAsesor] no se encontró cliente con ese teléfono, se ignora');
      return;
    }

    const conversacion = await this.conversacionRepositorio.obtenerOCrear(cliente.id);
    console.log('[registrarRespuestaAsesor] cliente.id=', cliente.id, 'estadoActual=', conversacion.estadoActual);
    if (conversacion.estadoActual !== EstadoConversacion.HANDOFF_HUMANO) {
      console.log('[registrarRespuestaAsesor] conversación no está en HANDOFF_HUMANO, se ignora');
      return;
    }

    await this.conversacionRepositorio.actualizarContexto(conversacion.id, {
      ...conversacion.contexto,
      [CLAVE_ASESOR_RESPONDIO]: true,
    });
    await this.conversacionRepositorio.tocarActividad(conversacion.id);
    console.log('[registrarRespuestaAsesor] marcado asesorRespondio=true y actividad renovada para conversacion.id=', conversacion.id);
  }
}
