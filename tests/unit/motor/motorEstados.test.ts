import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.INICIO,
    mensajeTexto: 'Hola',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    ...overrides,
  };
}

describe('procesarTransicion — enrutamiento de la tabla', () => {
  it('enruta cada estado a su transición correspondiente', () => {
    const casos: Array<[EstadoConversacion, EstadoConversacion]> = [
      [EstadoConversacion.INICIO, EstadoConversacion.ESPERANDO_NOMBRE],
      [EstadoConversacion.ESPERANDO_NOMBRE, EstadoConversacion.ESPERANDO_CIUDAD],
      [EstadoConversacion.ESPERANDO_CIUDAD, EstadoConversacion.CATALOGO_ENVIADO],
      [EstadoConversacion.CATALOGO_ENVIADO, EstadoConversacion.ESPERANDO_INTERES],
      [EstadoConversacion.ESPERANDO_INTERES, EstadoConversacion.HANDOFF_HUMANO],
      [EstadoConversacion.HANDOFF_HUMANO, EstadoConversacion.HANDOFF_HUMANO],
    ];

    for (const [origen, destinoEsperado] of casos) {
      const resultado = procesarTransicion(
        entradaBase({ estadoActual: origen, mensajeTexto: 'texto de prueba' }),
      );
      expect(resultado.nuevoEstado).toBe(destinoEsperado);
    }
  });

  it('INICIO con cliente existente pasa directo a ESPERANDO_CIUDAD', () => {
    const resultado = procesarTransicion(
      entradaBase({ clienteYaTieneNombre: true, nombreCliente: 'Ana' }),
    );
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
  });
});

describe('procesarTransicion — regla de reinicio por inactividad', () => {
  it('si huboInactividad y el estado no es INICIO, se procesa como si viniera de INICIO (cliente nuevo)', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.ESPERANDO_INTERES,
        huboInactividad: true,
        clienteYaTieneNombre: false,
        nombreCliente: null,
        mensajeTexto: 'sigo aquí',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
  });

  it('si huboInactividad y el cliente ya tiene nombre, reinicia directo a ESPERANDO_CIUDAD', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.HANDOFF_HUMANO,
        huboInactividad: true,
        clienteYaTieneNombre: true,
        nombreCliente: 'Ana',
        mensajeTexto: 'sigo aquí',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
  });

  it('si huboInactividad pero el estado YA es INICIO, no hay reinicio especial (comportamiento normal)', () => {
    const resultado = procesarTransicion(
      entradaBase({ estadoActual: EstadoConversacion.INICIO, huboInactividad: true }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
  });

  it('sin inactividad, un estado distinto de INICIO respeta su transición normal (no se reinicia)', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.CATALOGO_ENVIADO,
        huboInactividad: false,
        mensajeTexto: 'quiero queso',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_INTERES);
  });
});
