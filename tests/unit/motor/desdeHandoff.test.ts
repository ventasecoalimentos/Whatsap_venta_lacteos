import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeHandoff, CLAVE_ASESOR_RESPONDIO } from '../../../src/motor/transiciones/desdeHandoff';
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
    esSeleccionInteractiva: false,
    ...overrides,
  };
}

describe('desdeHandoff', () => {
  it('cada mensaje del cliente recibe el aviso de "mucha demanda" (no sabemos si el asesor ya respondió)', () => {
    const resultado = desdeHandoff(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones', texto: expect.stringContaining('demanda') });
    const aviso = resultado.respuestas[0];
    if (aviso.tipo !== 'botones') throw new Error('se esperaban botones');
    expect(aviso.opciones.map((o) => o.titulo)).toEqual(['Menú principal']);
    expect(resultado.registro).toBeNull();
  });

  it('botón "Menú principal" del aviso: vuelve a MENU_PRINCIPAL avisando que la solicitud ya quedó registrada', () => {
    const resultado = desdeHandoff(
      entradaBase({ mensajeTexto: 'MENU_PRINCIPAL_HANDOFF', esSeleccionInteractiva: true }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('registrada') });
    expect(resultado.respuestas.at(-1)).toMatchObject({ tipo: 'botones' });
    expect(resultado.registro).toBeNull();
  });

  it('escribir "Menú principal" completo también sale del handoff', () => {
    const resultado = desdeHandoff(entradaBase({ mensajeTexto: '  menu principal ' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });

  it('texto libre que solo se parece ("menú", "a") NO saca del handoff por accidente', () => {
    for (const mensajeTexto of ['menú', 'a', 'principal']) {
      const resultado = desdeHandoff(entradaBase({ mensajeTexto }));
      expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    }
  });

  it('si el asesor ya respondió, el botón "Menú principal" (viejo) se ignora en silencio', () => {
    const resultado = desdeHandoff(
      entradaBase({
        mensajeTexto: 'MENU_PRINCIPAL_HANDOFF',
        esSeleccionInteractiva: true,
        contexto: { [CLAVE_ASESOR_RESPONDIO]: true },
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas).toHaveLength(0);
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

  it('si el asesor ya respondió (contexto.asesorRespondio), NO manda el aviso de demanda', () => {
    const resultado = desdeHandoff(
      entradaBase({ contexto: { nombre: 'Carlos', [CLAVE_ASESOR_RESPONDIO]: true } }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas).toHaveLength(0);
    expect(resultado.registro).toBeNull();
  });

  it('inactividad NO reinicia el flujo (vía procesarTransicion) — HANDOFF_HUMANO está exento', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    // HANDOFF_HUMANO queda exento del reinicio por inactividad a propósito: el único camino de
    // salida es el cierre explícito de tareaCierreHandoff.ts (ver motorEstados.ts y
    // docs/FLUJO_ESTADOS.md) — así un mensaje tardío del cliente no interrumpe con un saludo nuevo
    // mientras el asesor puede seguir trabajando el caso.
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones', texto: expect.stringContaining('demanda') });
  });
});
