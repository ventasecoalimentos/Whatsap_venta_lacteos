import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { Ciudad } from '../../../src/dominio/ciudad';
import { desdeEsperandoCiudad } from '../../../src/motor/transiciones/desdeEsperandoCiudad';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_CIUDAD,
    mensajeTexto: 'Bogotá',
    contexto: { nombre: 'Carlos' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeEsperandoCiudad', () => {
  it('caso feliz / ciudad con cobertura: pasa a MENU_VENTAS sin enviar catálogo todavía', () => {
    const resultado = desdeEsperandoCiudad(entradaBase({ mensajeTexto: 'Bogotá' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
    expect(resultado.contextoParcheado.ciudad).toBe(Ciudad.BOGOTA);
    expect(resultado.respuestas).toHaveLength(2);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto' });
    // El catálogo ya no se envía aquí — depende de la elección Detal/Distribución (MENU_VENTAS).
    expect(resultado.respuestas[1]).toMatchObject({ tipo: 'botones' });
    expect(resultado.registro).toBeNull();
  });

  it('ciudad sin cobertura: explica cobertura limitada y también pasa a MENU_VENTAS', () => {
    const resultado = desdeEsperandoCiudad(entradaBase({ mensajeTexto: 'Medellín' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
    expect(resultado.contextoParcheado.ciudad).toBe(Ciudad.OTRA);
    expect(resultado.respuestas).toHaveLength(2);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('Bogotá'),
    });
    expect(resultado.respuestas[1]).toMatchObject({ tipo: 'botones' });
  });

  it('mensaje no-texto se queda en ESPERANDO_CIUDAD con respuesta genérica', () => {
    const resultado = desdeEsperandoCiudad(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('inactividad: reinicia el flujo (vía procesarTransicion) en vez de parsear la ciudad', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    // El reinicio siempre pasa por desdeInicio → MENU_PRINCIPAL, con saludo recurrente.
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'botones',
      texto: expect.stringContaining('Carlos'),
    });
  });
});
