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
  it('caso feliz / ciudad con cobertura: envía catálogo completo y pasa a CATALOGO_ENVIADO', () => {
    const resultado = desdeEsperandoCiudad(entradaBase({ mensajeTexto: 'Bogotá' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.contextoParcheado.ciudad).toBe(Ciudad.BOGOTA);
    expect(resultado.respuestas).toHaveLength(2);
    expect(resultado.respuestas[0].tipo).toBe('texto');
    expect(resultado.respuestas[1]).toMatchObject({ tipo: 'documento' });
    expect(resultado.debeNotificarEquipo).toBe(false);
  });

  it('ciudad sin cobertura: explica cobertura limitada y envía catálogo reducido', () => {
    const resultado = desdeEsperandoCiudad(entradaBase({ mensajeTexto: 'Medellín' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.contextoParcheado.ciudad).toBe(Ciudad.OTRA);
    expect(resultado.respuestas).toHaveLength(2);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('Bogotá'),
    });
    expect(resultado.respuestas[1]).toMatchObject({ tipo: 'documento' });
  });

  it('mensaje no-texto se queda en ESPERANDO_CIUDAD con respuesta genérica', () => {
    const resultado = desdeEsperandoCiudad(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('inactividad: reinicia el flujo (vía procesarTransicion) en vez de parsear la ciudad', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    // Cliente ya tiene nombre guardado, así que el reinicio va directo a ESPERANDO_CIUDAD.
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    expect(resultado.respuestas[0]).toMatchObject({
      contenido: expect.stringContaining('Carlos'),
    });
  });
});
