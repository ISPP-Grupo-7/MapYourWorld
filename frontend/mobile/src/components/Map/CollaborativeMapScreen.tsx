import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Alert, Text, Animated, Modal, TouchableOpacity, ScrollView, TextInput, Pressable } from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import * as Location from "expo-location";
import PuntoDeInteresForm from "../POI/PoiForm";
import { API_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Colores disponibles para los usuarios (máximo 6)
const USER_COLORS = [
  "rgba(76, 175, 80, 0.5)",  // Verde
  "rgba(255, 152, 0, 0.5)",  // Naranja
  "rgba(255, 235, 59, 0.5)", // Amarillo
  "rgba(33, 150, 243, 0.5)", // Azul
  "rgba(156, 39, 176, 0.5)", // Púrpura
  "rgba(244, 67, 54, 0.5)"   // Rojo
];

// Tipos para distritos y POIs
interface Distrito {
  id: string;
  nombre: string;
  coordenadas: { latitude: number; longitude: number }[];
  isUnlocked: boolean;
  unlockedByUserId?: string;
  colorIndex?: number;
}

interface DistritoBackend {
  id: string;
  name: string;
  description: string;
  boundaries: any;
  isUnlocked: boolean;
  user?: { id: string };
}

interface MapUser {
  id: string;
  username: string;
  colorIndex: number;
}

interface POI {
  id?: string;
  name: string;
  description: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
}

interface CollaborativeMapScreenProps {
  mapId: string;
  userId: string;
}

// Componente para mostrar el logro al desbloquear un distrito
const LogroComponent = ({ visible, distrito }: { visible: boolean; distrito: string }) => {
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.logroContainer, { opacity: opacityAnim }]}>
      <Text style={styles.logroEmoji}>🏆</Text>
      <Text style={styles.logroTitle}>¡Logro Conseguido!</Text>
      <Text style={styles.logroSubtitle}>Distrito desbloqueado en mapa colaborativo</Text>
      <Text style={styles.logroDistrito}>{distrito}</Text>
    </Animated.View>
  );
};

const CollaborativeMapScreen: React.FC<CollaborativeMapScreenProps> = ({ mapId, userId }) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distritosBackend, setDistritosBackend] = useState<Distrito[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [distritoActual, setDistritoActual] = useState<string | null>(null);
  const [mostrarLogro, setMostrarLogro] = useState<boolean>(false);
  const [distritosVisitados, setDistritosVisitados] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [pointOfInterest, setPointOfInterest] = useState<any>({
    name: "",
    description: "",
    category: "",
    photos: [],
    latitude: 0,
    longitude: 0,
    district: "",
  });
  // State para almacenar los POIs obtenidos del backend
  const [pointsOfInterest, setPointsOfInterest] = useState<POI[]>([]);
  // State para almacenar los usuarios del mapa colaborativo
  const [mapUsers, setMapUsers] = useState<MapUser[]>([]);
  // State para almacenar el color asignado al usuario actual
  const [userColorIndex, setUserColorIndex] = useState<number>(-1);
  // Variables de estado para el seguimiento de ubicación
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  // Nuevos estados para invitación de amigos
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [friendEmail, setFriendEmail] = useState<string>('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [isCreatingMap, setIsCreatingMap] = useState<boolean>(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorTitle, setErrorTitle] = useState("");

  // Función para verificar si un punto está dentro de un polígono (distrito)
  const isPointInPolygon = (
    point: { latitude: number; longitude: number },
    polygon: { latitude: number; longitude: number }[]
  ) => {
    let inside = false;
    const { latitude, longitude } = point;
    const len = polygon.length;
    let j = len - 1;
    for (let i = 0; i < len; i++) {
      const vertex1 = polygon[i];
      const vertex2 = polygon[j];
      if (
        (vertex1.longitude > longitude) !== (vertex2.longitude > longitude) &&
        latitude <
          ((vertex2.latitude - vertex1.latitude) * (longitude - vertex1.longitude)) /
            (vertex2.longitude - vertex1.longitude) +
            vertex1.latitude
      ) {
        inside = !inside;
      }
      j = i;
    }
    return inside;
  };

  // Función para transformar coordenadas desde GeoJSON al formato de react-native-maps
  const transformarCoordenadasGeoJSON = (geoJson: any): { latitude: number; longitude: number }[] => {
    try {
      if (!geoJson || !geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
        return [];
      }
      let coordenadas: { latitude: number; longitude: number }[] = [];
      const procesarCoordenadas = (coords: any[]): void => {
        if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
          coordenadas.push({
            latitude: coords[1],
            longitude: coords[0],
          });
        } else if (Array.isArray(coords)) {
          coords.forEach((item) => {
            if (Array.isArray(item)) {
              procesarCoordenadas(item);
            }
          });
        }
      };
      procesarCoordenadas(geoJson.coordinates);
      return coordenadas;
    } catch (error) {
      console.error("Error transformando coordenadas:", error);
      return [];
    }
  };

  // Función para obtener los distritos desde el backend
  const fetchDistricts = async () => {
    try {
      setLoading(true);
      // En lugar de obtener todos los distritos, obtenemos solo los del mapa colaborativo
      console.log(`Obteniendo distritos para el mapa colaborativo ${mapId}`);
      const response = await fetch(`${API_URL}/api/districts/map/${mapId}`);
      const data = await response.json();
      console.log("Respuesta de distritos:", data);

      if (data.success && data.districts && data.districts.length > 0) {
        const distritosMapeados = data.districts
          .map((distrito: DistritoBackend) => {
            try {
              const coordenadasTransformadas = transformarCoordenadasGeoJSON(distrito.boundaries);
              if (coordenadasTransformadas.length < 3) {
                console.warn(`Distrito ${distrito.name} no tiene suficientes coordenadas válidas`);
                return null;
              }
              
              // Incluimos información sobre qué usuario ha desbloqueado el distrito
              return {
                id: distrito.id,
                nombre: distrito.name,
                coordenadas: coordenadasTransformadas,
                isUnlocked: distrito.isUnlocked,
                unlockedByUserId: distrito.user?.id,
                colorIndex: distrito.user && mapUsers.length > 0 
                  ? mapUsers.find((u: { id: string; username: string; colorIndex: number }) => u.id === distrito.user?.id)?.colorIndex 
                  : undefined
              };
            } catch (error) {
              console.error(`Error procesando distrito ${distrito.name}:`, error);
              return null;
            }
          })
          .filter((d: Distrito | null): d is Distrito => d !== null);
        setDistritosBackend(distritosMapeados);
      } else {
        console.warn("No se pudieron cargar los distritos del mapa colaborativo o la lista está vacía");
        // Intentar obtener los distritos del mapa individual como fallback
        console.log("Intentando obtener distritos del mapa individual como fallback");
        try {
          const fallbackResponse = await fetch(`${API_URL}/api/districts`);
          const fallbackData = await fallbackResponse.json();
          
          if (fallbackData.success && fallbackData.districts) {
            console.log("Usando distritos del mapa individual como fallback");
            const distritosMapeados = fallbackData.districts
              .map((distrito: DistritoBackend) => {
                try {
                  const coordenadasTransformadas = transformarCoordenadasGeoJSON(distrito.boundaries);
                  if (coordenadasTransformadas.length < 3) {
                    return null;
                  }
                  return {
                    id: distrito.id,
                    nombre: distrito.name,
                    coordenadas: coordenadasTransformadas,
                    isUnlocked: false,
                    unlockedByUserId: undefined,
                    colorIndex: undefined
                  };
                } catch (error) {
                  return null;
                }
              })
              .filter((d: Distrito | null): d is Distrito => d !== null);
            setDistritosBackend(distritosMapeados);
          } else {
            showError("Error", "No se pudieron cargar los distritos de ninguna fuente");
          }
        } catch (fallbackError) {
          console.error("Error al obtener distritos de fallback:", fallbackError);
          showError("Error", "No se pudieron cargar los distritos de ninguna fuente");
        }
      }
    } catch (error) {
      console.error("Error al obtener los distritos del mapa colaborativo:", error);
      // Intentar obtener los distritos del mapa individual como fallback
      console.log("Error capturado: Intentando obtener distritos del mapa individual como fallback");
      try {
        const fallbackResponse = await fetch(`${API_URL}/api/districts`);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.success && fallbackData.districts) {
          console.log("Usando distritos del mapa individual como fallback después de error");
          const distritosMapeados = fallbackData.districts
            .map((distrito: DistritoBackend) => {
              try {
                const coordenadasTransformadas = transformarCoordenadasGeoJSON(distrito.boundaries);
                if (coordenadasTransformadas.length < 3) {
                  return null;
                }
                return {
                  id: distrito.id,
                  nombre: distrito.name,
                  coordenadas: coordenadasTransformadas,
                  isUnlocked: false,
                  unlockedByUserId: undefined,
                  colorIndex: undefined
                };
              } catch (error) {
                return null;
              }
            })
            .filter((d: Distrito | null): d is Distrito => d !== null);
          setDistritosBackend(distritosMapeados);
        } else {
          showError("Error", "No se pudieron cargar los distritos de ninguna fuente");
        }
      } catch (fallbackError) {
        console.error("Error al obtener distritos de fallback:", fallbackError);
        showError("Error", "No se pudieron cargar los distritos de ninguna fuente");
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener todos los POIs desde el backend
  const fetchPOIs = async () => {
    try {
      console.log(`Obteniendo POIs para el mapa colaborativo ${mapId}`);
      const response = await fetch(`${API_URL}/api/poi/map/${mapId}`);
      
      // Verificar que la respuesta sea JSON válido
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("La respuesta de POIs no es JSON válido:", contentType);
        setPointsOfInterest([]);
        return;
      }
      
      const data = await response.json();
      console.log("Respuesta de POIs:", data);
      
      if (data.success && data.pois) {
        setPointsOfInterest(data.pois);
      } else {
        console.warn("No se pudieron obtener los puntos de interés del mapa colaborativo");
        // Establecer una lista vacía de puntos de interés
        setPointsOfInterest([]);
      }
    } catch (error) {
      console.error("Error al obtener los puntos de interés del mapa colaborativo:", error);
      // Establecer una lista vacía de puntos de interés
      setPointsOfInterest([]);
    }
  };

  // Función para obtener los usuarios del mapa colaborativo y asignarles colores
  const fetchMapUsers = async () => {
    try {
      console.log(`Obteniendo usuarios para el mapa colaborativo ${mapId}`);
      const response = await fetch(`${API_URL}/api/maps/users/${mapId}`);
      const data = await response.json();
      console.log("Respuesta de usuarios del mapa colaborativo:", data);
      
      if (data.success && data.users) {
        // Asignar un color a cada usuario (máximo 6 colores)
        const usersWithColors = data.users.map((user: { id: string; username: string }, index: number) => ({
          id: user.id,
          username: user.username || `Usuario ${index + 1}`,
          colorIndex: index % USER_COLORS.length
        }));
        
        setMapUsers(usersWithColors);
        
        // Encontrar el color del usuario actual
        const currentUser = usersWithColors.find((user: { id: string; username: string; colorIndex: number }) => user.id === userId);
        if (currentUser) {
          setUserColorIndex(currentUser.colorIndex);
        } else {
          // Si el usuario actual no está en la lista, le asignamos un color por defecto
          console.log(`Usuario actual (${userId}) no encontrado en la lista, asignando color por defecto`);
          setUserColorIndex(0); // Verde por defecto
        }
      } else {
        console.warn("No se pudieron obtener los usuarios del mapa colaborativo");
        // En caso de error, asignamos al menos un usuario (el actual) con un color
        setMapUsers([{
          id: userId,
          username: "Tú",
          colorIndex: 0 // Verde por defecto
        }]);
        setUserColorIndex(0);
      }
    } catch (error) {
      console.error("Error al obtener los usuarios del mapa colaborativo:", error);
      // En caso de error, asignamos al menos un usuario (el actual) con un color
      setMapUsers([{
        id: userId,
        username: "Tú",
        colorIndex: 0 // Verde por defecto
      }]);
      setUserColorIndex(0);
    }
  };

  // Función para desbloquear un distrito en el mapa colaborativo
  const desbloquearDistrito = async (districtId: string) => {
    try {
      console.log(`Desbloqueando distrito ${districtId} por usuario ${userId} en mapa ${mapId}`);
      const response = await fetch(`${API_URL}/api/districts/unlock/collaborative/${districtId}/${userId}/${mapId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log("Respuesta de desbloqueo:", data);
      
      if (data.success) {
        console.log(`Distrito ${districtId} desbloqueado en mapa colaborativo.`);
        // Actualizamos el distrito en el estado local
        setDistritosBackend((prev) =>
          prev.map((d) => 
            d.id === districtId 
              ? { 
                  ...d, 
                  isUnlocked: true, 
                  unlockedByUserId: userId,
                  colorIndex: userColorIndex 
                } 
              : d
          )
        );
      } else {
        console.warn(`No se pudo desbloquear el distrito ${districtId} en el mapa colaborativo`);
      }
    } catch (error) {
      console.error("Error al desbloquear el distrito en el mapa colaborativo:", error);
    }
  };

  // Función para inicializar el mapa colaborativo
  const initializeMap = async () => {
    try {
      console.log(`Inicializando mapa colaborativo: ${mapId}`);

      // Si no hay mapId, no podemos inicializar el mapa
      if (!mapId) {
        showError("Error", "No se pudo encontrar el ID del mapa colaborativo");
        return;
      }

      // Antes de cargar cualquier dato, aseguramos que el mapa colaborativo existe
      await ensureCollaborativeMapExists();

      // Obtener usuarios en el mapa
      await fetchMapUsers();

      // Obtener distritos del mapa colaborativo
      await fetchDistricts();

      // Obtener puntos de interés del mapa
      await fetchPOIs();

      console.log("Mapa colaborativo inicializado correctamente");
    } catch (error) {
      console.error("Error al inicializar el mapa colaborativo:", error);
      showError(
        "Error",
        "Ha ocurrido un error al inicializar el mapa colaborativo. Intente nuevamente."
      );
    }
  };

  // Función para asegurar que el mapa colaborativo existe
  const ensureCollaborativeMapExists = async () => {
    try {
      setIsCreatingMap(true);
      console.log(`Verificando existencia del mapa colaborativo ${mapId}`);
      
      // Obtener userId del almacenamiento local (o usar un valor por defecto para pruebas)
      const storedUserId = await AsyncStorage.getItem('userId');
      const effectiveUserId = storedUserId || userId || 'user-456';
      
      try {
        // Llamar al endpoint para crear o obtener el mapa colaborativo
        const response = await fetch(`${API_URL}/api/maps/createOrGetCollaborative`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mapId: mapId,
            userId: effectiveUserId
          }),
        });
        
        // Validar la respuesta
        if (!response.ok) {
          console.error(`Error del servidor: ${response.status}`);
          
          // Si hubo un error, mostrar mensaje pero seguir adelante
          console.log("Error en la petición pero continuamos con la inicialización del mapa");
          return null;
        }
        
        try {
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn("La respuesta no es JSON válido, pero continuamos");
            return null;
          }
          
          const data = await response.json();
          console.log("Respuesta de verificación de mapa colaborativo:", data);
          
          if (!data.success) {
            console.warn(data.message || "Advertencia al verificar el mapa colaborativo, pero continuamos");
            return null;
          }
          
          console.log(`Mapa colaborativo ${mapId} verificado/creado correctamente`);
          return data.map;
        } catch (jsonError) {
          console.error("Error al procesar la respuesta JSON:", jsonError);
          // Continuamos aunque haya error en el procesamiento JSON
          return null;
        }
      } catch (requestError) {
        console.error("Error en la petición HTTP:", requestError);
        // Continuamos aunque falle la petición
        return null;
      }
    } catch (error) {
      console.error("Error al verificar/crear el mapa colaborativo:", error);
      // No mostramos alerta para no interrumpir el flujo
      return null;
    } finally {
      setIsCreatingMap(false);
    }
  };

  // Función para invitar a un amigo al mapa colaborativo
  const inviteFriend = async () => {
    if (!friendEmail || friendEmail.trim() === '') {
      showError("Error", "Por favor, introduce un email válido");
      return;
    }
    
    if (invitedFriends.length >= 5) {
      showError("Límite alcanzado", "Solo puedes invitar a 5 amigos a un mapa colaborativo");
      return;
    }
    
    try {
      // Obtener el userId actual del almacenamiento o usar el prop
      const storedUserId = await AsyncStorage.getItem('userId');
      const effectiveUserId = storedUserId || userId || 'user-456';
      
      // Llamar al endpoint para invitar al usuario
      const response = await fetch(`${API_URL}/api/maps/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mapId,
          userEmail: friendEmail,
          invitedByUserId: effectiveUserId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al enviar la invitación');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Añadir el email a la lista de invitados para mostrarlo en la UI
        setInvitedFriends([...invitedFriends, friendEmail]);
        setFriendEmail('');
        showError("Éxito", `Se ha enviado una invitación a ${friendEmail}`);
      } else {
        throw new Error(data.message || 'Error al procesar la invitación');
      }
    } catch (error) {
      console.error("Error al invitar amigo:", error);
      showError("Error", `No se pudo enviar la invitación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función para iniciar el seguimiento de ubicación
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showError("Permiso denegado", "Necesitamos acceso a tu ubicación para mostrar el mapa colaborativo.");
        return;
      }
      
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation({
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          });
        }
      );
      
      setLocationSubscription(subscription);
      console.log("Seguimiento de ubicación iniciado");
    } catch (locationError) {
      console.error("Error al iniciar el seguimiento de ubicación:", locationError);
      showError(
        "Error de ubicación", 
        "No se pudo acceder a tu ubicación. Algunas funciones del mapa podrían no estar disponibles."
      );
    }
  };

  // Función para detener el seguimiento de ubicación
  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      console.log("Seguimiento de ubicación detenido");
    }
  };

  // Función para mostrar errores en un modal en lugar de un Alert
  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // Modal para mostrar errores
  const renderErrorModal = () => {
    return (
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.errorIconContainer}>
              {errorTitle.toLowerCase().includes("error") ? (
                <Icon name="error" size={32} color="#f44336" />
              ) : errorTitle.toLowerCase().includes("éxito") ? (
                <Icon name="check-circle" size={32} color="#4CAF50" />
              ) : (
                <Icon name="info" size={32} color="#2196F3" />
              )}
            </View>
            <Text style={styles.modalTitle}>{errorTitle}</Text>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={[
                styles.closeButton, 
                {
                  backgroundColor: errorTitle.toLowerCase().includes("error") 
                    ? "#f44336" 
                    : errorTitle.toLowerCase().includes("éxito")
                      ? "#4CAF50"
                      : "#2196F3"
                }
              ]} 
              onPress={() => setShowErrorModal(false)}
            >
              <Text style={styles.closeButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Al montar el componente se obtienen distritos, POIs, usuarios y se comienza a observar la ubicación
  useEffect(() => {
    // Si no hay un mapId válido, no continuamos
    if (!mapId) {
      showError("Error", "No se ha proporcionado un ID de mapa válido");
      return;
    }
    
    setLoading(true);
    
    // Usar la función initializeMap ya definida, que ahora asegura que el mapa colaborativo existe
    initializeMap().finally(() => setLoading(false));

    // Comenzar a seguir la ubicación del usuario
    startLocationTracking();
    
    // Limpiar al desmontar el componente
    return () => {
      stopLocationTracking();
    };
  }, [mapId]);

  // Verificar si el usuario se encuentra dentro de algún distrito y desbloquearlo si es necesario
  useEffect(() => {
    if (location && distritosBackend.length > 0 && userColorIndex >= 0) {
      let dentroDeAlguno = false;
      let distritoEncontrado: Distrito | null = null;
      
      for (const distrito of distritosBackend) {
        if (isPointInPolygon(location, distrito.coordenadas)) {
          dentroDeAlguno = true;
          distritoEncontrado = distrito;
          break;
        }
      }
      
      if (distritoEncontrado) {
        const { id, nombre, isUnlocked, unlockedByUserId } = distritoEncontrado;
        
        // Solo intentamos desbloquear si no está ya desbloqueado por otro usuario
        if (!isUnlocked) {
          desbloquearDistrito(id);
          if (!distritosVisitados.has(nombre)) {
            setDistritosVisitados(new Set(distritosVisitados).add(nombre));
            setDistritoActual(nombre);
            setTimeout(() => {
              setMostrarLogro(true);
              setTimeout(() => setMostrarLogro(false), 6000);
            }, 1000);
          }
        }
      } else {
        setDistritoActual(null);
      }
    }
  }, [location, distritosBackend, userColorIndex]);

  // Renderizar la información de los usuarios y sus colores
  const renderUserColorLegend = () => {
    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Usuarios</Text>
        <ScrollView style={{ maxHeight: 150 }}>
          {mapUsers.map((user, index) => (
            <View key={index} style={styles.legendItem}>
              <View 
                style={[
                  styles.colorSquare, 
                  { backgroundColor: USER_COLORS[user.colorIndex] }
                ]} 
              />
              <Text style={styles.legendText}>
                {user.username} {user.id === userId ? "(Tú)" : ""}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Modal para invitar amigos
  const renderInviteFriendsModal = () => {
    return (
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Icon name="people" size={32} color="#2196F3" style={{ marginBottom: 10 }} />
            <Text style={styles.modalTitle}>Invitar Amigos</Text>
            <Text style={styles.modalSubtitle}>Máximo 5 amigos (6 usuarios en total)</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email del amigo"
                value={friendEmail}
                onChangeText={setFriendEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.inviteButton} onPress={inviteFriend}>
                <Text style={styles.inviteButtonText}>Invitar</Text>
              </TouchableOpacity>
            </View>
            
            {invitedFriends.length > 0 && (
              <>
                <Text style={styles.invitedTitle}>Amigos invitados:</Text>
                <View style={styles.invitedListContainer}>
                  {invitedFriends.map((email, index) => (
                    <View key={index} style={styles.invitedItem}>
                      <Text style={styles.invitedEmail}>{email}</Text>
                      <TouchableOpacity onPress={() => {
                        setInvitedFriends(invitedFriends.filter((_, i) => i !== index));
                      }}>
                        <Icon name="close" size={20} color="#f44336" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
            
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: "#2196F3", marginTop: 20 }]}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Botón para recargar los datos
  const renderReloadButton = () => {
    return (
      <TouchableOpacity 
        style={styles.reloadButton}
        onPress={async () => {
          setLoading(true);
          try {
            await initializeMap();
          } finally {
            setLoading(false);
          }
        }}
      >
        <Icon name="refresh" size={24} color="white" />
        <Text style={styles.reloadButtonText}>Recargar datos</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading || isCreatingMap ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>
            {isCreatingMap ? 'Creando mapa colaborativo...' : 'Cargando mapa...'}
          </Text>
        </View>
      ) : (
        <>
          {renderInviteFriendsModal()}
          {renderErrorModal()}
          
          <Modal
            visible={showForm}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowForm(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.poiFormContainer}>
                <Text style={styles.poiFormTitle}>Registrar Punto de Interés</Text>
                <PuntoDeInteresForm
                  pointOfInterest={pointOfInterest}
                  setPointOfInterest={setPointOfInterest}
                  setShowForm={setShowForm}
                  onSave={(newPOI: any) => {
                    // Convertir el POI recién creado al formato esperado
                    const poiConverted = {
                      ...newPOI,
                      location: {
                        type: "Point",
                        coordinates: [newPOI.longitude, newPOI.latitude],
                      },
                    };
                    setPointsOfInterest((prev) => [...prev, poiConverted]);
                  }}
                />
              </View>
            </View>
          </Modal>
          
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 37.3754,
              longitude: -5.9903,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation={true}
            onPress={(e) => {
              const { coordinate } = e.nativeEvent;
              const { latitude, longitude } = coordinate;

              let poiDistrict = null;
              for (const distrito of distritosBackend) {
                if (isPointInPolygon({ latitude, longitude }, distrito.coordenadas)) {
                  poiDistrict = distrito;
                  break;
                }
              }
              
              // Verificar si puede crear un POI en este distrito
              if (!poiDistrict) {
                showError('Ubicación no válida', 'No puedes crear un punto de interés fuera de un distrito.');
                return;
              }
              
              if (!poiDistrict.isUnlocked) {
                showError('Distrito bloqueado', `El distrito "${poiDistrict.nombre}" está bloqueado. Desbloquéalo primero para añadir puntos de interés.`);
                return;
              }
              
              setPointOfInterest({
                ...pointOfInterest,
                latitude,
                longitude,
                district: poiDistrict,
              });
              setShowForm(true);
            }}
          >
            {distritosBackend.map((distrito, index) => (
              <Polygon
                key={index}
                coordinates={distrito.coordenadas}
                strokeColor={"#808080"}
                fillColor={
                  distrito.isUnlocked && distrito.colorIndex !== undefined
                    ? USER_COLORS[distrito.colorIndex]
                    : "rgba(128, 128, 128, 0.7)"
                }
                strokeWidth={2}
              />
            ))}
            {pointsOfInterest.map((poi, index) => {
              // Convertir las coordenadas del POI (se asume que vienen en formato [lng, lat])
              const poiCoordinates = {
                latitude: poi.location.coordinates[1],
                longitude: poi.location.coordinates[0],
              };
              
              return (
                <Marker
                  key={index}
                  coordinate={poiCoordinates}
                  title={poi.name}
                  description={poi.description}
                />
              );
            })}
          </MapView>
          
          {renderUserColorLegend()}
          
          <TouchableOpacity 
            style={styles.inviteFriendsButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Icon name="people" size={24} color="white" />
            <Text style={styles.inviteFriendsText}>Invitar Amigos</Text>
          </TouchableOpacity>
          
          {renderReloadButton()}
          
          {distritoActual && <LogroComponent visible={mostrarLogro} distrito={distritoActual} />}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  logroContainer: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    elevation: 5,
  },
  logroEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  logroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  logroSubtitle: {
    fontSize: 18,
    color: "white",
    marginBottom: 5,
  },
  logroDistrito: {
    fontSize: 16,
    color: "yellow",
    fontWeight: "bold",
  },
  legendContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderRadius: 8,
    maxWidth: "40%",
    maxHeight: 200,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  colorSquare: {
    width: 20,
    height: 20,
    marginRight: 5,
    borderWidth: 1,
    borderColor: "#000",
  },
  legendText: {
    fontSize: 12,
    flexShrink: 1,
  },
  inviteFriendsButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "#2196F3",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 5,
  },
  inviteFriendsText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    alignItems: "center",
  },
  errorIconContainer: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#333",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
    color: "#555",
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 15,
    width: "100%",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
  },
  inviteButton: {
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  inviteButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  invitedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  invitedListContainer: {
    width: "100%",
    maxHeight: 150,
  },
  invitedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    width: "100%",
  },
  invitedEmail: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  reloadButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    elevation: 5,
  },
  reloadButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
  poiFormContainer: {
    width: "90%",
    maxWidth: 380,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    maxHeight: "90%",
  },
  poiFormTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#333",
  },
});

export default CollaborativeMapScreen; 