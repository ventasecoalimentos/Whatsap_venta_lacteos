import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeHandoff } from '../../../src/motor/transiciones/desdeHandoff';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.HANDOFF_HUMANO,
    mensajeTexto: 'Hola, sigo interesado',
    contexto: { nombre: 'Carlos', ciudad: 'Bogotá', productoInteres: 'Mozzarella' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeHandoff', () => {
  it('caso feliz (silencio total): texto normal no genera respuestas y se queda en HANDOFF_HUMANO', () => {
    const resultado = desdeHandoff(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas).toEqual([]);
    expect(resultado.debeNotificarEquipo).toBe(false);
  });

  it('mensaje no-texto también se ignora en silencio (mismo comportamiento)', () => {
    const resultado = desdeHandoff(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas).toEqual([]);
  });

  it('no muta el contexto recibido', () => {
    const contexto = { nombre: 'Carlos' };
    const resultado = desdeHandoff(entradaBase({ contexto }));

    expect(resultado.contextoParcheado).toEqual(contexto);
  });

  it('inactividad: reinicia el flujo (vía procesarTransicion) en vez de quedarse en silencio', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    // El reinicio por inactividad es precisamente lo que permite retomar una conversación en
    // HANDOFF_HUMANO sin necesitar un mecanismo de cron (ver docs/FLUJO_ESTADOS.md).
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    expect(resultado.respuestas.length).toBeGreaterThan(0);
  });
});
