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

  it('inactividad: reinicia el flujo (vía procesarTransicion) en vez de seguir avisando', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    // El reinicio por inactividad es precisamente lo que permite retomar una conversación en
    // HANDOFF_HUMANO sin necesitar un mecanismo de cron (ver docs/FLUJO_ESTADOS.md) — pasada la
    // ventana, el próximo mensaje del cliente ya no recibe el aviso de demanda, reinicia el flujo.
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas.length).toBeGreaterThan(0);
  });
});
