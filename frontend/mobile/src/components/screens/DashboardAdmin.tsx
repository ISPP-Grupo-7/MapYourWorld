import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Modal } from 'react-native';
import { styled } from 'nativewind';
import Button from '@components/UI/Button';
import { API_URL } from '../../constants/config';
import { useAuth } from '@/contexts/AuthContext';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

// Opciones de categorías
const categories = [
  { label: 'Monumentos', value: 'MONUMENTOS' },
  { label: 'Estaciones', value: 'ESTACIONES' },
  { label: 'Mercados', value: 'MERCADOS' },
  { label: 'Plazas', value: 'PLAZAS' },
  { label: 'Otros', value: 'OTROS' },
];

interface Business {
  name: string;
  description: string;
  category: string;
  photos: string[];
  latitude: string;
  longitude: string;
}

const DashboardAdmin = () => {
  const { user } = useAuth();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [pointOfInterest, setPointOfInterest] = useState<Business>({
    name: '',
    description: '',
    category: '',
    latitude: '',
    longitude: '',
    photos: [],
  });
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // Estado para manejar el modal
  const [formError, setFormError] = useState(''); // Estado para manejar los errores del formulario

  const handleSelectCategory = (categoryValue: string) => {
    setPointOfInterest({
      ...pointOfInterest,
      category: categoryValue,
    });
    setDropdownVisible(false);
  };

  // Función para validar latitud y longitud
  const isValidCoordinate = (coordinate: string) => {
    // Verifica si el valor es un número decimal, positivo o negativo
    const regex = /^-?\d+(\.\d+)?$/;
    return regex.test(coordinate);
  };

  // Validar formulario antes de enviarlo
  const validateForm = () => {
    if (!pointOfInterest.name || !pointOfInterest.description || !pointOfInterest.category || !pointOfInterest.latitude || !pointOfInterest.longitude) {
      setFormError('Todos los campos son obligatorios.');
      return false;
    }

    if (!isValidCoordinate(pointOfInterest.latitude) || !isValidCoordinate(pointOfInterest.longitude)) {
      setFormError('Latitud y Longitud deben ser números decimales válidos.');
      return false;
    }

    setFormError(''); // Limpiar errores si todo es válido
    return true;
  };

  // Esta función convierte latitud y longitud a números y crea el objeto 'location'
  const handleAddBusiness = async (business: Business) => {
    if (!validateForm()) {
      return;
    }

    const latitudeNum = parseFloat(business.latitude);
    const longitudeNum = parseFloat(business.longitude);
    console.log(latitudeNum, longitudeNum);

    const payload = {
      poiData: {
        ...business,
        location: {
          type: "Point",
          coordinates: [longitudeNum, latitudeNum],
        },
      },
      userId: user?.id,
    };

    try {
      const response = await fetch(`${API_URL}/api/poi/admin/create/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      let data = {};
      if (text) {
        data = JSON.parse(text);
      }

      if (response.ok) {
        console.log('POI creado exitosamente:', data);
        setIsModalVisible(true); // Mostrar el modal cuando se haya creado exitosamente
        setPointOfInterest({
          name: '',
          description: '',
          category: '',
          latitude: '',
          longitude: '',
          photos: [],
        }); // Limpiar el formulario
      } else {
        const errorMessage = (data as { error?: string }).error || 'No se pudo crear el POI';
        if (errorMessage.toLowerCase().includes('duplicada')) {
          alert('Error: Ya existe un negocio registrado en esta ubicación.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
        console.error('Error al crear el POI:', errorMessage);
      }
    } catch (error) {
      console.error('Hubo un problema con la solicitud:', error);
      alert('Hubo un problema al crear el POI. Intenta nuevamente.');
    }
  };

  return (
    <StyledScrollView className="flex-1">
      <StyledView className="flex-1 p-6 justify-start min-h-screen mt-20">
        <StyledView className="bg-white p-6 rounded-lg w-full shadow-md">
          <StyledView className="flex-row items-center justify-center mb-6">
            <Image source={require('../../assets/images/logo.png')} style={{ width: 35, height: 35 }} />
            <StyledText className="text-xl font-bold ml-2 text-gray-800">Panel de Administración</StyledText>
          </StyledView>

          <StyledText className="text-gray-600 text-center mb-6">
            Gestiona la publicidad geolocalizada de las empresas
          </StyledText>

          <Button 
            title="Añadir Publicidad de Empresa" 
            onPress={() => setIsFormVisible(true)}
            fullWidth
            className="mb-3"
          />

          {formError && <StyledText className="text-red-500 text-center mb-4">{formError}</StyledText>}

          {isFormVisible && (
            <StyledView className="mt-6">
              <StyledText className="text-lg mb-2">Nombre del Punto de Interés</StyledText>
              <TextInput
                value={pointOfInterest.name}
                onChangeText={(text) => setPointOfInterest({ ...pointOfInterest, name: text })}
                placeholder="Nombre"
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
              />

              <StyledText className="text-lg mb-2">Descripción</StyledText>
              <TextInput
                value={pointOfInterest.description}
                onChangeText={(text) => setPointOfInterest({ ...pointOfInterest, description: text })}
                placeholder="Descripción"
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
              />

              <StyledText className="text-lg mb-2">Categoría</StyledText>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
                onPress={() => setDropdownVisible(!dropdownVisible)}
              >
                <Text>
                  {pointOfInterest.category
                    ? categories.find((cat) => cat.value === pointOfInterest.category)?.label
                    : 'Seleccionar categoría'}
                </Text>
              </TouchableOpacity>

              {dropdownVisible && (
                <View className="border border-gray-300 rounded-lg mt-1">
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      className="px-3 py-2 border-b last:border-b-0"
                      onPress={() => handleSelectCategory(cat.value)}
                    >
                      <Text>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <StyledText className="text-lg mb-2">Latitud</StyledText>
              <TextInput
                value={pointOfInterest.latitude}
                onChangeText={(text) => setPointOfInterest({ ...pointOfInterest, latitude: text })}
                placeholder="Latitud"
                keyboardType="numbers-and-punctuation"
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
              />

              <StyledText className="text-lg mb-2">Longitud</StyledText>
              <TextInput
                value={pointOfInterest.longitude}
                onChangeText={(text) => setPointOfInterest({ ...pointOfInterest, longitude: text })}
                placeholder="Longitud"
                keyboardType="numbers-and-punctuation"
                className="border border-gray-300 rounded-lg px-3 py-2 mb-4"
              />

              <Button 
                title="Guardar Comercio" 
                onPress={() => handleAddBusiness(pointOfInterest)} 
                fullWidth 
              />
            </StyledView>
          )}
        </StyledView>
      </StyledView>

      {/* Modal de confirmación */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-6 rounded-lg w-80">
            <Text className="text-xl text-center mb-4">¡Comercio Creado Exitosamente!</Text>
            <Button 
              title="Cerrar" 
              onPress={() => setIsModalVisible(false)} 
              fullWidth 
            />
          </View>
        </View>
      </Modal>
    </StyledScrollView>
  );
};

export default DashboardAdmin;
