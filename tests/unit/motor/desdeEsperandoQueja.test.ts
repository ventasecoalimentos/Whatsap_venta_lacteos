import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoQueja } from '../../../src/motor/transiciones/desdeEsperandoQueja';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_QUEJA,
    mensajeTexto: 'El pedido llegó incompleto',
    esImagen: false,
    contexto: { pqrsfTipo: 'PQR', pqrsfIdentificacion: '123456789', pqrsfCorreo: 'carlos@example.com' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    ...overrides,
  };
}

describe('desdeEsperandoQueja', () => {
  it('caso feliz: pasa a HANDOFF_HUMANO con registro de queja y tarjeta resumen completa', () => {
    const resultado = desdeEsperandoQueja(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.registro).toEqual({
      tipo: 'queja',
      descripcion: 'El pedido llegó incompleto',
      tipoPqrsf: 'PQR',
    });
    expect(resultado.respuestas).toHaveLength(2);
    const resumen = resultado.respuestas[1];
    expect(resumen).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('Carlos') });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('123456789') });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('carlos@example.com') });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('El pedido llegó incompleto') });
  });

  it('usa "Cliente sin nombre registrado" si no hay nombre en ningún lado', () => {
    const resultado = desdeEsperandoQueja(entradaBase({ nombreCliente: null, contexto: {} }));

    expect(resultado.respuestas[1]).toMatchObject({
      contenido: expect.stringContaining('Cliente sin nombre registrado'),
    });
  });

  it('mensaje no-texto se queda en ESPERANDO_QUEJA sin registro', () => {
    const resultado = desdeEsperandoQueja(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_QUEJA);
    expect(resultado.registro).toBeNull();
  });

  it('Sugerencia/Felicitación: agradece, guarda el registro y vuelve a MENU_PRINCIPAL (no promete asesor ni pasa a handoff)', () => {
    const resultado = desdeEsperandoQueja(
      entradaBase({
        mensajeTexto: 'Sería bueno tener más variedad de quesos',
        contexto: { pqrsfTipo: 'Sugerencia' },
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.registro).toEqual({
      tipo: 'queja',
      descripcion: 'Sería bueno tener más variedad de quesos',
      tipoPqrsf: 'Sugerencia',
    });
    expect(resultado.respuestas.some((r) => r.tipo === 'texto' && r.contenido.includes('Gracias'))).toBe(true);
    expect(resultado.respuestas.some((r) => 'contenido' in r && r.contenido.includes('asesor'))).toBe(false);
    expect(resultado.respuestas.at(-1)).toMatchObject({ tipo: 'botones' });
  });
});
