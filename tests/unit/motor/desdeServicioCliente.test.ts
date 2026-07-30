import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeServicioCliente } from '../../../src/motor/transiciones/desdeServicioCliente';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.SERVICIO_CLIENTE,
    mensajeTexto: 'PQRSF',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    debeAvisarDemanda: false,
    ...overrides,
  };
}

describe('desdeServicioCliente', () => {
  it('"PQRSF" pasa a ESPERANDO_TIPO_PQRSF a elegir PQR/Sugerencia', () => {
    const resultado = desdeServicioCliente(entradaBase({ mensajeTexto: 'PQRSF' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_TIPO_PQRSF);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
    expect(resultado.registro).toBeNull();
  });

  it('"Facturación" con cliente sin nombre pide nombre completo', () => {
    const resultado = desdeServicioCliente(
      entradaBase({ mensajeTexto: 'Facturación', clienteYaTieneNombre: false }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('facturación'),
    });
  });

  it('"Facturación" vuelve a pedir el nombre incluso si el cliente ya lo tiene guardado', () => {
    const resultado = desdeServicioCliente(
      entradaBase({ mensajeTexto: 'Facturación', clienteYaTieneNombre: true, nombreCliente: 'Carlos' }),
    );

    // A diferencia de PQR/Sugerencia, Facturación siempre reconfirma el nombre (ver
    // iniciarCapturaPqrsf.ts, forzarPreguntaNombre).
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);
  });

  it('"Menú anterior" vuelve a MENU_PRINCIPAL', () => {
    const resultado = desdeServicioCliente(
      entradaBase({ mensajeTexto: 'Menú anterior', nombreCliente: 'Carlos' }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });

  it('mensaje no-texto se queda en SERVICIO_CLIENTE con respuesta genérica', () => {
    const resultado = desdeServicioCliente(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.SERVICIO_CLIENTE);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('opción no reconocida repite el menú de servicio', () => {
    const resultado = desdeServicioCliente(entradaBase({ mensajeTexto: 'algo raro' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.SERVICIO_CLIENTE);
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'botones' });
  });
});
