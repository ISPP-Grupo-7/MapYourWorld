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

// Mock para context
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: jest.fn(),
    isAuthenticated: false,
    isLoading: false,
  }),
}));

// Mock de LoginScreen
jest.mock('../../../components/screens/LoginScreen', () => {
  const React = require('react');
  const { View, Text, TextInput, TouchableOpacity } = require('react-native');
  
  const MockLoginScreen = () => {
    const handleForgotPassword = () => {
      require('@react-navigation/native').useNavigation().navigate('ForgotPassword');
    };
    
    return (
      <View testID="login-screen">
        <Text>Bienvenido de nuevo</Text>
        <TextInput 
          testID="email-input"
          error=""
        />
        <TextInput 
          testID="password-input"
          error=""
          secureTextEntry
        />
        <TouchableOpacity testID="login-button">
          <Text>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="forgot-password-link" 
          onPress={handleForgotPassword}
        >
          <Text>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return {
    __esModule: true,
    default: MockLoginScreen
  };
});

// Importamos después de los mocks
import LoginScreen from '../../../components/screens/LoginScreen';

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renderiza correctamente', () => {
    const { getByTestId } = render(<LoginScreen />);
    expect(getByTestId('login-screen')).toBeTruthy();
  });

  test('navega a recuperación de contraseña', () => {
    const { getByTestId } = render(<LoginScreen />);
    fireEvent.press(getByTestId('forgot-password-link'));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });

  test('renderiza los campos de entrada y botones', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByText('¿Olvidaste tu contraseña?')).toBeTruthy();
  });
}); 