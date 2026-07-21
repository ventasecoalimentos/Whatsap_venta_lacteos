import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoQueja } from '../../../src/motor/transiciones/desdeEsperandoQueja';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_QUEJA,
    mensajeTexto: 'El pedido llegó incompleto',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeEsperandoQueja', () => {
  it('caso feliz: pasa a HANDOFF_HUMANO con registro de queja', () => {
    const resultado = desdeEsperandoQueja(entradaBase({ nombreCliente: 'Carlos' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.registro).toEqual({
      tipo: 'queja',
      descripcion: 'El pedido llegó incompleto',
    });
    expect(resultado.respuestas).toHaveLength(2);
    expect(resultado.respuestas[1]).toEqual({
      tipo: 'texto',
      contenido: '🔔 QUEJA/RECLAMO — Carlos — El pedido llegó incompleto',
    });
  });

  it('usa "Cliente sin nombre registrado" si no hay nombre (rama servicio no lo pide)', () => {
    const resultado = desdeEsperandoQueja(entradaBase({ nombreCliente: null }));

    expect(resultado.respuestas[1]).toMatchObject({
      contenido: expect.stringContaining('Cliente sin nombre registrado'),
    });
  });

  it('mensaje no-texto se queda en ESPERANDO_QUEJA sin registro', () => {
    const resultado = desdeEsperandoQueja(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_QUEJA);
    expect(resultado.registro).toBeNull();
  });
});
