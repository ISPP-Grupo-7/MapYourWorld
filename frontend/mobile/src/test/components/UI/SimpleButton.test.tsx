import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity, View } from 'react-native';

// Componente simple sin nativewind
const SimpleButton = ({ onPress, title }: { onPress: () => void; title: string }) => (
  <TouchableOpacity onPress={onPress}>
    <Text>{title}</Text>
  </TouchableOpacity>
);

describe('SimpleButton Component', () => {
  test('renderiza correctamente', () => {
    const { getByText } = render(<SimpleButton title="Test" onPress={() => {}} />);
    expect(getByText('Test')).toBeTruthy();
  });

  test('llama a onPress cuando se presiona', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<SimpleButton title="Test Button" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Test Button'));
    
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
}); 