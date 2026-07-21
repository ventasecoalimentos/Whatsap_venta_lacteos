import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeCatalogoDetal } from '../../../src/motor/transiciones/desdeCatalogoDetal';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.CATALOGO_DETAL,
    mensajeTexto: 'Continuar pedido',
    contexto: { ciudad: 'Bogotá', canal: 'detal' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    ...overrides,
  };
}

describe('desdeCatalogoDetal', () => {
  it('"Menú anterior" vuelve a MENU_PRINCIPAL con saludo personalizado', () => {
    const resultado = desdeCatalogoDetal(entradaBase({ mensajeTexto: 'Menú anterior' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'botones',
      texto: expect.stringContaining('Carlos'),
    });
  });

  it('escribir "1" también vuelve a MENU_PRINCIPAL (atajo de texto)', () => {
    const resultado = desdeCatalogoDetal(entradaBase({ mensajeTexto: '1' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });

  it('"Continuar pedido" pasa directo a HANDOFF_HUMANO con canal=detal, sin preguntar producto', () => {
    const resultado = desdeCatalogoDetal(entradaBase({ mensajeTexto: 'Continuar pedido' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.contextoParcheado.canal).toBe('detal');
    expect(resultado.respuestas).toContainEqual({ tipo: 'texto', contenido: '💬' });
    expect(resultado.registro).toMatchObject({ tipo: 'pedido', ciudad: 'Bogotá', canal: 'detal' });
  });

  it('mensaje no-texto se queda en CATALOGO_DETAL con respuesta genérica', () => {
    const resultado = desdeCatalogoDetal(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_DETAL);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('opción no reconocida repite el menú', () => {
    const resultado = desdeCatalogoDetal(entradaBase({ mensajeTexto: 'no sé' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_DETAL);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });
});
