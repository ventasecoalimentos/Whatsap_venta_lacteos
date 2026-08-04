// Transición desde ESPERANDO_PQRSF_TIRILLA (solo rama Facturación, ver desdeEsperandoPqrsfCorreo.ts).
// Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';

const MENSAJE_NO_ES_IMAGEN = 'Por favor envíame una foto de la tirilla o recibo 📸';
const NOMBRE_POR_DEFECTO = 'Cliente sin nombre registrado';
const DESCRIPCION_FACTURACION = 'Solicitud de facturación';

export function desdeEsperandoPqrsfTirilla(entrada: EntradaMotor): ResultadoTransicion {
  if (!entrada.esImagen) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_PQRSF_TIRILLA,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_ES_IMAGEN }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // No es necesario que un asesor tome la conversación para facturación — se cierra aquí mismo,
  // sin reabrir el menú principal. Queda en INICIO (no en HANDOFF_HUMANO ni en MENU_PRINCIPAL) para
  // que el próximo mensaje del cliente, sea cuando sea, arranque de cero con el saludo inicial en
  // vez de seguir esperando una opción de menú que nunca se mostró.
  const nombreCompleto =
    entrada.nombreCliente ?? (entrada.contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;

  return {
    nuevoEstado: EstadoConversacion.INICIO,
    respuestas: [
      {
        tipo: 'texto',
        contenido: `¡Listo, ${nombreCompleto}!\n🙌 Tu solicitud de facturación quedó registrada. La factura se gestionará y la recibirás en tu correo dentro de las próximas 24 horas.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮`,
      },
    ],
    contextoParcheado: entrada.contexto,
    registro: { tipo: 'queja', descripcion: DESCRIPCION_FACTURACION, tipoPqrsf: 'Facturacion' },
  };
}
