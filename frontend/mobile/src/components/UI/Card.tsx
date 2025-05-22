/**
 * Componente Card
 * Tarjeta estilizada con Tailwind CSS que soporta diferentes variantes y estilos
 */
import React from 'react';
import { View, ViewProps } from 'react-native';
import { styled } from 'nativewind';

// Aplicamos styled al componente View
const StyledView = styled(View);

interface CardProps extends ViewProps {
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  bgColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  shadow = 'md',
  padding = 'md',
  border = false,
  rounded = 'md',
  bgColor = 'bg-white',
  className = '',
  children,
  ...props
}) => {
  // Clases para sombras
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  // Clases para padding
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  };

  // Clases para bordes redondeados
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  // Clase para borde
  const borderClass = border ? 'border border-[#ade8f4]' : '';

  // Combinación de todas las clases
  const cardClasses = `
    ${bgColor}
    ${shadowClasses[shadow]}
    ${paddingClasses[padding]}
    ${roundedClasses[rounded]}
    ${borderClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <StyledView className={cardClasses} {...props}>
      {children}
    </StyledView>
  );
};

/**
 * Componentes adicionales para estructurar el contenido de la tarjeta
 */

interface CardSectionProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardSectionProps> = ({
  className = '',
  children,
  ...props
}) => (
  <StyledView className={`mb-3 ${className}`} {...props}>
    {children}
  </StyledView>
);

export const CardBody: React.FC<CardSectionProps> = ({
  className = '',
  children,
  ...props
}) => (
  <StyledView className={className} {...props}>
    {children}
  </StyledView>
);

export const CardFooter: React.FC<CardSectionProps> = ({
  className = '',
  children,
  ...props
}) => (
  <StyledView className={`mt-3 ${className}`} {...props}>
    {children}
  </StyledView>
); 