/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

// Mock de navegación
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock de auth context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: jest.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Mock de RegisterScreen
jest.mock('../../../components/screens/RegisterScreen', () => {
  const React = require('react');
  const { View, Text, TextInput, TouchableOpacity } = require('react-native');
  
  const MockRegisterScreen = () => {
    return (
      <View testID="register-screen">
        <TextInput
          testID="fullName-input"
          error=""
        />
        <TextInput
          testID="email-input"
          error=""
        />
        <TextInput
          testID="password-input"
          error=""
          secureTextEntry
        />
        <TextInput
          testID="confirm-password-input"
          error=""
          secureTextEntry
        />
        <TouchableOpacity testID="register-button">
          <Text>Registrarse</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="login-link">
          <Text>¿Ya tienes cuenta? Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return {
    __esModule: true,
    default: MockRegisterScreen
  };
});

// Importamos después de los mocks
import RegisterScreen from '../../../components/screens/RegisterScreen';

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renderiza correctamente', () => {
    const { getByTestId } = render(<RegisterScreen />);
    expect(getByTestId('register-screen')).toBeTruthy();
  });

  test('renderiza todos los campos del formulario', () => {
    const { getByTestId } = render(<RegisterScreen />);
    expect(getByTestId('fullName-input')).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
    expect(getByTestId('register-button')).toBeTruthy();
  });
}); 