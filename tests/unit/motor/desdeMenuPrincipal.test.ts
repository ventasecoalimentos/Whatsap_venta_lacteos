import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeMenuPrincipal } from '../../../src/motor/transiciones/desdeMenuPrincipal';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.MENU_PRINCIPAL,
    mensajeTexto: 'Servicio al cliente',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    nombrePerfilWhatsApp: null,
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeMenuPrincipal', () => {
  it('"Servicio al cliente" pasa a SERVICIO_CLIENTE con su propio menú', () => {
    const resultado = desdeMenuPrincipal(entradaBase({ mensajeTexto: 'Servicio al cliente' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.SERVICIO_CLIENTE);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
    expect(resultado.registro).toBeNull();
  });

  it('"Ventas" con cliente nuevo pide el nombre', () => {
    const resultado = desdeMenuPrincipal(
      entradaBase({ mensajeTexto: 'Ventas', clienteYaTieneNombre: false }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto' });
  });

  it('"Ventas" con cliente nuevo y nombre de perfil de WhatsApp disponible ofrece confirmarlo', () => {
    const resultado = desdeMenuPrincipal(
      entradaBase({
        mensajeTexto: 'Ventas',
        clienteYaTieneNombre: false,
        nombrePerfilWhatsApp: 'Andrew',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL);
    expect(resultado.contextoParcheado.nombrePerfilWhatsApp).toBe('Andrew');
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'botones',
      texto: expect.stringContaining('Andrew'),
    });
  });

  it('"Ventas" con cliente que ya tiene nombre salta directo a ESPERANDO_CIUDAD', () => {
    const resultado = desdeMenuPrincipal(
      entradaBase({ mensajeTexto: 'Ventas', clienteYaTieneNombre: true, nombreCliente: 'Ana' }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'lista' });
  });

  it('acepta seleccionar por id además de por título', () => {
    const resultado = desdeMenuPrincipal(entradaBase({ mensajeTexto: 'VENTAS' }));
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
  });

  it('mensaje no-texto se queda en MENU_PRINCIPAL con respuesta genérica', () => {
    const resultado = desdeMenuPrincipal(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('opción no reconocida repite el menú', () => {
    const resultado = desdeMenuPrincipal(entradaBase({ mensajeTexto: 'no sé qué quiero' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });
});
