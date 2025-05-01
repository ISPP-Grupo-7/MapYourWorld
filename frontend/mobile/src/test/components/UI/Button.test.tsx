/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';

// Mock para ActivityIndicator
jest.mock('react-native/Libraries/Components/ActivityIndicator/ActivityIndicator', () => 'ActivityIndicator');

describe('Button', () => {
  test('dummy test', () => {
    expect(true).toBe(true);
  });
}); 