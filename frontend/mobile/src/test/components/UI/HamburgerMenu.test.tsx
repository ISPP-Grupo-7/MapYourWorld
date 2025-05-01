/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock para navegación
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('HamburgerMenu', () => {
  test('dummy test', () => {
    expect(true).toBe(true);
  });
}); 