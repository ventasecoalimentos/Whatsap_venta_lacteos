import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoQueja } from '../../../src/motor/transiciones/desdeEsperandoQueja';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_QUEJA,
    mensajeTexto: 'El pedido llegó incompleto',
    contexto: { pqrsfTipo: 'PQR', pqrsfIdentificacion: '123456789', pqrsfCorreo: 'carlos@example.com' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    debeAvisarDemanda: false,
    ...overrides,
  };
}

describe('desdeEsperandoQueja', () => {
  it('caso feliz: pasa a HANDOFF_HUMANO con registro de queja y tarjeta resumen completa', () => {
    const resultado = desdeEsperandoQueja(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.registro).toEqual({
      tipo: 'queja',
      descripcion: 'El pedido llegó incompleto',
      tipoPqrsf: 'PQR',
    });
    expect(resultado.respuestas).toHaveLength(2);
    const resumen = resultado.respuestas[1];
    expect(resumen).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('Carlos') });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('123456789') });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('carlos@example.com') });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('El pedido llegó incompleto') });
  });

  it('usa "Cliente sin nombre registrado" si no hay nombre en ningún lado', () => {
    const resultado = desdeEsperandoQueja(entradaBase({ nombreCliente: null, contexto: {} }));

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
