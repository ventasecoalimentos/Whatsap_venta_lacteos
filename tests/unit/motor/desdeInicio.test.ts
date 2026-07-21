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
    ...overrides,
  };
}

describe('desdeInicio', () => {
  it('caso feliz: cliente nuevo pasa a MENU_PRINCIPAL con saludo genérico', () => {
    const resultado = desdeInicio(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
    expect(resultado.respuestas[0]).toHaveProperty('opciones');
    expect(resultado.registro).toBeNull();
  });

  it('cliente existente pasa a MENU_PRINCIPAL con saludo personalizado', () => {
    const resultado = desdeInicio(
      entradaBase({ clienteYaTieneNombre: true, nombreCliente: 'Andrea' }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'botones',
      texto: expect.stringContaining('Andrea'),
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
    const resultado = desdeInicio(entradaBase({ contexto }));

    expect(resultado.contextoParcheado).toEqual(contexto);
  });
});
