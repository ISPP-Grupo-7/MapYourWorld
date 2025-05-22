/**
 * Componente POICard
 * Muestra la información de un Punto de Interés (POI) en una tarjeta estilizada
 */
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { styled } from 'nativewind';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Importamos nuestros componentes UI
import { Card, CardHeader, CardBody, CardFooter } from '@frontend/mobile/src/components/UI/Card';
import { Button } from '@frontend/mobile/src/components/UI/Button';

// Aplicamos styled a los componentes nativos
const StyledImage = styled(Image);
const StyledText = styled(TouchableOpacity);
const StyledView = styled(View);
const StyledIcon = styled(MaterialIcons);

// Alias para el componente Icon
const Icon = StyledIcon;

// Interfaz para los datos del POI
interface POI {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  location: {
    latitude: number;
    longitude: number;
  };
  category: string;
  rating: number;
  isVisited: boolean;
  district: string;
}

interface POICardProps {
  poi: POI;
  onPress: (poiId: string) => void;
  onNavigatePress: (latitude: number, longitude: number) => void;
  onSavePress: (poiId: string) => void;
  compact?: boolean;
}

export const POICard: React.FC<POICardProps> = ({
  poi,
  onPress,
  onNavigatePress,
  onSavePress,
  compact = false,
}) => {
  // Función para renderizar estrellas según la calificación
  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={`full-${i}`} name="star" size={16} color="#007df3" />
      );
    }
    
    // Media estrella si corresponde
    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half" size={16} color="#007df3" />
      );
    }
    
    // Estrellas vacías
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-outline" size={16} color="#007df3" />
      );
    }
    
    return stars;
  };

  // Versión compacta de la tarjeta (para listas)
  if (compact) {
    return (
      <Card 
        className="flex-row mb-3" 
        padding="sm"
        onTouchEnd={() => onPress(poi.id)}
      >
        <StyledImage
          source={{ uri: poi.imageUrl }}
          className="w-16 h-16 rounded-md mr-3"
        />
        <StyledView className="flex-1 justify-center">
          <StyledText className="text-base font-bold text-primary-800 mb-1">
            {poi.name}
          </StyledText>
          <StyledView className="flex-row items-center mb-1">
            <Icon name="place" size={14} color="#007df3" />
            <StyledText className="text-xs text-gray-600 ml-1">
              {poi.district}
            </StyledText>
          </StyledView>
          <StyledView className="flex-row">
            {renderRating(poi.rating)}
          </StyledView>
        </StyledView>
        <StyledView className="justify-center">
          <TouchableOpacity 
            onPress={() => onNavigatePress(poi.location.latitude, poi.location.longitude)}
          >
            <Icon name="directions" size={24} color="#007df3" />
          </TouchableOpacity>
        </StyledView>
      </Card>
    );
  }

  // Versión completa de la tarjeta (para detalles)
  return (
    <Card className="mb-4">
      <CardHeader>
        <StyledImage
          source={{ uri: poi.imageUrl }}
          className="w-full h-48 rounded-t-lg"
        />
        {poi.isVisited && (
          <StyledView className="absolute top-2 right-2 bg-green-500 px-2 py-1 rounded-full">
            <StyledText className="text-white text-xs font-bold">
              Visitado
            </StyledText>
          </StyledView>
        )}
      </CardHeader>
      
      <CardBody>
        <StyledView className="flex-row justify-between items-center mb-2">
          <StyledText className="text-xl font-bold text-primary-800">
            {poi.name}
          </StyledText>
          <StyledView className="flex-row">
            {renderRating(poi.rating)}
          </StyledView>
        </StyledView>
        
        <StyledView className="flex-row items-center mb-3">
          <Icon name="place" size={16} color="#007df3" />
          <StyledText className="text-sm text-gray-600 ml-1">
            {poi.district}
          </StyledText>
        </StyledView>
        
        <StyledText className="text-gray-700 mb-4">
          {poi.description}
        </StyledText>
        
        <StyledView className="flex-row items-center mb-2">
          <Icon name="category" size={16} color="#007df3" />
          <StyledText className="text-sm text-gray-600 ml-1">
            {poi.category}
          </StyledText>
        </StyledView>
      </CardBody>
      
      <CardFooter className="flex-row justify-between">
        <Button 
          title="Guardar" 
          variant="outline" 
          size="sm" 
          onPress={() => onSavePress(poi.id)}
          icon={<Icon name="bookmark" size={18} color="#007df3" style={{ marginRight: 6 }} />}
        />
        <Button 
          title="Cómo llegar" 
          size="sm" 
          onPress={() => onNavigatePress(poi.location.latitude, poi.location.longitude)}
          icon={<Icon name="directions" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
        />
      </CardFooter>
    </Card>
  );
}; 