import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoPqrsfCorreo } from '../../../src/motor/transiciones/desdeEsperandoPqrsfCorreo';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
    mensajeTexto: 'carlos@example.com',
    esImagen: false,
    contexto: { pqrsfTipo: 'PQR', pqrsfIdentificacion: '123456789' },
    clienteYaTieneNombre: true,
    nombreCliente: 'Carlos',
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    esSeleccionInteractiva: false,
    ...overrides,
  };
}

describe('desdeEsperandoPqrsfCorreo', () => {
  it('Facturación: pasa a ESPERANDO_PQRSF_TIRILLA a pedir la foto, sin registro todavía ni handoff', () => {
    const resultado = desdeEsperandoPqrsfCorreo(
      entradaBase({ contexto: { pqrsfTipo: 'Facturacion', pqrsfIdentificacion: '123456789' } }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_TIRILLA);
    expect(resultado.registro).toBeNull();
    expect(resultado.respuestas).toHaveLength(1);
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('tirilla'),
    });
    expect(resultado.contextoParcheado.pqrsfCorreo).toBe('carlos@example.com');
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

  it('correo sin estructura válida no avanza de estado (aplica a PQR y Facturación por igual)', () => {
    const resultado = desdeEsperandoPqrsfCorreo(entradaBase({ mensajeTexto: 'no-es-un-correo' }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);
    expect(resultado.registro).toBeNull();
    expect(resultado.respuestas[0]).toMatchObject({ contenido: expect.stringContaining('no parece válido') });
    // No se pierde el contexto ya capturado (identificación, tipo, etc.).
    expect(resultado.contextoParcheado).toEqual(entradaBase().contexto);
  });

  it('mensaje no-texto se queda en ESPERANDO_PQRSF_CORREO con respuesta genérica', () => {
    const resultado = desdeEsperandoPqrsfCorreo(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);
    expect(resultado.respuestas[0].tipo).toBe('texto');
  });

  it('selección de un botón de un menú anterior: rechaza y NO lo guarda como correo', () => {
    const resultado = desdeEsperandoPqrsfCorreo(
      entradaBase({ mensajeTexto: 'MENU_ANTERIOR_SERVICIO', esSeleccionInteractiva: true }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_CORREO);
    expect(resultado.contextoParcheado).toEqual(entradaBase().contexto);
    expect(resultado.respuestas[0]).toMatchObject({ contenido: expect.stringContaining('menú anterior') });
  });
});
