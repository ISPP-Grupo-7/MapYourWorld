/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock para Feather
jest.mock('@expo/vector-icons/Feather', () => 'MockedFeatherIcon');

describe('TextInput', () => {
  test('dummy test', () => {
    expect(true).toBe(true);
  });
}); 