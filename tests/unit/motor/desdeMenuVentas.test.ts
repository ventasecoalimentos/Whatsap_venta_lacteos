import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeMenuVentas } from '../../../src/motor/transiciones/desdeMenuVentas';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.MENU_VENTAS,
    mensajeTexto: 'Detal',
    esImagen: false,
    contexto: {},
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    ...overrides,
  };
}

describe('desdeMenuVentas', () => {
  it('"Detal" envía el catálogo + imagen de "cómo comprar" y guarda canal=detal en el contexto', () => {
    const resultado = desdeMenuVentas(entradaBase({ mensajeTexto: 'Detal' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.contextoParcheado.canal).toBe('detal');
    expect(resultado.respuestas.some((r) => r.tipo === 'documento')).toBe(true);
    expect(resultado.respuestas.some((r) => r.tipo === 'imagen')).toBe(true);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('Catálogo') });
    // La imagen lleva su propia leyenda inmediatamente antes (ver desdeMenuVentas.ts).
    const indiceImagen = resultado.respuestas.findIndex((r) => r.tipo === 'imagen');
    expect(resultado.respuestas[indiceImagen - 1]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('Antes de comprar'),
    });
    expect(resultado.respuestas.at(-1)).toMatchObject({ tipo: 'botones' });
  });

  it('"Distribuidor" guarda canal=distribucion (mismo catálogo, mismo comportamiento)', () => {
    const resultado = desdeMenuVentas(entradaBase({ mensajeTexto: 'DISTRIBUCION' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.contextoParcheado.canal).toBe('distribucion');
  });

  it('"Negocio" guarda canal=negocio', () => {
    const resultado = desdeMenuVentas(entradaBase({ mensajeTexto: 'Negocio' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.contextoParcheado.canal).toBe('negocio');
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
