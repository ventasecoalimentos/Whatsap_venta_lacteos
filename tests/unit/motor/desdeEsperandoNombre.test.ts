import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoNombre } from '../../../src/motor/transiciones/desdeEsperandoNombre';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_NOMBRE,
    mensajeTexto: 'Carlos Pérez',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    debeAvisarDemanda: false,
    ...overrides,
  };
}

describe('desdeEsperandoNombre', () => {
  it('caso feliz: guarda el nombre tal cual y pasa a MENU_PRINCIPAL personalizado', () => {
    const resultado = desdeEsperandoNombre(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.contextoParcheado.nombre).toBe('Carlos Pérez');
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'botones',
      texto: expect.stringContaining('Carlos Pérez'),
    });
    expect(resultado.respuestas[0]).toHaveProperty('opciones');
    expect(resultado.registro).toBeNull();
  });

  it('mensaje no-texto se queda en ESPERANDO_NOMBRE con respuesta genérica', () => {
    const resultado = desdeEsperandoNombre(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0].tipo).toBe('texto');
    expect(resultado.contextoParcheado).toEqual({});
  });

  it('inactividad: reinicia el flujo (vía procesarTransicion) en vez de continuar ESPERANDO_NOMBRE', () => {
    const resultado = procesarTransicion(
      entradaBase({ huboInactividad: true, clienteYaTieneNombre: false, aceptoTratamientoDatos: false }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS);
  });
});
