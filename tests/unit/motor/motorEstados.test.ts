import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.INICIO,
    mensajeTexto: 'Hola',
    esImagen: false,
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    aceptoTratamientoDatos: false,
    ...overrides,
  };
}

describe('procesarTransicion — enrutamiento de la tabla (grafo completo)', () => {
  it('enruta cada estado a su transición correspondiente', () => {
    const casos: Array<{
      origen: EstadoConversacion;
      mensajeTexto: string;
      destinoEsperado: EstadoConversacion;
      overrides?: Partial<EntradaMotor>;
    }> = [
      {
        origen: EstadoConversacion.INICIO,
        mensajeTexto: 'Hola',
        destinoEsperado: EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
      },
      {
        origen: EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
        mensajeTexto: 'Autorizo',
        destinoEsperado: EstadoConversacion.ESPERANDO_NOMBRE,
      },
      {
        origen: EstadoConversacion.ESPERANDO_NOMBRE,
        mensajeTexto: 'Carlos',
        destinoEsperado: EstadoConversacion.MENU_PRINCIPAL,
      },
      {
        origen: EstadoConversacion.MENU_PRINCIPAL,
        mensajeTexto: 'Servicio al cliente',
        destinoEsperado: EstadoConversacion.SERVICIO_CLIENTE,
        overrides: { clienteYaTieneNombre: true, nombreCliente: 'Carlos', aceptoTratamientoDatos: true },
      },
      {
        origen: EstadoConversacion.MENU_PRINCIPAL,
        mensajeTexto: 'Ventas',
        destinoEsperado: EstadoConversacion.MENU_VENTAS,
        overrides: { clienteYaTieneNombre: true, nombreCliente: 'Carlos', aceptoTratamientoDatos: true },
      },
      {
        origen: EstadoConversacion.SERVICIO_CLIENTE,
        mensajeTexto: 'PQRSF',
        destinoEsperado: EstadoConversacion.ESPERANDO_TIPO_PQRSF,
      },
      {
        origen: EstadoConversacion.SERVICIO_CLIENTE,
        mensajeTexto: 'Facturación',
        destinoEsperado: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
        overrides: { clienteYaTieneNombre: true, nombreCliente: 'Carlos' },
      },
      {
        origen: EstadoConversacion.ESPERANDO_TIPO_PQRSF,
        mensajeTexto: 'PQR',
        destinoEsperado: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
      },
      {
        origen: EstadoConversacion.ESPERANDO_PQRSF_NOMBRE,
        mensajeTexto: 'Carlos Pérez',
        destinoEsperado: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
      },
      {
        origen: EstadoConversacion.ESPERANDO_PQRSF_IDENTIFICACION,
        mensajeTexto: '123456789',
        destinoEsperado: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
      },
      {
        origen: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
        mensajeTexto: 'carlos@example.com',
        destinoEsperado: EstadoConversacion.ESPERANDO_QUEJA,
        overrides: { contexto: { pqrsfTipo: 'PQR' } },
      },
      {
        origen: EstadoConversacion.ESPERANDO_PQRSF_CORREO,
        mensajeTexto: 'carlos@example.com',
        destinoEsperado: EstadoConversacion.ESPERANDO_PQRSF_TIRILLA,
        overrides: { contexto: { pqrsfTipo: 'Facturacion' } },
      },
      {
        origen: EstadoConversacion.ESPERANDO_PQRSF_TIRILLA,
        mensajeTexto: 'foto',
        destinoEsperado: EstadoConversacion.INICIO,
        overrides: { esImagen: true, contexto: { pqrsfTipo: 'Facturacion' } },
      },
      {
        origen: EstadoConversacion.ESPERANDO_QUEJA,
        mensajeTexto: 'el pedido llegó mal',
        destinoEsperado: EstadoConversacion.HANDOFF_HUMANO,
      },
      {
        origen: EstadoConversacion.MENU_VENTAS,
        mensajeTexto: 'Detal',
        destinoEsperado: EstadoConversacion.CATALOGO_ENVIADO,
      },
      {
        origen: EstadoConversacion.CATALOGO_ENVIADO,
        mensajeTexto: 'Continuar pedido',
        destinoEsperado: EstadoConversacion.HANDOFF_HUMANO,
        overrides: { contexto: { canal: 'detal' } },
      },
      {
        origen: EstadoConversacion.CATALOGO_ENVIADO,
        mensajeTexto: '1',
        destinoEsperado: EstadoConversacion.MENU_PRINCIPAL,
      },
      {
        origen: EstadoConversacion.CATALOGO_ENVIADO,
        mensajeTexto: 'Menú anterior',
        destinoEsperado: EstadoConversacion.MENU_VENTAS,
      },
      {
        origen: EstadoConversacion.HANDOFF_HUMANO,
        mensajeTexto: 'sigo aquí',
        destinoEsperado: EstadoConversacion.HANDOFF_HUMANO,
      },
    ];

    for (const { origen, mensajeTexto, destinoEsperado, overrides } of casos) {
      const resultado = procesarTransicion(
        entradaBase({ estadoActual: origen, mensajeTexto, ...overrides }),
      );
      expect(resultado.nuevoEstado, `origen: ${origen}`).toBe(destinoEsperado);
    }
  });

  it('ESPERANDO_CONSENTIMIENTO_DATOS con cliente que ya tiene nombre salta directo a MENU_PRINCIPAL', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS,
        mensajeTexto: 'Autorizo',
        clienteYaTieneNombre: true,
        nombreCliente: 'Ana',
      }),
    );
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });
});

describe('procesarTransicion — regla de reinicio por inactividad', () => {
  it('si huboInactividad y el estado no es INICIO, se procesa como si viniera de INICIO', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.CATALOGO_ENVIADO,
        huboInactividad: true,
        clienteYaTieneNombre: false,
        nombreCliente: null,
        aceptoTratamientoDatos: false,
        mensajeTexto: 'sigo aquí',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS);
  });

  it('si huboInactividad, el cliente ya tiene nombre y ya autorizó, el reinicio va a MENU_PRINCIPAL personalizado', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.ESPERANDO_NOMBRE,
        huboInactividad: true,
        clienteYaTieneNombre: true,
        nombreCliente: 'Ana',
        aceptoTratamientoDatos: true,
        mensajeTexto: 'sigo aquí',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({ texto: expect.stringContaining('Ana') });
  });

  it('HANDOFF_HUMANO está exento del reinicio por inactividad — se queda ahí en vez de volver a MENU_PRINCIPAL', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.HANDOFF_HUMANO,
        huboInactividad: true,
        clienteYaTieneNombre: true,
        nombreCliente: 'Ana',
        aceptoTratamientoDatos: true,
        mensajeTexto: 'sigo aquí',
      }),
    );

    // El único camino de salida de HANDOFF_HUMANO es tareaCierreHandoff.ts, no este reinicio
    // reactivo (ver motorEstados.ts y docs/FLUJO_ESTADOS.md).
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.HANDOFF_HUMANO);
  });

  it('si huboInactividad pero el estado YA es INICIO, no hay reinicio especial (comportamiento normal)', () => {
    const resultado = procesarTransicion(
      entradaBase({ estadoActual: EstadoConversacion.INICIO, huboInactividad: true }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CONSENTIMIENTO_DATOS);
  });

  it('sin inactividad, un estado distinto de INICIO respeta su transición normal (no se reinicia)', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.CATALOGO_ENVIADO,
        huboInactividad: false,
        mensajeTexto: 'Menú anterior',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_VENTAS);
  });
});
