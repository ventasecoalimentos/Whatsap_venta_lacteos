// Transición desde HANDOFF_HUMANO. Ver docs/FLUJO_ESTADOS.md.
//
// Esta función solo maneja mensajes del CLIENTE — nunca se llega aquí por un mensaje tardío que
// debería reiniciar el flujo (motorEstados.ts exime a HANDOFF_HUMANO del reinicio por inactividad,
// justamente para no interrumpir con un saludo nuevo mientras el asesor puede seguir trabajando el
// caso).
//
// Mientras el asesor NO haya respondido todavía (`contexto.asesorRespondio` ausente), cada mensaje
// del cliente recibe de vuelta el aviso de "mucha demanda". Una vez que el asesor responde al
// menos una vez (marcado por registrarRespuestaAsesor.ts a partir del evento
// whatsapp.smb.message.echoes), el bot deja de mandar ese aviso — no tiene sentido seguir avisando
// "en breve te atendemos" si el asesor ya está ahí hablando directamente con el cliente — y este
// estado queda en silencio total hasta que tareaCierreHandoff.ts lo cierre.
//
// Los mensajes del ASESOR no pasan por aquí ni por el motor en absoluto: YCloud los expone al
// webhook como un evento aparte, manejado directamente por registrarRespuestaAsesor.ts.
//
// Dos caminos de salida de HANDOFF_HUMANO:
// 1. El cierre explícito de tareaCierreHandoff.ts, que corre en segundo plano y cierra cuando
//    pasan VENTANA_INACTIVIDAD_HORAS sin mensajes de NINGUNO de los dos (cliente o asesor).
// 2. El botón "Menú principal" del aviso de "mucha demanda" — solo mientras el asesor NO haya
//    respondido (después el bot queda en silencio y no reacciona ni a ese botón). La solicitud ya
//    quedó registrada al entrar a handoff, así que salir no la pierde; si el asesor escribe
//    después, registrarRespuestaAsesor.ts devuelve la conversación a HANDOFF_HUMANO.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { MENSAJE_AVISO_DEMANDA } from './mensajeAvisoDemanda';
import { OPCIONES_AVISO_DEMANDA, OPCION_MENU_PRINCIPAL_HANDOFF } from './opcionesAvisoDemanda';
import { volverAMenuPrincipal } from './volverAMenuPrincipal';

const MENSAJE_SALIDA_HANDOFF =
  'Tu solicitud ya quedó registrada ✅ y un asesor te contactará igualmente.';

// Coincidencia estricta a propósito (no usa buscarOpcionSeleccionada, que acepta parte del título):
// aquí el cliente suele escribir texto libre para el asesor, y un mensaje corto como "a" o "menu"
// no debe sacarlo de handoff por accidente.
function eligioMenuPrincipal(texto: string | null): boolean {
  if (!texto) return false;
  const normalizado = texto.trim().toLowerCase();
  return (
    normalizado === OPCION_MENU_PRINCIPAL_HANDOFF.toLowerCase() ||
    normalizado === 'menú principal' ||
    normalizado === 'menu principal'
  );
}

// Clave en `contexto` que marca que el asesor ya respondió al menos una vez en este handoff (ver
// application/registrarRespuestaAsesor.ts, que la importa desde aquí — el motor no depende de la
// capa de aplicación, es al revés).
export const CLAVE_ASESOR_RESPONDIO = 'asesorRespondio';

export function desdeHandoff(entrada: EntradaMotor): ResultadoTransicion {
  const asesorYaRespondio = entrada.contexto[CLAVE_ASESOR_RESPONDIO] === true;

  if (asesorYaRespondio) {
    return {
      nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
      respuestas: [],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  if (eligioMenuPrincipal(entrada.mensajeTexto)) {
    const menu = volverAMenuPrincipal(entrada.nombreCliente, entrada.contexto);
    return {
      ...menu,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_SALIDA_HANDOFF }, ...menu.respuestas],
    };
  }

  return {
    nuevoEstado: EstadoConversacion.HANDOFF_HUMANO,
    respuestas: [{ tipo: 'botones', texto: MENSAJE_AVISO_DEMANDA, opciones: OPCIONES_AVISO_DEMANDA }],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
