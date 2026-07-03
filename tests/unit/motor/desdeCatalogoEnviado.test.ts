import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeCatalogoEnviado } from '../../../src/motor/transiciones/desdeCatalogoEnviado';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.CATALOGO_ENVIADO,
    mensajeTexto: 'Ok, gracias',
    contexto: { nombre: 'Carlos', ciudad: 'Bogotá' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeCatalogoEnviado', () => {
  it('caso feliz: cualquier texto avanza a ESPERANDO_INTERES', () => {
    const resultado = desdeCatalogoEnviado(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_INTERES);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0].tipo).toBe('texto');
    expect(resultado.debeNotificarEquipo).toBe(false);
  });

  it('mensaje no-texto se queda en CATALOGO_ENVIADO con respuesta genérica', () => {
    const resultado = desdeCatalogoEnviado(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('inactividad: reinicia el flujo (vía procesarTransicion) en vez de continuar a ESPERANDO_INTERES', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
  });
});
