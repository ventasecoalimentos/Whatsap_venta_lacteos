import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoPqrsfCorreo } from '../../../src/motor/transiciones/desdeEsperandoPqrsfCorreo';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
    mensajeTexto: 'carlos@example.com',
    contexto: { pqrsfTipo: 'PQR', pqrsfIdentificacion: '123456789' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    debeAvisarDemanda: false,
    ...overrides,
  };
}

describe('desdeEsperandoPqrsfCorreo', () => {
  it('Facturación: pasa a HANDOFF_HUMANO directo, sin pedir descripción, con tarjeta resumen', () => {
    const resultado = desdeEsperandoPqrsfCorreo(
      entradaBase({ contexto: { pqrsfTipo: 'Facturacion', pqrsfIdentificacion: '123456789' } }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
    expect(resultado.registro).toEqual({
      tipo: 'queja',
      descripcion: 'Solicitud de facturación',
      tipoPqrsf: 'Facturacion',
    });
    const resumen = resultado.respuestas.at(-1);
    expect(resumen).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('Carlos'),
    });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('123456789') });
    expect(resumen).toMatchObject({ contenido: expect.stringContaining('carlos@example.com') });
  });

  it('PQR/Sugerencia: pasa a ESPERANDO_QUEJA a pedir la descripción, sin registro todavía', () => {
    const resultado = desdeEsperandoPqrsfCorreo(entradaBase({ contexto: { pqrsfTipo: 'PQR' } }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_QUEJA);
    expect(resultado.registro).toBeNull();
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto' });
  });

  it('guarda el correo en el contexto sin importar el tipo', () => {
    const resultado = desdeEsperandoPqrsfCorreo(entradaBase({ mensajeTexto: 'ana@example.com' }));
    expect(resultado.contextoParcheado.pqrsfCorreo).toBe('ana@example.com');
  });

  it('mensaje no-texto se queda en ESPERANDO_PQRSF_CORREO con respuesta genérica', () => {
    const resultado = desdeEsperandoPqrsfCorreo(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });
});
