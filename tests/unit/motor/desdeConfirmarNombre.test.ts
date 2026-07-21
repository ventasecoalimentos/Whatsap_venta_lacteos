import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeConfirmarNombre } from '../../../src/motor/transiciones/desdeConfirmarNombre';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL,
    mensajeTexto: 'Usar este nombre',
    contexto: { nombrePerfilWhatsApp: 'Andrew' },
    clienteYaTieneNombre: false,
    nombreCliente: null,
    nombrePerfilWhatsApp: 'Andrew',
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeConfirmarNombre', () => {
  it('"Usar este nombre" pasa a ESPERANDO_CIUDAD y guarda el nombre de perfil en el contexto', () => {
    const resultado = desdeConfirmarNombre(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
    expect(resultado.contextoParcheado.nombre).toBe('Andrew');
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'lista',
      texto: expect.stringContaining('Andrew'),
    });
  });

  it('usa el nombre de perfil del contexto si no viene en el turno actual (respaldo)', () => {
    const resultado = desdeConfirmarNombre(
      entradaBase({ nombrePerfilWhatsApp: null, contexto: { nombrePerfilWhatsApp: 'Andrew' } }),
    );

    expect(resultado.contextoParcheado.nombre).toBe('Andrew');
  });

  it('"Escribir otro" pasa a ESPERANDO_NOMBRE sin guardar nombre', () => {
    const resultado = desdeConfirmarNombre(entradaBase({ mensajeTexto: 'Escribir otro' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_NOMBRE);
    expect(resultado.contextoParcheado.nombre).toBeUndefined();
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto' });
  });

  it('mensaje no-texto se queda en CONFIRMAR_NOMBRE_PERFIL con respuesta genérica', () => {
    const resultado = desdeConfirmarNombre(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('opción no reconocida repite el menú', () => {
    const resultado = desdeConfirmarNombre(entradaBase({ mensajeTexto: 'no sé' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });
});
