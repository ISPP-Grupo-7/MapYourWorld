import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';



interface PuntoDeInteresFormProps {
  pointOfInterest: any;
  setPointOfInterest: (pointOfInterest: any) => void;
  setShowForm: (showForm: boolean) => void;
  onSave: (newPOI: any) => void;
  showAlert?: (title: string, message: string) => void; // Función opcional para mostrar alertas en web
}

const categories = [
  { label: 'Monumentos', value: 'MONUMENTOS' },
  { label: 'Estaciones', value: 'ESTACIONES' },
  { label: 'Mercados', value: 'MERCADOS' },
  { label: 'Plazas', value: 'PLAZAS' },
  { label: 'Otros', value: 'OTROS' },
];

const PuntoDeInteresForm: React.FC<PuntoDeInteresFormProps> = ({
  pointOfInterest,
  setPointOfInterest,
  setShowForm,
  onSave,
  showAlert
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  // Estado inicial para reiniciar el formulario
  const initialPoint = { name: '', description: '', category: '', photos: [] };
  
  // Detectar si estamos en entorno web
  const isWeb = Platform.OS === 'web';

  // Función para mostrar alertas según la plataforma
  const mostrarAlerta = (titulo: string, mensaje: string) => {
    console.log(`Alerta: ${titulo} - ${mensaje}`);
    if (showAlert) {
      console.log('Usando showAlert personalizado');
      // Usamos el modal de alerta personalizado si está disponible
      showAlert(titulo, mensaje);
    } else {
      // Fallback a Alert.alert solo si showAlert no está disponible
      Alert.alert(titulo, mensaje);
    }
  };

  // Función para seleccionar una foto desde la galería usando Expo Image Picker
  const handleAddPhoto = async () => {
    if (isWeb) {
      // Para la versión web, usamos input de tipo file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*'; // Solo aceptar imágenes
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        
        if (!file) return;
        
        // Validar que es un archivo de imagen
        if (!file.type.startsWith('image/')) {
          mostrarAlerta('Tipo de archivo no válido', 'Por favor, selecciona solo archivos de imagen (jpg, png, gif, etc.)');
          return;
        }
        
        // Crear URL para la imagen seleccionada
        const uri = URL.createObjectURL(file);
        const updatedPhotos = pointOfInterest.photos ? [...pointOfInterest.photos, uri] : [uri];
        setPointOfInterest({ ...pointOfInterest, photos: updatedPhotos });
      };
      
      input.click();
    } else {
      // Versión móvil original
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        mostrarAlerta('Permiso denegado', 'Se requiere acceso a la galería para seleccionar una imagen.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const updatedPhotos = pointOfInterest.photos ? [...pointOfInterest.photos, uri] : [uri];
        setPointOfInterest({ ...pointOfInterest, photos: updatedPhotos });
      }
    }
  };

  const handleSelectCategory = (categoryValue: string) => {
    setPointOfInterest({ ...pointOfInterest, category: categoryValue });
    setDropdownVisible(false);
  };

  const handleSubmit = async () => {
    try {
      if (pointOfInterest.district === null || !pointOfInterest.district.isUnlocked) {
        mostrarAlerta('Distrito no válido', 'Este distrito está bloqueado. No se puede crear el punto de interés.');
        return;
      }
      if (!pointOfInterest.name || pointOfInterest.name.trim() === '') {
        mostrarAlerta('Nombre requerido', 'Por favor, introduce un nombre para el punto de interés.');
        return;
      }
      
      if (!pointOfInterest.description || pointOfInterest.description.trim() === '') {
        mostrarAlerta('Descripción requerida', 'Por favor, introduce una descripción para el punto de interés.');
        return;
      }
      
      if (!pointOfInterest.category || pointOfInterest.category.trim() === '') {
        mostrarAlerta('Categoría requerida', 'Por favor, selecciona una categoría para el punto de interés.');
        return;
      }

      const token = await AsyncStorage.getItem('@MapYourWorld:token');
      if (!token) {
        mostrarAlerta('Error', 'No se encontró un token de autenticación.');
        return;
      }
      
      const poiForMarker = {
        name: pointOfInterest.name,
        description: pointOfInterest.description,
        category: pointOfInterest.category,
        latitude: pointOfInterest.latitude,
        longitude: pointOfInterest.longitude,
        district: pointOfInterest.district,
      };

      // Convertir latitude/longitude a formato "location" para el backend
      const formattedPoint = {
        ...pointOfInterest,
        location: {
          type: "Point",
          coordinates: [pointOfInterest.longitude, pointOfInterest.latitude],
        },
      };

      // Eliminar latitude y longitude del objeto que se envía al backend
      delete formattedPoint.latitude;
      delete formattedPoint.longitude;

      const response = await fetch(`${API_URL}/api/poi/`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
         },
        body: JSON.stringify(formattedPoint),
      });

      const data = await response.json();

      if (response.ok) {
        mostrarAlerta('Éxito', 'Punto de interés creado correctamente.');
        // Llamamos a onSave para pasar el nuevo POI al componente padre
        onSave(poiForMarker);
        setPointOfInterest(initialPoint);
        setShowForm(false);
      } else {
        mostrarAlerta('Error', data.error || 'No se pudo crear el punto de interés.');
      }
    } catch (error) {
      console.error("Error al guardar el punto de interés:", error);
      mostrarAlerta('Error', 'Ha ocurrido un error al guardar el punto de interés.');
    }
  };

  // Renderizado condicional de imágenes para web y móvil
  const renderImage = (uri: string, index: number) => {
    if (isWeb) {
      // En web, usamos una etiqueta img normal con estilos específicos
      return (
        <div 
          key={index}
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            marginRight: 8,
            overflow: 'hidden',
            position: 'relative',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db'
          }}
        >
          <img 
            src={uri} 
            alt={`Photo ${index+1}`} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      );
    } else {
      // En móvil, usamos el componente Image de React Native
      return (
        <Image
          key={index}
          source={{ uri }}
          className="w-16 h-16 rounded-lg mr-2"
        />
      );
    }
  };

  return (
    <View className={`${isWeb ? '' : 'w-80 bg-white rounded-lg p-5 shadow-lg self-center'}`}>
      <ScrollView>
        {!isWeb && (
          <Text style={styles.title}>
            Registrar Punto de Interés
          </Text>
        )}
        <View className="mb-4">
          <Text className={`${isWeb ? 'section-title' : 'text-lg mb-1'}`}>Nombre</Text>
          <TextInput
            className={`${isWeb ? '' : 'border border-gray-300 rounded-lg px-3 py-2 mb-4'}`}
            placeholder="Nombre del punto de interés"
            value={pointOfInterest.name}
            onChangeText={(text) =>
              setPointOfInterest({ ...pointOfInterest, name: text })
            }
          />
        </View>
        <View className="mb-4">
          <Text className={`${isWeb ? 'section-title' : 'text-lg mb-1'}`}>Descripción</Text>
          <TextInput
            className={`${isWeb ? '' : 'border border-gray-300 rounded-lg px-3 py-2 mb-4 h-20'}`}
            placeholder="Descripción del punto de interés"
            value={pointOfInterest.description}
            multiline
            onChangeText={(text) =>
              setPointOfInterest({ ...pointOfInterest, description: text })
            }
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoría</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <Text style={styles.dropdownButtonText}>
              {pointOfInterest.category
                ? categories.find((cat) => cat.value === pointOfInterest.category)?.label
                : 'Seleccionar categoría'}
            </Text>
          </TouchableOpacity>
          {dropdownVisible && (
            <View style={styles.dropdownContainer}>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.dropdownItem,
                    index === categories.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => handleSelectCategory(cat.value)}
                >
                  <Text style={styles.dropdownItemText}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View className="mb-4">
          <Text className={`${isWeb ? 'section-title' : 'text-lg mb-1'}`}>Fotos</Text>
          {isWeb ? (
            // Contenedor web optimizado para fotos
            <div style={{
              display: 'flex',
              overflowX: 'auto',
              paddingBottom: '10px',
              marginBottom: '10px'
            }}>
              {pointOfInterest.photos && pointOfInterest.photos.map((uri: string, index: number) => 
                renderImage(uri, index)
              )}
              <div 
                onClick={handleAddPhoto}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '24px',
                  color: '#6b7280'
                }}
              >
                +
              </div>
            </div>
          ) : (
            // Contenedor nativo para fotos
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pointOfInterest.photos &&
                pointOfInterest.photos.map((uri: string, index: number) => renderImage(uri, index))}
              <TouchableOpacity
                className="w-16 h-16 rounded-lg border border-gray-300 justify-center items-center"
                onPress={handleAddPhoto}
              >
                <Text className="text-2xl text-gray-500">+</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
        <TouchableOpacity
  style={{
    backgroundColor: '#007df3',
    paddingVertical: 12,
    borderRadius: 8,
    width: isWeb ? '100%' : 'auto', // 100% de ancho en web, ajustable en móvil
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  }}
  onPress={handleSubmit}
>
  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
    Registrar
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={{
    backgroundColor: '#007df3',
    paddingVertical: 12,
    borderRadius: 8,
    width: isWeb ? '100%' : 'auto', // 100% de ancho en web, ajustable en móvil
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  }}
  onPress={() => {
    setPointOfInterest(initialPoint);
    setShowForm(false);
  }}
>
  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
    Cancelar
  </Text>
</TouchableOpacity>


      </ScrollView>
    </View>
  
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 35, 
    height: 35,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  termsText: {
    color: '#64748b',
  },
  termsLink: {
    color: '#00b0dc',
    fontWeight: '500',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 12,
    marginTop: 2,
  },
  loginPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginPromptText: {
    color: '#64748b',
  },
  loginLink: {
    color: '#00b0dc',
    fontWeight: '500',
  },

  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },

});
export default PuntoDeInteresForm;
