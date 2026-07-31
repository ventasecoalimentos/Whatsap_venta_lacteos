import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoPqrsfIdentificacion } from '../../../src/motor/transiciones/desdeEsperandoPqrsfIdentificacion';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
    mensajeTexto: '123456789',
    contexto: { pqrsfTipo: 'PQR' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    ...overrides,
  };
}

describe('desdeEsperandoPqrsfIdentificacion', () => {
  it('caso feliz: guarda solo los dígitos y pasa a ESPERANDO_PQRSF_CORREO', () => {
    const resultado = desdeEsperandoPqrsfIdentificacion(entradaBase({ mensajeTexto: '123456789' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);
    expect(resultado.contextoParcheado.pqrsfIdentificacion).toBe('123456789');
  });

  it('tolera puntos, guiones y un prefijo como "NIT:" — se queda solo con los dígitos', () => {
    const resultado = desdeEsperandoPqrsfIdentificacion(
      entradaBase({ mensajeTexto: 'nit: 900.123.456-7' }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);
    expect(resultado.contextoParcheado.pqrsfIdentificacion).toBe('9001234567');
  });

  it('acepta un número corto de 5 dígitos (ej. "nit : 11111")', () => {
    const resultado = desdeEsperandoPqrsfIdentificacion(entradaBase({ mensajeTexto: 'nit : 11111' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);
    expect(resultado.contextoParcheado.pqrsfIdentificacion).toBe('11111');
  });

  it('con menos de 5 dígitos no avanza de estado y pide de nuevo', () => {
    const resultado = desdeEsperandoPqrsfIdentificacion(entradaBase({ mensajeTexto: '123' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION);
    expect(resultado.registro).toBeNull();
    expect(resultado.respuestas[0]).toMatchObject({ contenido: expect.stringContaining('no parece válido') });
  });

  it('texto sin ningún dígito tampoco avanza', () => {
    const resultado = desdeEsperandoPqrsfIdentificacion(entradaBase({ mensajeTexto: 'no tengo' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION);
  });

  it('mensaje no-texto se queda en ESPERANDO_PQRSF_IDENTIFICACION con respuesta genérica', () => {
    const resultado = desdeEsperandoPqrsfIdentificacion(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });
});
