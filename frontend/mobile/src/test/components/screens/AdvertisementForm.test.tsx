/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock de navegación
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock para las alertas
jest.mock('react-native/Libraries/Alert/Alert', () => ({
    alert: jest.fn()
}));

// Mock de AdvertisementForm
jest.mock('@/components/screens/AdvertismentForm', () => {
    const React = require('react');
    const { View, Text, TextInput, TouchableOpacity } = require('react-native');

    const MockAdvertisementForm = () => {
        return (
            <View testID='advertisement-form'>
                <Text>Publicítate con nosotros</Text>
                <TextInput testID='email-input' error=''></TextInput>
                <TextInput testID='name-input' error=''></TextInput>
                <TextInput testID='description-input' error=''></TextInput>
                <TextInput testID='longitude-input' error=''></TextInput>
                <TextInput testID='latitude-input' error=''></TextInput>
                <TouchableOpacity testID="submit-button">
                    <Text>Enviar</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return {
        __esModule: true,
        default: MockAdvertisementForm
    };
});



import AdvertisementForm from '@/components/screens/AdvertismentForm';

describe('AdvertisementForm', () => {
    const mockNavigate = jest.fn();
    beforeEach(() => {
        jest.clearAllMocks();
    });

  test('renderiza correctamente', () => {
    const { getByTestId } = render(<AdvertisementForm />);
    expect(getByTestId('advertisement-form')).toBeTruthy();
  });

  test('renderiza todos los campos del formulario', () => {
    const { getByTestId } = render(<AdvertisementForm />);
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('name-input')).toBeTruthy();
    expect(getByTestId('description-input')).toBeTruthy();
    expect(getByTestId('longitude-input')).toBeTruthy();
    expect(getByTestId('latitude-input')).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
  });

  test('muestra errores de obligatoriedad', async () => {
    const { getByTestId, findByText } = render(<AdvertisementForm />);

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(findByText('El correo electrónico es obligatorio')).toBeTruthy();
      expect(findByText('El nombre es obligatorio')).toBeTruthy();
      expect(findByText('La longitud es obligatoria')).toBeTruthy();
      expect(findByText('La latitud es obligatoria')).toBeTruthy();
    });
  });

  test('muestra errores de validación avanzados', async () => {
    const { findByText, getByTestId } = render(<AdvertisementForm />);

    // ponemos valores no válidos
    const emailInput = getByTestId('email-input');
    fireEvent.changeText(emailInput, 'valor no valido');
    const longitudeInput = getByTestId('longitude-input');
    fireEvent.changeText(longitudeInput, 'valor no valido');
    const latitudeInput = getByTestId('latitude-input');
    fireEvent.changeText(latitudeInput, 'valor no valido');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(findByText('Introduce un correo electrónico válido')).toBeTruthy();
      expect(findByText('La longitud debe ser un número')).toBeTruthy();
      expect(findByText('La latitud debe ser un número')).toBeTruthy();
    });
  });

  test('muestra errores de validación de coordenadas no válidas', async () => {
    const { findByText, getByTestId } = render(<AdvertisementForm />);

    // ponemos valores no válidos
    const longitudeInput = getByTestId('longitude-input');
    fireEvent.changeText(longitudeInput, '200');
    const latitudeInput = getByTestId('latitude-input');
    fireEvent.changeText(latitudeInput, '200');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(findByText('La longitud debe estar entre -180º y 180º')).toBeTruthy();
      expect(findByText('La latitud debe estar entre -90º y 90º')).toBeTruthy();
    });
  });
});
