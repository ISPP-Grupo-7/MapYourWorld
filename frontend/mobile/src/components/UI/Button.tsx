/**
 * Componente Button
 * Botón estilizado con Tailwind CSS que soporta diferentes variantes y tamaños
 */
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { styled } from 'nativewind';

// Aplicamos styled a los componentes nativos
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
}

const Button = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  textClassName = '',
  style = {},
}: ButtonProps) => {
  // Definimos las clases base según la variante
  let buttonClasses = 'py-3 px-6 rounded-md';
  let textClasses = 'font-medium text-center';
  
  if (fullWidth) {
    buttonClasses += ' w-full';
  }
  
  // Aplicamos estilos según la variante
  switch (variant) {
    case 'primary':
      buttonClasses += ' bg-teal-500';
      textClasses += ' text-white';
      break;
    case 'secondary':
      buttonClasses += ' bg-white border border-gray-300';
      textClasses += ' text-gray-700';
      break;
    case 'outline':
      buttonClasses += ' bg-transparent border border-teal-500';
      textClasses += ' text-teal-500';
      break;
    default:
      break;
  }
  
  // Si está deshabilitado, añadimos opacidad
  if (disabled) {
    buttonClasses += ' opacity-50';
  }
  
  // Añadimos clases personalizadas
  buttonClasses += ` ${className}`;
  textClasses += ` ${textClassName}`;
  
  return (
    <StyledTouchableOpacity
      className={buttonClasses}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={style}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#0003ff'} />
      ) : (
        <StyledText className={textClasses}>{title}</StyledText>
      )}
    </StyledTouchableOpacity>
  );
};

export default Button; 