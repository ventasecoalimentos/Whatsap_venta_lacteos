import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeMenuPrincipal } from '../../../src/motor/transiciones/desdeMenuPrincipal';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.MENU_PRINCIPAL,
    mensajeTexto: 'Servicio al cliente',
    esImagen: false,
    contexto: {},
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    ...overrides,
  };
}

describe('desdeMenuPrincipal', () => {
  it('"Servicio al cliente" pasa a SERVICIO_CLIENTE con Facturación/PQRSF/Menú anterior', () => {
    const resultado = desdeMenuPrincipal(entradaBase({ mensajeTexto: 'Servicio al cliente' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.SERVICIO_CLIENTE);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
    expect(resultado.respuestas[0]).toHaveProperty('opciones');
    expect(resultado.registro).toBeNull();
  });

  it('"Ventas" pasa directo a MENU_VENTAS (el nombre ya se pidió tras el consentimiento)', () => {
    const resultado = desdeMenuPrincipal(entradaBase({ mensajeTexto: 'Ventas' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });

  it('"Ventas" va a MENU_VENTAS incluso si clienteYaTieneNombre viene en false (no hay rama alternativa)', () => {
    const resultado = desdeMenuPrincipal(
      entradaBase({ mensajeTexto: 'Ventas', clienteYaTieneNombre: false, nombreCliente: null }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
  });

  it('acepta seleccionar por id además de por título', () => {
    const resultado = desdeMenuPrincipal(entradaBase({ mensajeTexto: 'VENTAS' }));
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
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
