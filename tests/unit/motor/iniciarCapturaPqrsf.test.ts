import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { iniciarCapturaPqrsf } from '../../../src/motor/transiciones/iniciarCapturaPqrsf';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.SERVICIO_CLIENTE,
    mensajeTexto: null,
    esImagen: false,
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    esSeleccionInteractiva: false,
    ...overrides,
  };
}

describe('iniciarCapturaPqrsf', () => {
  it('cliente sin nombre: pide nombre completo (mensaje genérico para PQR/Sugerencia)', () => {
    const resultado = iniciarCapturaPqrsf(entradaBase({ clienteYaTieneNombre: false }), 'PQR');

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: '¿Cuál es tu nombre completo?' });
    expect(resultado.contextoParcheado.pqrsfTipo).toBe('PQR');
  });

  it('cliente con nombre y sin forzar: salta directo a identificación', () => {
    const resultado = iniciarCapturaPqrsf(
      entradaBase({ clienteYaTieneNombre: true, nombreCliente: 'Carlos' }),
      'Sugerencia',
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION);
    expect(resultado.respuestas[0]).toMatchObject({ contenido: expect.stringContaining('Carlos') });
    expect(resultado.contextoParcheado.pqrsfTipo).toBe('Sugerencia');
  });

  it('Facturación con forzarPreguntaNombre=true vuelve a pedir el nombre aunque ya lo tenga, con aviso de datos correctos', () => {
    const resultado = iniciarCapturaPqrsf(
      entradaBase({ clienteYaTieneNombre: true, nombreCliente: 'Carlos' }),
      'Facturacion',
      true,
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);
    expect(resultado.respuestas[0]).toMatchObject({ contenido: expect.stringContaining('facturación') });
    expect(resultado.respuestas[0]).toMatchObject({
      contenido: expect.stringContaining('verifica que los datos que nos compartas sean correctos'),
    });
    expect(resultado.contextoParcheado.pqrsfTipo).toBe('Facturacion');
  });
});
