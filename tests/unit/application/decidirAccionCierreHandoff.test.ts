import { describe, expect, it } from 'vitest';
import { decidirAccionCierreHandoff } from '../../../src/application/decidirAccionCierreHandoff';

// Ventana de 30 min, aviso previo 5 min antes (25 min) — mismos valores por defecto que env.ts.
const VENTANA_MIN = 30;
const AVISO_PREVIO_MIN = 5;

function hace(minutos: number, ahora: Date): Date {
  return new Date(ahora.getTime() - minutos * 60_000);
}

describe('decidirAccionCierreHandoff', () => {
  const ahora = new Date('2026-01-01T12:00:00.000Z');

  it('antes del umbral de aviso: no hace nada', () => {
    const resultado = decidirAccionCierreHandoff(
      { contexto: {}, actualizadaEn: hace(10, ahora) },
      ahora,
      VENTANA_MIN,
      AVISO_PREVIO_MIN,
    );

    expect(resultado.tipo).toBe('ninguna');
  });

  it('al llegar al umbral de aviso (25 min): manda el aviso previo y marca el contexto', () => {
    const actualizadaEn = hace(25, ahora);
    const resultado = decidirAccionCierreHandoff(
      { contexto: {}, actualizadaEn },
      ahora,
      VENTANA_MIN,
      AVISO_PREVIO_MIN,
    );

    expect(resultado).toEqual({
      tipo: 'aviso_previo',
      contextoActualizado: { avisoPrevioCierreEnviadoPara: actualizadaEn.toISOString() },
    });
  });

  it('si el aviso ya se envió para esta misma actualizadaEn, no lo repite', () => {
    const actualizadaEn = hace(27, ahora);
    const resultado = decidirAccionCierreHandoff(
      { contexto: { avisoPrevioCierreEnviadoPara: actualizadaEn.toISOString() }, actualizadaEn },
      ahora,
      VENTANA_MIN,
      AVISO_PREVIO_MIN,
    );

    expect(resultado.tipo).toBe('ninguna');
  });

  it('si el cliente volvió a escribir (actualizadaEn más reciente), puede avisar de nuevo aunque antes ya se hubiera avisado', () => {
    const marcaVieja = hace(40, ahora).toISOString();
    const actualizadaEnNueva = hace(26, ahora);
    const resultado = decidirAccionCierreHandoff(
      { contexto: { avisoPrevioCierreEnviadoPara: marcaVieja }, actualizadaEn: actualizadaEnNueva },
      ahora,
      VENTANA_MIN,
      AVISO_PREVIO_MIN,
    );

    expect(resultado.tipo).toBe('aviso_previo');
  });

  it('al llegar a los 30 min: cierra, sin importar si ya se había avisado', () => {
    const resultado = decidirAccionCierreHandoff(
      { contexto: { avisoPrevioCierreEnviadoPara: hace(30, ahora).toISOString() }, actualizadaEn: hace(30, ahora) },
      ahora,
      VENTANA_MIN,
      AVISO_PREVIO_MIN,
    );

    expect(resultado).toEqual({ tipo: 'cierre' });
  });

  it('pasados los 30 min: sigue cerrando (no se queda atascado si la revisión se retrasó)', () => {
    const resultado = decidirAccionCierreHandoff(
      { contexto: {}, actualizadaEn: hace(45, ahora) },
      ahora,
      VENTANA_MIN,
      AVISO_PREVIO_MIN,
    );

    expect(resultado).toEqual({ tipo: 'cierre' });
  });
});
