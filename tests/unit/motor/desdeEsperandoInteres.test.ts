import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoInteres } from '../../../src/motor/transiciones/desdeEsperandoInteres';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_INTERES,
    mensajeTexto: 'Mozzarella en libra',
    contexto: { nombre: 'Carlos', ciudad: 'Bogotá' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeEsperandoInteres', () => {
  it('caso feliz: pasa a HANDOFF_HUMANO, notifica al equipo y arma el mensaje de notificación', () => {
    const resultado = desdeEsperandoInteres(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.debeNotificarEquipo).toBe(true);
    expect(resultado.contextoParcheado.productoInteres).toBe('Mozzarella en libra');
    expect(resultado.respuestas).toHaveLength(2);
    // Mensaje de cierre al cliente.
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringMatching(/en breve/i),
    });
    // Notificación destacada al equipo con el formato exacto acordado.
    expect(resultado.respuestas[1]).toEqual({
      tipo: 'texto',
      contenido: '🔔 NUEVO CLIENTE — Carlos | Bogotá | Interés: Mozzarella en libra',
    });
  });

  it('usa valores por defecto si falta nombre o ciudad en el contexto/entrada', () => {
    const resultado = desdeEsperandoInteres(
      entradaBase({ nombreCliente: null, contexto: {} }),
    );

    expect(resultado.respuestas[1]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringMatching(/NUEVO CLIENTE — .+ \| .+ \| Interés: Mozzarella en libra/),
    });
  });

  it('mensaje no-texto se queda en ESPERANDO_INTERES sin notificar al equipo', () => {
    const resultado = desdeEsperandoInteres(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_INTERES);
    expect(resultado.debeNotificarEquipo).toBe(false);
    expect(resultado.respuestas).toHaveLength(1);
  });

  it('inactividad: reinicia el flujo (vía procesarTransicion) en vez de cerrar a HANDOFF_HUMANO', () => {
    const resultado = procesarTransicion(entradaBase({ huboInactividad: true }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    expect(resultado.debeNotificarEquipo).toBe(false);
  });
});
