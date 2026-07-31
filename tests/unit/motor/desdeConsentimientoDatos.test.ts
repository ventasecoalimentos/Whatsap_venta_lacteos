import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeConsentimientoDatos } from '../../../src/motor/transiciones/desdeConsentimientoDatos';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
    mensajeTexto: 'Autorizo',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    aceptoTratamientoDatos: false,
    ...overrides,
  };
}

describe('desdeConsentimientoDatos', () => {
  it('"Autorizo" con cliente sin nombre pasa a ESPERANDO_NOMBRE (sin sugerir el de perfil)', () => {
    const resultado = desdeConsentimientoDatos(entradaBase({ mensajeTexto: 'Autorizo' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
    expect(resultado.contextoParcheado.aceptoTratamientoDatos).toBe(true);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto' });
  });

  it('"No autorizo" también pasa a ESPERANDO_NOMBRE — se pregunta el nombre sin importar la respuesta', () => {
    const resultado = desdeConsentimientoDatos(entradaBase({ mensajeTexto: 'No autorizo' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
    expect(resultado.contextoParcheado.aceptoTratamientoDatos).toBe(false);
  });

  it('cliente que ya tiene nombre salta directo a MENU_PRINCIPAL personalizado', () => {
    const resultado = desdeConsentimientoDatos(
      entradaBase({ mensajeTexto: 'Autorizo', clienteYaTieneNombre: true, nombreCliente: 'Carlos' }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'botones',
      texto: expect.stringContaining('Carlos'),
    });
    expect(resultado.respuestas[0]).toHaveProperty('opciones');
  });

  it('opción no reconocida repite el menú de consentimiento', () => {
    const resultado = desdeConsentimientoDatos(entradaBase({ mensajeTexto: 'no sé' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });

  it('mensaje no-texto se queda en ESPERANDO_CONSENTIMIENTO_DATOS con respuesta genérica', () => {
    const resultado = desdeConsentimientoDatos(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });
});
