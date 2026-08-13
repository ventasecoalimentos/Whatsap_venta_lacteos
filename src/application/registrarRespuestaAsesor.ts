// Caso de uso disparado por el evento whatsapp.smb.message.echoes de YCloud (ver
// mapeoYCloud.ts::mapearEventoEcoAsesor) — el asesor le respondió a un cliente desde la app nativa
// de WhatsApp, fuera del bot. Ese evento llega para CUALQUIER mensaje que el equipo mande desde la
// app (no solo a clientes en HANDOFF_HUMANO, ni siquiera solo a clientes del bot), así que este
// caso de uso solo actúa cuando el destinatario es un cliente conocido cuya conversación sigue en
// HANDOFF_HUMANO — en cualquier otro caso lo ignora en silencio.
//
// A diferencia de ProcesarMensajeEntrante, no toca el motor de estados: el mensaje del asesor no
// es una transición, solo renueva el reloj de inactividad (ver tocarActividad en datos/tipos.ts)
// para que aplace el cierre automático igual que lo hace un mensaje del cliente.
import { EstadoConversacion } from '../dominio/estadoConversacion';
import type { IClienteRepository, IConversacionRepository } from '../datos/tipos';

export class RegistrarRespuestaAsesor {
  constructor(
    private readonly clienteRepositorio: IClienteRepository,
    private readonly conversacionRepositorio: IConversacionRepository,
  ) {}

  async ejecutar(telefonoCliente: string): Promise<void> {
    const cliente = await this.clienteRepositorio.buscarPorTelefono(telefonoCliente);
    if (!cliente) return;

    const conversacion = await this.conversacionRepositorio.obtenerOCrear(cliente.id);
    if (conversacion.estadoActual !== EstadoConversacion.HANDOFF_HUMANO) return;

    await this.conversacionRepositorio.tocarActividad(conversacion.id);
  }
}
