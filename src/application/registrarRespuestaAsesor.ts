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
import type { IdentificadorCliente } from '../dominio/identificadorCliente';
import { CLAVE_ASESOR_RESPONDIO } from '../motor/transiciones/desdeHandoff';

export class RegistrarRespuestaAsesor {
  constructor(
    private readonly clienteRepositorio: IClienteRepository,
    private readonly conversacionRepositorio: IConversacionRepository,
  ) {}

  async ejecutar(identificadorCliente: IdentificadorCliente): Promise<void> {
    const cliente = await this.clienteRepositorio.buscarPorIdentificador(identificadorCliente);
    if (!cliente) return;

    const conversacion = await this.conversacionRepositorio.obtenerOCrear(cliente.id);
    if (conversacion.estadoActual !== EstadoConversacion.HANDOFF_HUMANO) return;

    await this.conversacionRepositorio.actualizarContexto(conversacion.id, {
      ...conversacion.contexto,
      [CLAVE_ASESOR_RESPONDIO]: true,
    });
    await this.conversacionRepositorio.tocarActividad(conversacion.id);
  }
}
