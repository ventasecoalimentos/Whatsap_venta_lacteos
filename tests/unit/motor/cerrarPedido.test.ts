import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { cerrarPedido } from '../../../src/motor/transiciones/cerrarPedido';

describe('cerrarPedido', () => {
  it('caso feliz: pasa a HANDOFF_HUMANO con registro de pedido y tarjeta resumen con el nombre y canal', () => {
    const resultado = cerrarPedido({}, 'detal', 'Carlos');

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.registro).toEqual({ tipo: 'pedido', productoInteres: '', canal: 'detal' });
    expect(resultado.respuestas).toHaveLength(2);
    expect(resultado.respuestas[1]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('Carlos'),
    });
    expect(resultado.respuestas[1]).toMatchObject({ contenido: expect.stringContaining('Detal') });
  });

  it('usa el nombre del contexto si no viene nombreCliente', () => {
    const resultado = cerrarPedido({ nombre: 'Ana' }, 'distribucion', null);

    expect(resultado.respuestas[1]).toMatchObject({ contenido: expect.stringContaining('Ana') });
    expect(resultado.respuestas[1]).toMatchObject({ contenido: expect.stringContaining('Distribuidor') });
  });

  it('usa "Cliente sin nombre registrado" si no hay nombre en ningún lado', () => {
    const resultado = cerrarPedido({}, 'negocio', null);

    expect(resultado.respuestas[1]).toMatchObject({
      contenido: expect.stringContaining('Cliente sin nombre registrado'),
    });
    expect(resultado.respuestas[1]).toMatchObject({ contenido: expect.stringContaining('Negocio') });
  });
});
