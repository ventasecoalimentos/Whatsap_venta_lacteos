import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeMenuVentas } from '../../../src/motor/transiciones/desdeMenuVentas';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.MENU_VENTAS,
    mensajeTexto: 'Detal',
    contexto: { ciudad: 'Bogotá' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeMenuVentas', () => {
  it('"Detal" envía el catálogo al detal y guarda canal=detal en el contexto', () => {
    const resultado = desdeMenuVentas(entradaBase({ mensajeTexto: 'Detal' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_DETAL);
    expect(resultado.contextoParcheado.canal).toBe('detal');
    expect(resultado.respuestas.some((r) => r.tipo === 'documento' && r.catalogo === 'detal')).toBe(
      true,
    );
    expect(resultado.respuestas.at(-1)).toMatchObject({ tipo: 'botones' });
  });

  it('"Distribución" envía el catálogo de distribución y guarda canal=distribucion', () => {
    // Se usa el id en vez del título en texto libre para no depender de la redacción exacta.
    const resultado = desdeMenuVentas(entradaBase({ mensajeTexto: 'DISTRIBUCION' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_DISTRIB);
    expect(resultado.contextoParcheado.canal).toBe('distribucion');
    expect(
      resultado.respuestas.some((r) => r.tipo === 'documento' && r.catalogo === 'distribucion'),
    ).toBe(true);
  });

  it('mensaje no-texto se queda en MENU_VENTAS con respuesta genérica', () => {
    const resultado = desdeMenuVentas(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('opción no reconocida repite el menú de ventas', () => {
    const resultado = desdeMenuVentas(entradaBase({ mensajeTexto: 'no sé' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });
});
