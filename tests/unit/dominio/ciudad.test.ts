import { describe, expect, it } from 'vitest';
import { Ciudad, parsearCiudad, tieneCobertura } from '../../../src/dominio/ciudad';

describe('parsearCiudad', () => {
  it('reconoce Bogotá con tilde y mayúscula inicial', () => {
    expect(parsearCiudad('Bogotá')).toBe(Ciudad.BOGOTA);
  });

  it('reconoce Bogotá sin tilde', () => {
    expect(parsearCiudad('bogota')).toBe(Ciudad.BOGOTA);
  });

  it('reconoce ciudades en mayúsculas completas', () => {
    expect(parsearCiudad('BOGOTA')).toBe(Ciudad.BOGOTA);
    expect(parsearCiudad('YOPAL')).toBe(Ciudad.YOPAL);
    expect(parsearCiudad('VILLAVICENCIO')).toBe(Ciudad.VILLAVICENCIO);
  });

  it('reconoce Yopal y Villavicencio con variaciones de formato', () => {
    expect(parsearCiudad('  yopal  ')).toBe(Ciudad.YOPAL);
    expect(parsearCiudad('Villavicencio, Meta')).toBe(Ciudad.VILLAVICENCIO);
  });

  it('reconoce variantes como "Bogotá D.C."', () => {
    expect(parsearCiudad('Bogotá D.C.')).toBe(Ciudad.BOGOTA);
  });

  it('cae en Ciudad.OTRA para una ciudad no reconocida', () => {
    expect(parsearCiudad('Medellín')).toBe(Ciudad.OTRA);
    expect(parsearCiudad('Cali')).toBe(Ciudad.OTRA);
  });

  it('nunca falla: cadena vacía cae en Ciudad.OTRA', () => {
    expect(parsearCiudad('')).toBe(Ciudad.OTRA);
    expect(parsearCiudad('   ')).toBe(Ciudad.OTRA);
  });
});

describe('tieneCobertura', () => {
  it('devuelve true para Bogotá, Yopal y Villavicencio', () => {
    expect(tieneCobertura(Ciudad.BOGOTA)).toBe(true);
    expect(tieneCobertura(Ciudad.YOPAL)).toBe(true);
    expect(tieneCobertura(Ciudad.VILLAVICENCIO)).toBe(true);
  });

  it('devuelve false para Ciudad.OTRA', () => {
    expect(tieneCobertura(Ciudad.OTRA)).toBe(false);
  });
});
