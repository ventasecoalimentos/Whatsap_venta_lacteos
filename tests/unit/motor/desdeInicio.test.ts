import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeInicio } from '../../../src/motor/transiciones/desdeInicio';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.INICIO,
    mensajeTexto: 'Hola',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    aceptoTratamientoDatos: false,
    ...overrides,
  };
}

describe('desdeInicio', () => {
  it('cliente nuevo (sin consentimiento) pasa a ESPERANDO_CONSENTIMIENTO_DATOS con saludo genérico', () => {
    const resultado = desdeInicio(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS);
    expect(resultado.respuestas).toHaveLength(2);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto' });
    expect(resultado.respuestas[1]).toMatchObject({ tipo: 'botones' });
    expect(resultado.registro).toBeNull();
  });

  it('cliente ya con nombre y ya autorizó pasa directo a MENU_PRINCIPAL con saludo personalizado', () => {
    const resultado = desdeInicio(
      entradaBase({ clienteYaTieneNombre: true, nombreCliente: 'Andrea', aceptoTratamientoDatos: true }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'botones',
      texto: expect.stringContaining('Andrea'),
    });
    expect(resultado.respuestas[0]).toHaveProperty('opciones');
  });

  it('cliente con nombre pero que aún no autoriza sigue viendo el saludo genérico', () => {
    const resultado = desdeInicio(
      entradaBase({ clienteYaTieneNombre: true, nombreCliente: 'Andrea', aceptoTratamientoDatos: false }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.not.stringContaining('Andrea'),
    });
  });

  it('mensaje no-texto se queda en INICIO con respuesta genérica', () => {
    const resultado = desdeInicio(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.INICIO);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0].tipo).toBe('texto');
    expect(resultado.registro).toBeNull();
  });

  it('no muta el contexto recibido', () => {
    const contexto = { algo: 'valor' };
    const resultado = desdeInicio(entradaBase({ contexto, aceptoTratamientoDatos: true, clienteYaTieneNombre: true, nombreCliente: 'X' }));

    expect(resultado.contextoParcheado).toEqual(contexto);
  });
});
