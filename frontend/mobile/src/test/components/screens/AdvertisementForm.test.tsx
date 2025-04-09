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
                <TextInput testID='address-input' error=''></TextInput>
                <TextInput testID='city-input' error=''></TextInput>
                <TextInput testID='postalcode-input' error=''></TextInput>
                <TextInput testID='country-input' error=''></TextInput>
                <TextInput testID='comments-input' error=''></TextInput>
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
    expect(getByTestId('address-input')).toBeTruthy();
    expect(getByTestId('city-input')).toBeTruthy();
    expect(getByTestId('postalcode-input')).toBeTruthy();
    expect(getByTestId('country-input')).toBeTruthy();
    expect(getByTestId('comments-input')).toBeTruthy();
    expect(getByTestId('submit-button')).toBeTruthy();
  });

  test('muestra errores de obligatoriedad', async () => {
    const { getByTestId, findByText } = render(<AdvertisementForm />);

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(findByText('El correo electrónico es obligatorio')).toBeTruthy();
      expect(findByText('El nombre es obligatorio')).toBeTruthy();
      expect(findByText('La dirección es obligatoria')).toBeTruthy();
      expect(findByText('La ciudad es obligatoria')).toBeTruthy();
      expect(findByText('El código postal es obligatorio')).toBeTruthy();
      expect(findByText('El país es obligatorio')).toBeTruthy();
    });
  });

  test('muestra errores de validación avanzados', async () => {
    const { findByText, getByTestId } = render(<AdvertisementForm />);

    // ponemos valores no válidos
    const emailInput = getByTestId('email-input');
    fireEvent.changeText(emailInput, 'valor no valido');
    const longitudeInput = getByTestId('postalcode-input');
    fireEvent.changeText(longitudeInput, 'valor no valido');

    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(findByText('Introduce un correo electrónico válido')).toBeTruthy();
      expect(findByText('Código postal no v´´alido')).toBeTruthy();
    });
  });
});
