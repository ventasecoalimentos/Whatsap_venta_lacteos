import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoTipoPqrsf } from '../../../src/motor/transiciones/desdeEsperandoTipoPqrsf';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_TIPO_PQRSF,
    mensajeTexto: 'PQR',
    esImagen: false,
    contexto: {},
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    esSeleccionInteractiva: false,
    ...overrides,
  };
}

describe('desdeEsperandoTipoPqrsf', () => {
  it('PQR: entra a la captura compartida (pide identificación porque ya tiene nombre)', () => {
    const resultado = desdeEsperandoTipoPqrsf(entradaBase({ mensajeTexto: 'PQR' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION);
    expect(resultado.contextoParcheado.pqrsfTipo).toBe('PQR');
  });

  it('PQR sin nombre todavía: pide el nombre primero', () => {
    const resultado = desdeEsperandoTipoPqrsf(entradaBase({ mensajeTexto: 'PQR', clienteYaTieneNombre: false }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);
    expect(resultado.contextoParcheado.pqrsfTipo).toBe('PQR');
  });

  it('Sugerencia/Felicitación: salta identificación y correo, va directo a ESPERANDO_QUEJA', () => {
    const resultado = desdeEsperandoTipoPqrsf(entradaBase({ mensajeTexto: 'Sugerencia/Felicit' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_QUEJA);
    expect(resultado.contextoParcheado.pqrsfTipo).toBe('Sugerencia');
    expect(resultado.registro).toBeNull();
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('sugerencia') });
  });

  it('Sugerencia/Felicitación se reconoce también por su id interno', () => {
    const resultado = desdeEsperandoTipoPqrsf(entradaBase({ mensajeTexto: 'SUGERENCIA' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_QUEJA);
  });

  it('opción no reconocida repite el menú sin cambiar de estado', () => {
    const resultado = desdeEsperandoTipoPqrsf(entradaBase({ mensajeTexto: 'no sé' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_TIPO_PQRSF);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });

  it('mensaje no-texto se queda en ESPERANDO_TIPO_PQRSF con respuesta genérica', () => {
    const resultado = desdeEsperandoTipoPqrsf(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_TIPO_PQRSF);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });
});
