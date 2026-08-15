import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { cerrarPedido } from '../../../src/motor/transiciones/cerrarPedido';

describe('cerrarPedido', () => {
  it('caso feliz: pasa a HANDOFF_HUMANO con registro de pedido y un solo mensaje de cierre (sin tarjeta resumen)', () => {
    const resultado = cerrarPedido({}, 'detal');

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.registro).toEqual({ tipo: 'pedido', productoInteres: '', canal: 'detal' });
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('Listo') });
  });

  it('no muta el contexto recibido', () => {
    const contexto = { canal: 'distribucion' };
    const resultado = cerrarPedido(contexto, 'distribucion');

    expect(resultado.contextoParcheado).toBe(contexto);
  });
});
