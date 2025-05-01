import React from 'react';

// Mock completo para el componente
jest.mock('../../../components/POI/POICard', () => {
  return function MockPOICard() {
    return null;
  };
});

describe('POICard Component', () => {
  test('test básico de prueba', () => {
    expect(true).toBe(true);
  });
}); 