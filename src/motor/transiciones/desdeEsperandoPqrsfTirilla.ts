// Transición desde ESPERANDO_PQRSF_TIRILLA (solo rama Facturación, ver desdeEsperandoPqrsfCorreo.ts).
// Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { volverAMenuPrincipal } from './volverAMenuPrincipal';

const MENSAJE_NO_ES_IMAGEN = 'Necesito que sea una foto de la tirilla o recibo, por favor. 📷';
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

  // No es necesario que un asesor tome la conversación para facturación — se cierra aquí mismo y
  // se vuelve al menú principal (mismo patrón que Sugerencia/Felicitación, ver desdeEsperandoQueja.ts).
  const nombreCompleto =
    entrada.nombreCliente ?? (entrada.contexto['nombre'] as string | undefined) ?? NOMBRE_POR_DEFECTO;
  const cierre = volverAMenuPrincipal(nombreCompleto, entrada.contexto);

  return {
    ...cierre,
    respuestas: [
      {
        tipo: 'texto',
        contenido: `¡Listo, ${nombreCompleto}! 🙌 Tu solicitud de facturación quedó registrada. La factura se gestionará y la recibirás en tu correo dentro de las próximas 24 horas.\n\n¡Gracias por confiar en *Llano Lácteos*! 🐮`,
      },
      ...cierre.respuestas,
    ],
    registro: { tipo: 'queja', descripcion: DESCRIPCION_FACTURACION, tipoPqrsf: 'Facturacion' },
  };
}
