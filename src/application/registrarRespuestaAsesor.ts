// Caso de uso disparado por el evento whatsapp.smb.message.echoes de YCloud (ver
// mapeoYCloud.ts::mapearEventoEcoAsesor) — el asesor le respondió a un cliente desde la app nativa
// de WhatsApp, fuera del bot. Ese evento llega para CUALQUIER mensaje que el equipo mande desde la
// app (no solo a clientes en HANDOFF_HUMANO, ni siquiera solo a clientes del bot), así que este
// caso de uso solo actúa cuando el destinatario es un cliente conocido del bot — si no, lo ignora
// en silencio.
//
// Regla: si el asesor escribe en un chat, el bot se calla en ese chat. Si la conversación NO está
// en HANDOFF_HUMANO (el cliente salió con el botón "Menú principal" del aviso de demanda, ver
// desdeHandoff.ts, o el asesor le escribió por su cuenta a mitad de un menú), se devuelve a
// HANDOFF_HUMANO — si no, la siguiente respuesta del cliente al asesor la procesaría el menú del
// bot ("No entendí esa opción...") y el bot se metería en la conversación. Desde ahí aplica el
// mismo cierre automático de tareaCierreHandoff.ts.
//
// A diferencia de ProcesarMensajeEntrante, no pasa por el motor de estados: el mensaje del asesor
// no es una transición del cliente. Dos efectos:
// 1. Renueva el reloj de inactividad (tocarActividad / actualizarEstado, ver datos/tipos.ts) para
//    que aplace el cierre automático igual que lo hace un mensaje del cliente.
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
    const contexto = { ...conversacion.contexto, [CLAVE_ASESOR_RESPONDIO]: true };

    if (conversacion.estadoActual !== EstadoConversacion.HANDOFF_HUMANO) {
      // actualizarEstado ya renueva actualizada_en, no hace falta tocarActividad aparte.
      await this.conversacionRepositorio.actualizarEstado(
        conversacion.id,
        EstadoConversacion.HANDOFF_HUMANO,
        contexto,
      );
      return;
    }

    await this.conversacionRepositorio.actualizarContexto(conversacion.id, contexto);
    await this.conversacionRepositorio.tocarActividad(conversacion.id);
  }
}
