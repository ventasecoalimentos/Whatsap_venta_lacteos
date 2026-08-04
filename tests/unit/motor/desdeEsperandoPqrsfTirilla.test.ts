import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoPqrsfTirilla } from '../../../src/motor/transiciones/desdeEsperandoPqrsfTirilla';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_PQRSF_TIRILLA,
    mensajeTexto: null,
    esImagen: true,
    contexto: { pqrsfTipo: 'Facturacion', pqrsfIdentificacion: '123456789', pqrsfCorreo: 'carlos@example.com' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    ...overrides,
  };
}

describe('desdeEsperandoPqrsfTirilla', () => {
  it('caso feliz: recibe la foto, cierra sin handoff y vuelve a MENU_PRINCIPAL', () => {
    const resultado = desdeEsperandoPqrsfTirilla(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.registro).toEqual({
      tipo: 'queja',
      descripcion: 'Solicitud de facturación',
      tipoPqrsf: 'Facturacion',
    });
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('24 horas'),
    });
    expect(resultado.respuestas[0]).toMatchObject({ contenido: expect.stringContaining('Carlos') });
    expect(resultado.respuestas.some((r) => 'contenido' in r && r.contenido.includes('asesor'))).toBe(false);
    expect(resultado.respuestas.at(-1)).toMatchObject({ tipo: 'botones' });
  });

  it('usa "Cliente sin nombre registrado" si no hay nombre en ningún lado', () => {
    const resultado = desdeEsperandoPqrsfTirilla(entradaBase({ nombreCliente: null, contexto: {} }));

    expect(resultado.respuestas[0]).toMatchObject({
      contenido: expect.stringContaining('Cliente sin nombre registrado'),
    });
  });

  it('si no es una imagen, se queda en el mismo estado y pide la foto de nuevo', () => {
    const resultado = desdeEsperandoPqrsfTirilla(entradaBase({ esImagen: false, mensajeTexto: 'ya la mandé' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_TIRILLA);
    expect(resultado.registro).toBeNull();
    expect(resultado.respuestas[0]).toMatchObject({ contenido: expect.stringContaining('foto') });
  });

  it('mensaje no-texto y no-imagen (ej. audio) también pide la foto de nuevo', () => {
    const resultado = desdeEsperandoPqrsfTirilla(entradaBase({ esImagen: false, mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_TIRILLA);
    expect(resultado.registro).toBeNull();
  });
});
