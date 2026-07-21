import { describe, expect, it } from 'vitest';
import { EstadoConversacion } from '../../../src/dominio/estadoConversacion';
import { procesarTransicion } from '../../../src/motor/motorEstados';
import type { EntradaMotor } from '../../../src/motor/motorEstados';

function entradaBase(overrides: Partial<EntradaMotor> = {}): EntradaMotor {
  return {
    estadoActual: EstadoConversacion.INICIO,
    mensajeTexto: 'Hola',
    contexto: {},
    clienteYaTieneNombre: false,
    nombreCliente: null,
    huboInactividad: false,
    ...overrides,
  };
}

describe('procesarTransicion — enrutamiento de la tabla', () => {
  it('enruta cada estado a su transición correspondiente (grafo completo)', () => {
    const casos: Array<{
      origen: EstadoConversacion;
      mensajeTexto: string;
      destinoEsperado: EstadoConversacion;
      overrides?: Partial<EntradaMotor>;
    }> = [
      { origen: EstadoConversacion.INICIO, mensajeTexto: 'Hola', destinoEsperado: EstadoConversacion.MENU_PRINCIPAL },
      {
        origen: EstadoConversacion.MENU_PRINCIPAL,
        mensajeTexto: 'Servicio al cliente',
        destinoEsperado: EstadoConversacion.SERVICIO_CLIENTE,
      },
      {
        origen: EstadoConversacion.MENU_PRINCIPAL,
        mensajeTexto: 'Ventas',
        destinoEsperado: EstadoConversacion.ESPERANDO_NOMBRE,
      },
      {
        origen: EstadoConversacion.SERVICIO_CLIENTE,
        mensajeTexto: 'Quejas o reclamos',
        destinoEsperado: EstadoConversacion.ESPERANDO_QUEJA,
      },
      {
        origen: EstadoConversacion.ESPERANDO_QUEJA,
        mensajeTexto: 'el pedido llegó mal',
        destinoEsperado: EstadoConversacion.HANDOFF_HUMANO,
      },
      {
        origen: EstadoConversacion.CONFIRMAR_NOMBRE_PERFIL,
        mensajeTexto: 'Usar este nombre',
        destinoEsperado: EstadoConversacion.ESPERANDO_CIUDAD,
        overrides: { nombrePerfilWhatsApp: 'Andrew' },
      },
      {
        origen: EstadoConversacion.ESPERANDO_NOMBRE,
        mensajeTexto: 'Carlos',
        destinoEsperado: EstadoConversacion.ESPERANDO_CIUDAD,
      },
      {
        origen: EstadoConversacion.ESPERANDO_CIUDAD,
        mensajeTexto: 'Bogotá',
        destinoEsperado: EstadoConversacion.MENU_VENTAS,
      },
      {
        origen: EstadoConversacion.MENU_VENTAS,
        mensajeTexto: 'Detal',
        destinoEsperado: EstadoConversacion.CATALOGO_DETAL,
      },
      {
        origen: EstadoConversacion.MENU_VENTAS,
        mensajeTexto: 'DISTRIBUCION',
        destinoEsperado: EstadoConversacion.CATALOGO_DISTRIB,
      },
      {
        origen: EstadoConversacion.CATALOGO_DETAL,
        mensajeTexto: 'Continuar pedido',
        destinoEsperado: EstadoConversacion.HANDOFF_HUMANO,
      },
      {
        origen: EstadoConversacion.CATALOGO_DISTRIB,
        mensajeTexto: 'Continuar pedido',
        destinoEsperado: EstadoConversacion.HANDOFF_HUMANO,
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

  it('MENU_PRINCIPAL con "Ventas" y cliente existente salta directo a ESPERANDO_CIUDAD', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.MENU_PRINCIPAL,
        mensajeTexto: 'Ventas',
        clienteYaTieneNombre: true,
        nombreCliente: 'Ana',
      }),
    );
    expect(resultado.nuevoEstado).toBe(EstadoConversacion.ESPERANDO_CIUDAD);
  });
});

describe('procesarTransicion — regla de reinicio por inactividad', () => {
  it('si huboInactividad y el estado no es INICIO, se procesa como si viniera de INICIO (siempre a MENU_PRINCIPAL)', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.CATALOGO_DETAL,
        huboInactividad: true,
        clienteYaTieneNombre: false,
        nombreCliente: null,
        mensajeTexto: 'sigo aquí',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });

  it('si huboInactividad y el cliente ya tiene nombre, el saludo de reinicio es el personalizado', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.HANDOFF_HUMANO,
        huboInactividad: true,
        clienteYaTieneNombre: true,
        nombreCliente: 'Ana',
        mensajeTexto: 'sigo aquí',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
    expect(resultado.respuestas[0]).toMatchObject({ texto: expect.stringContaining('Ana') });
  });

  it('si huboInactividad pero el estado YA es INICIO, no hay reinicio especial (comportamiento normal)', () => {
    const resultado = procesarTransicion(
      entradaBase({ estadoActual: EstadoConversacion.INICIO, huboInactividad: true }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.MENU_PRINCIPAL);
  });

  it('sin inactividad, un estado distinto de INICIO respeta su transición normal (no se reinicia)', () => {
    const resultado = procesarTransicion(
      entradaBase({
        estadoActual: EstadoConversacion.CATALOGO_DETAL,
        huboInactividad: false,
        mensajeTexto: 'Ver más',
      }),
    );

    expect(resultado.nuevoEstado).toBe(EstadoConversacion.CATALOGO_DETAL);
  });
});
