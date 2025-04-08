import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, Alert, Text, Animated, Modal, TouchableOpacity, ScrollView, TextInput, FlatList } from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import * as Location from "expo-location";
import PuntoDeInteresForm from "../POI/PoiForm";
import { API_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from "@/contexts/AuthContext";

// Colores disponibles para los usuarios (máximo 6)
const USER_COLORS = [
  "#2196f399",
  "#4cb05099",
  "#fec10799",
  "#ff970099",
  "#ea1e6399",
  "#9c27b399",
];

// Tipos para distritos y POIs
interface Distrito {
  id: string;
  nombre: string;
  coordenadas: { latitude: number; longitude: number }[];
  isUnlocked: boolean;
  unlockedByUserId?: string;
  colorIndex?: number;
  regionId: string;
  color: string;
}

interface DistritoBackend {
  id: string;
  name: string;
  description: string;
  boundaries: any;
  isUnlocked: boolean;
  user?: { id: string };
  region_assignee?: {
    id: string;
    name: string;
    description: string;
    map_assignee: {
      id: string;
      name: string;
      description: string;
      createdAt: string;
      is_colaborative: boolean;
    };
  };
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

const AlertModal = ({ visible, title, message, onClose }: { visible: boolean, title: string, message: string, onClose: () => void }) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.modalMessage}>{message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

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


  const [isCreatingMap, setIsCreatingMap] = useState<boolean>(false);
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const { user } = useAuth();
  useEffect(() => {
    console.log("Usuario actual en Social:", user);
  }, [user]);

  useEffect(() => {
    if (user && user.id) {
      console.log("Cargando amigos para el usuario:", user.id);
      fetchFriends(user.id);

    }
  }, [user]);
  // Estado para el modal de alertas
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: ''
  });

  // Función para mostrar alertas de manera consistente con la versión web
  const showAlert = useCallback((title: string, message: string) => {
    setAlertModal({
      visible: true,
      title,
      message
    });
  }, []);

  // Función para cerrar el modal de alerta
  const closeAlertModal = useCallback(() => {
    setAlertModal(prev => ({ ...prev, visible: false }));
  }, []);

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
      console.log(`Obteniendo distritos para el mapa colaborativo ${mapId}`);

      // Obtener los distritos del mapa colaborativo
      const response = await fetch(`${API_URL}/api/districts/map/${mapId}`);
      const data = await response.json();
      console.log("Respuesta de distritos:", data);

      if (!data.success || !data.districts || data.districts.length === 0) {
        console.warn("No se pudieron cargar los distritos del mapa colaborativo");
        setDistritosBackend([]);
        return;
      }

      // Obtener los colores de los usuarios que han desbloqueado distritos
      const userColors = new Map();

      for (const user of mapUsers) {
        try {
          const colorResponse = await fetch(`${API_URL}/api/districts/user-districts/${user.id}`);
          const colorData = await colorResponse.json();

          if (colorData.success && colorData.userDistricts) {
            colorData.userDistricts.forEach((ud: any) => {
              userColors.set(ud.districtId, ud.color);
            });
          }
        } catch (colorError) {
          console.error(`Error al obtener colores del usuario ${user.id}:`, colorError);
        }
      }

      // Mapear los distritos con los colores correctos
      const distritosMapeados = data.districts.map((distrito: DistritoBackend) => {
        try {
          const coordenadasTransformadas = transformarCoordenadasGeoJSON(distrito.boundaries);
          if (coordenadasTransformadas.length < 3) {
            console.warn(`Distrito ${distrito.name} no tiene suficientes coordenadas válidas`);
            return null;
          }

          return {
            id: distrito.id,
            nombre: distrito.name,
            coordenadas: coordenadasTransformadas,
            isUnlocked: distrito.isUnlocked,
            unlockedByUserId: distrito.user?.id,
            color: userColors.get(distrito.id) || "rgba(128, 128, 128, 0.7)", // Color gris si no hay asignado
            regionId: distrito.region_assignee ? distrito.region_assignee.id : null,
          };
        } catch (error) {
          console.error(`Error procesando distrito ${distrito.name}:`, error);
          return null;
        }
      }).filter((d: Distrito | null): d is Distrito => d !== null);

      setDistritosBackend(distritosMapeados);
    } catch (error) {
      console.error("Error al obtener los distritos del mapa colaborativo:", error);
      Alert.alert("Error", "No se pudieron cargar los distritos");
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

      if (data.success && data.users) {
        // Obtener colores ya asignados para evitar duplicados
        const assignedColors: { [key: string]: string } = {}; // idUsuario -> color

        // Recorrer usuarios y asignar colores únicos
        const usersWithColors = data.users.map((user: any, index: number) => {
          let color = user.color;
          if (!color) {
            const availableColorIndex = USER_COLORS.findIndex((col) => !Object.values(assignedColors).includes(col));
            color = availableColorIndex !== -1 ? USER_COLORS[availableColorIndex] : "#808080";
            assignedColors[user.id] = color;
          }
          return {
            id: user.id,
            username: user.profile?.username || `Usuario ${index + 1}`,
            color: color
          };
        });

        setMapUsers(usersWithColors);

        // Encontrar el color del usuario actual
        const currentUser = usersWithColors.find((user: MapUser) => user.id === userId);
        if (currentUser) {
          setUserColorIndex(USER_COLORS.indexOf(currentUser.color) || 0);
        } else {
          setUserColorIndex(0); // Verde por defecto
        }
      } else {
        console.warn("No se pudieron obtener los usuarios del mapa colaborativo");
      }
    } catch (error) {
      console.error("Error al obtener los usuarios del mapa colaborativo:", error);
    }
  };

  // Función para desbloquear un distrito en el mapa colaborativo
  const desbloquearDistrito = async (districtId: string, regionId: string) => {
    try {
      console.log(`Desbloqueando distrito ${districtId} por usuario ${userId} en mapa ${mapId}`);
      const userColor = USER_COLORS[userColorIndex]; // Obtener color asignado al usuario

      const response = await fetch(`${API_URL}/api/districts/unlock/${districtId}/${userId}/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: userColor }) // Enviamos el color
      });

      const data = await response.json();
      console.log("Respuesta de desbloqueo:", data);

      if (data.success) {
        console.log(`Distrito ${districtId} desbloqueado en mapa colaborativo.`);
        console.log(`Color asignado: ${userColor}`);

        // Actualizar el distrito en el estado local con el color correcto
        setDistritosBackend((prev) =>
          prev.map((d) =>
            d.id === districtId
              ? {
                ...d,
                isUnlocked: true,
                unlockedByUserId: userId,
                color: userColor // Usamos el color asignado
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
  const handleMapPress = (coordinate: { latitude: number; longitude: number }) => {
    let poiDistrict: Distrito | null = null;
    for (const d of distritosBackend) {
      if (isPointInPolygon(coordinate, d.coordenadas)) {
        poiDistrict = d;
        break;
      }
    }
    if (!poiDistrict) {
      Alert.alert("Ubicación no válida", "No puedes crear un punto de interés fuera de un distrito.");
      return;
    }
    if (!poiDistrict.isUnlocked) {
      Alert.alert("Distrito bloqueado", `El distrito "${poiDistrict.nombre}" está bloqueado.`);
      return;
    }
    setPointOfInterest({
      ...pointOfInterest,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      district: poiDistrict,
    });
    setShowForm(true);
  };

  // Función para inicializar el mapa colaborativo
  const initializeMap = async () => {
    try {
      console.log(`Inicializando mapa colaborativo: ${mapId}`);

      // Si no hay mapId, no podemos inicializar el mapa
      if (!mapId) {
        Alert.alert("Error", "No se pudo encontrar el ID del mapa colaborativo");
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
      Alert.alert(
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
  const sendFriendRequest = async (friendId: string) => {
    try {
      console.log(`mapa colaborativo ${mapId} para ${friendId} enviada por ${user?.id}`);
      const response = await fetch(`${API_URL}/api/friends/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user?.id, receiverId: friendId, mapId: mapId }),
      });
      console.log("Respuesta del backend:", response);
      const data = await response.json();
      console.log("Respuesta invitacion:", data); // Verifica la estructura en consola

      if (data.success) {
        Alert.alert("Invitación enviada", `Has invitado a ` + data.friend.recipient.profile.username);
      } else {
        Alert.alert("No se pudo enviar la invitación", "El usuario ya tiene una invitación pendiente para este mapa.");
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
    }
  };

  // Función para iniciar el seguimiento de ubicación
  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu ubicación para mostrar el mapa colaborativo.");
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
      Alert.alert(
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

  // Al montar el componente se obtienen distritos, POIs, usuarios y se comienza a observar la ubicación
  useEffect(() => {
    // Si no hay un mapId válido, no continuamos
    if (!mapId) {
      Alert.alert("Error", "No se ha proporcionado un ID de mapa válido");
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

  useEffect(() => {
    if (mapUsers.length > 0) {
      fetchDistricts();
    }
  }, [mapUsers]);
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
        const { id, nombre, isUnlocked, unlockedByUserId, regionId } = distritoEncontrado;

        // Solo intentamos desbloquear si no está ya desbloqueado por otro usuario
        if (!isUnlocked) {
          desbloquearDistrito(id, regionId);
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

  const renderUserColorLegend = () => {
    return (
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Usuarios</Text>
        <ScrollView style={{ maxHeight: 150 }}>
          {mapUsers.map((user, index) => {
            // Usamos (user as any).color para acceder al valor asignado en fetchMapUsers
            const assignedColor = (user as any).color || USER_COLORS[user.colorIndex] || "#000";
            console.log(`Leyenda: Usuario ${user.username} tiene color ${assignedColor}`);
            return (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[
                    styles.colorSquare,
                    { backgroundColor: assignedColor }
                  ]}
                />
                <Text style={styles.legendText}>
                  {user.username} {user.id === userId ? "(Tú)" : ""}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };


  const fetchFriends = async (userId: string) => {
    try {
      console.log(`Solicitando amigos para el usuario: ${userId}`);
      const response = await fetch(`${API_URL}/api/friends/friends/${userId}`);
      const data = await response.json();

      console.log("Respuesta del backend:", data); // Verifica la estructura en consola

      if (Array.isArray(data)) {
        // Si la respuesta es directamente un array de usuarios, lo asignamos
        setFriends(data.map((user) => ({
          id: user.id,
          name: user.email, // Puedes usar otra propiedad si el backend la tiene
        })));
      } else {
        console.warn("Formato inesperado en la respuesta de amigos:", data);
      }
    } catch (error) {
      console.error("Error al obtener amigos:", error);
    }
  };
  const getAvailableFriends = () => {
    return friends.filter(
      (friend) =>
        !invitedFriends.includes(friend.id) &&
        !mapUsers.some((user) => user.id === friend.id)
    );
  };

  const renderInviteFriendsModal = () => {
    const availableFriends = getAvailableFriends();
    return (
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invitar Amigos</Text>
            <Text style={styles.modalSubtitle}>
              Máximo 5 amigos (6 usuarios en total)
            </Text>

            {availableFriends.length === 0 ? (
              <Text style={styles.noFriendsText}>
                Tus amigos ya se han unido a este mapa.
              </Text>
            ) : (
              <FlatList
                data={availableFriends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.invitedItem}>
                    <Text style={styles.friendName}>{item.name}</Text>
                    <TouchableOpacity
                      style={styles.inviteButton}
                      onPress={() => sendFriendRequest(item.id)}
                    >
                      <Text style={styles.inviteButtonText}>Invitar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.closeButton}
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

      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
      />
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

          <Modal
            visible={showForm}
            transparent={true}
            onRequestClose={() => setShowForm(false)}
          >
            <AlertModal
              visible={alertModal.visible}
              title={alertModal.title}
              message={alertModal.message}
              onClose={closeAlertModal}
            />
          <View style={styles.modalOverlay}>
            
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
              showAlert={showAlert}
            />
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
              const { latitude, longitude } = e.nativeEvent.coordinate;
              handleMapPress({ latitude, longitude });
            }}
          >
            {distritosBackend.map((distrito, index) => {
              return (
                <Polygon
                  key={index}
                  coordinates={distrito.coordenadas}
                  strokeColor={"#808080"}
                  fillColor={
                    distrito.isUnlocked && distrito.color
                      ? distrito.color
                      : "rgba(128, 128, 128, 0.7)"
                  }
                  strokeWidth={2}
                />
              );
            })}

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
    backgroundColor: "transparent",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  noFriendsText: {
    textAlign: "center",
    color: "#666",
    marginVertical: 10,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
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
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
  },
  inviteButton: {
    backgroundColor: "#14b8a6", // Tono medio para el botón
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  inviteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#03045E", // Tono oscuro para el botón de cerrar
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  invitedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  invitedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },
  friendName: {
    fontSize: 16,
    color: "#023E8A",
    flex: 1,
  },
  reloadButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    elevation: 5,
  },
  reloadButtonText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  modalButton: {
    backgroundColor: '#3182ce',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a5568',
  },
  modalOverlay: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo oscuro
    justifyContent: 'center', // Centrado verticalmente
    alignItems: 'center', // Centrado horizontalmente
  },
});

export default CollaborativeMapScreen; 