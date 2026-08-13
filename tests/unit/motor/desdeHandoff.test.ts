import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeHandoff } from '../../../src/motor/transiciones/desdeHandoff';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.HANDOFF_HUMANO,
    mensajeTexto: 'Hola, sigo interesado',
    esImagen: false,
    contexto: { nombre: 'Carlos' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    ...overrides,
  };
}

describe('desdeHandoff', () => {
  it('cada mensaje del cliente recibe el aviso de "mucha demanda" (no sabemos si el asesor ya respondió)', () => {
    const resultado = desdeHandoff(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('demanda') });
    expect(resultado.registro).toBeNull();
  });

  it('mensaje no-texto también recibe el aviso', () => {
    const resultado = desdeHandoff(entradaBase({ mensajeTexto: null }));

    expect(resultado.respuestas).toHaveLength(1);
  });

  it('no muta el contexto recibido', () => {
    const contexto = { nombre: 'Carlos' };
    const resultado = desdeHandoff(entradaBase({ contexto }));

    expect(resultado.contextoParcheado).toEqual(contexto);
  });

  it('inactividad NO reinicia el flujo (vía procesarTransicion) — HANDOFF_HUMANO está exento', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    // HANDOFF_HUMANO queda exento del reinicio por inactividad a propósito: el único camino de
    // salida es el cierre explícito de tareaCierreHandoff.ts (ver motorEstados.ts y
    // docs/FLUJO_ESTADOS.md) — así un mensaje tardío del cliente no interrumpe con un saludo nuevo
    // mientras el asesor puede seguir trabajando el caso.
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('demanda') });
  });
});
