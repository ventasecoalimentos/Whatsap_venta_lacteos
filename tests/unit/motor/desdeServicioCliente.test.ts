import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeServicioCliente } from '../../../src/motor/transiciones/desdeServicioCliente';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.SERVICIO_CLIENTE,
    mensajeTexto: 'Quejas o reclamos',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeServicioCliente', () => {
  it('"Quejas o reclamos" pasa a ESPERANDO_QUEJA', () => {
    const resultado = desdeServicioCliente(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_QUEJA);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto' });
    expect(resultado.registro).toBeNull();
  });

  it('mensaje no-texto se queda en SERVICIO_CLIENTE con respuesta genérica', () => {
    const resultado = desdeServicioCliente(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.SERVICIO_CLIENTE);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('opción no reconocida repite el menú de servicio', () => {
    const resultado = desdeServicioCliente(entradaBase({ mensajeTexto: 'algo raro' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.SERVICIO_CLIENTE);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });
});
