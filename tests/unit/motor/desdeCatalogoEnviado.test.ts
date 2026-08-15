import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeCatalogoEnviado } from '../../../src/motor/transiciones/desdeCatalogoEnviado';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.CATALOGO_ENVIADO,
    mensajeTexto: 'Continuar pedido',
    esImagen: false,
    contexto: { canal: 'detal' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    esSeleccionInteractiva: false,
    ...overrides,
  };
}

describe('desdeCatalogoEnviado', () => {
  it('"Continuar pedido" pasa a HANDOFF_HUMANO con registro de pedido y un solo mensaje de cierre', () => {
    const resultado = desdeCatalogoEnviado(entradaBase({ contexto: { canal: 'distribucion' } }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.registro).toEqual({ tipo: 'pedido', productoInteres: '', canal: 'distribucion' });
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('Listo') });
  });

  it('usa canal "detal" por defecto si no vino en el contexto', () => {
    const resultado = desdeCatalogoEnviado(entradaBase({ contexto: {} }));

    expect(resultado.registro).toMatchObject({ canal: 'detal' });
  });

  it('atajo de texto "1" salta directo a MENU_PRINCIPAL', () => {
    const resultado = desdeCatalogoEnviado(entradaBase({ mensajeTexto: '1' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });

  it('"Menú anterior" retrocede solo a MENU_VENTAS', () => {
    const resultado = desdeCatalogoEnviado(entradaBase({ mensajeTexto: 'Menú anterior' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
  });

  it('mensaje no-texto se queda en CATALOGO_ENVIADO con respuesta genérica', () => {
    const resultado = desdeCatalogoEnviado(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('opción no reconocida repite el menú', () => {
    const resultado = desdeCatalogoEnviado(entradaBase({ mensajeTexto: 'no sé' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_ENVIADO);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });
});
