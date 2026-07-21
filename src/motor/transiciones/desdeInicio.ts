// Transición desde INICIO (o desde cualquier estado reiniciado por inactividad — ver
// motorEstados.ts). Ver docs/FLUJO_ESTADOS.md.
import { EstadoConversacion } from '../../dominio/estadoConversacion';
import type { EntradaMotor, ResultadoTransicion } from '../motorEstados';
import { OPCIONES_MENU_PRINCIPAL } from './opcionesMenuPrincipal';
import { OPCIONES_CONSENTIMIENTO_DATOS } from './opcionesConsentimientoDatos';
import { construirSaludoBienvenida } from './saludoBienvenida';

const MENSAJE_NO_TEXTO =
  'Por ahora solo puedo leer mensajes de texto. ¿Puedes escribirme, por favor?';

const MENSAJE_CONSENTIMIENTO_DATOS = `Antes de continuar 📋

En *Llano Lácteos* cuidamos tus datos. Al continuar, autorizas el tratamiento de tu información (nombre, teléfono y ciudad) para gestionar tus pedidos y contactarte, conforme a la Ley 1581 de 2012.

Consulta nuestra política aquí: [enlace]

¿Autorizas el tratamiento de tus datos?`;

// Ambas ramas (cliente nuevo o recurrente) convergen en MENU_PRINCIPAL — la captura de nombre se
// pidió aquí antes, pero ahora se difiere a la rama Ventas (ver desdeMenuPrincipal.ts), porque
// Servicio al cliente no la necesita (decisión confirmada con el cliente, ver docs/FLUJO_ESTADOS.md).
export function desdeInicio(entrada: EntradaMotor): ResultadoTransicion {
  if (entrada.mensajeTexto === null) {
    return {
      nuevoEstado: EstadoConversacion.INICIO,
      respuestas: [{ tipo: 'texto', contenido: MENSAJE_NO_TEXTO }],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  // El saludo solo se personaliza si el cliente ya existe (tiene nombre) Y ya autorizó el
  // tratamiento de datos — mientras no haya autorizado, siempre es el genérico (ver más abajo).
  const saludo = construirSaludoBienvenida(
    entrada.clienteYaTieneNombre && entrada.aceptoTratamientoDatos,
    entrada.nombreCliente,
  );

  // Primero el saludo, después (si aplica) el consentimiento — se repite en cada conversación
  // nueva mientras no haya autorizado (ver EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS y
  // desdeConsentimientoDatos.ts).
  if (!entrada.aceptoTratamientoDatos) {
    return {
      nuevoEstado: EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
      respuestas: [
        { tipo: 'texto', contenido: saludo },
        { tipo: 'botones', texto: MENSAJE_CONSENTIMIENTO_DATOS, opciones: OPCIONES_CONSENTIMIENTO_DATOS },
      ],
      contextoParcheado: entrada.contexto,
      registro: null,
    };
  }

  return {
    nuevoEstado: EstadoConversacion.MENU_PRINCIPAL,
    respuestas: [{ tipo: 'botones', texto: saludo, opciones: OPCIONES_MENU_PRINCIPAL }],
    contextoParcheado: entrada.contexto,
    registro: null,
  };
}
