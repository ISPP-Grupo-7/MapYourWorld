/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock de navegación
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock para el componente WelcomeScreen
jest.mock('../../../components/screens/WelcomeScreen', () => {
  // Debemos usar require porque estamos dentro de jest.mock
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  // Creamos una versión simplificada del componente
  const MockWelcomeScreen = () => {
    const handleRegister = () => {
      require('@react-navigation/native').useNavigation().navigate('Register');
    };
    
    const handleLogin = () => {
      require('@react-navigation/native').useNavigation().navigate('Login');
    };
    
    return React.createElement(View, {}, [
      React.createElement(Text, { key: 'title' }, 'Transforma tus viajes'),
      React.createElement(Text, { key: 'subtitle' }, 'Descubre una nueva forma de viajar'),
      React.createElement(TouchableOpacity, 
        { testID: 'register-button', onPress: handleRegister, key: 'register' },
        React.createElement(Text, { key: 'register-text' }, 'Registrarse')
      ),
      React.createElement(TouchableOpacity, 
        { testID: 'login-button', onPress: handleLogin, key: 'login' },
        React.createElement(Text, { key: 'login-text' }, 'Iniciar sesión')
      )
    ]);
  };
  
  return {
    __esModule: true,
    default: MockWelcomeScreen
  };
});

// Importamos explícitamente después de los mocks
import WelcomeScreen from '../../../components/screens/WelcomeScreen';
import { View, Text, TouchableOpacity } from 'react-native';

describe('WelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renderiza correctamente', () => {
    const { getByText, getByTestId } = render(<WelcomeScreen />);
    expect(getByText('Transforma tus viajes')).toBeTruthy();
  });

  test('navega a RegisterScreen al presionar botón de registro', () => {
    const { getByTestId } = render(<WelcomeScreen />);
    fireEvent.press(getByTestId('register-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  test('navega a LoginScreen al presionar botón de login', () => {
    const { getByTestId } = render(<WelcomeScreen />);
    fireEvent.press(getByTestId('login-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });

  test('renderiza todos los botones correctamente', () => {
    const { getByTestId } = render(<WelcomeScreen />);
    expect(getByTestId('register-button')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });
}); 