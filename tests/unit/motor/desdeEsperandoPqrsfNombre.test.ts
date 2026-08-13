import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { desdeEsperandoPqrsfNombre } from '../../../src/motor/transiciones/desdeEsperandoPqrsfNombre';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
    mensajeTexto: 'Carlos Pérez',
    esImagen: false,
    contexto: { pqrsfTipo: 'PQR' },
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    aceptoTratamientoDatos: true,
    esSeleccionInteractiva: false,
    ...overrides,
  };
}

describe('desdeEsperandoPqrsfNombre', () => {
  it('caso feliz: guarda el nombre y pasa a ESPERANDO_PQRSF_IDENTIFICACION', () => {
    const resultado = desdeEsperandoPqrsfNombre(entradaBase());

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION);
    expect(resultado.contextoParcheado.nombre).toBe('Carlos Pérez');
    expect(resultado.respuestas[0]).toMatchObject({
      tipo: 'texto',
      contenido: expect.stringContaining('Carlos Pérez'),
    });
    expect(resultado.registro).toBeNull();
  });

  it('mensaje no-texto se queda en ESPERANDO_PQRSF_NOMBRE con respuesta genérica', () => {
    const resultado = desdeEsperandoPqrsfNombre(entradaBase({ mensajeTexto: null }));

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);
    expect(resultado.respuestas[0].tipo).toBe('texto');
    expect(resultado.contextoParcheado).toEqual(entradaBase().contexto);
  });

  it('selección de un botón de un menú anterior: rechaza y NO lo guarda como nombre', () => {
    const resultado = desdeEsperandoPqrsfNombre(
      entradaBase({ mensajeTexto: 'MENU_ANTERIOR_SERVICIO', esSeleccionInteractiva: true }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_PQRSF_NOMBRE);
    expect(resultado.contextoParcheado.nombre).toBeUndefined();
    expect(resultado.respuestas[0]).toMatchObject({ tipo: 'texto', contenido: expect.stringContaining('menú anterior') });
  });
});
