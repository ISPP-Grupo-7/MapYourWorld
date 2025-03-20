import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, Alert, Text, Animated, Modal, TouchableOpacity } from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import * as Location from "expo-location";
import PuntoDeInteresForm from "../POI/PoiForm";
import { API_URL } from '../../constants/config';
import { useAuth } from '../../contexts/AuthContext';

// Tipos para distritos y POIs
interface Distrito {
  id: string;
  nombre: string;
  coordenadas: { latitude: number; longitude: number }[];
  isUnlocked: boolean;
  regionId: string;
}

interface DistritoBackend {
  id: string;
  name: string;
  description: string;
  boundaries: any;
  isUnlocked: boolean;
  region_assignee?: { // ⬅ Agregar esta propiedad opcional
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

interface POI {
  id?: string;
  name: string;
  description: string;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
}

interface MapScreenProps {
  distritos?: Distrito[];
}

// Componente Modal de Alerta personalizado para mantener consistencia con la versión web
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
      <Text style={styles.logroSubtitle}>Primer distrito desbloqueado</Text>
      <Text style={styles.logroDistrito}>{distrito}</Text>
    </Animated.View>
  );
};

const MapScreen: React.FC<MapScreenProps> = ({ distritos = [] }) => {

  const { user } = useAuth();
  
  // Verificamos el usuario con un console.log
  useEffect(() => {
    console.log("Usuario actual en MapScreen:", user);
  }, [user]);

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
      const pointI = polygon[i];
      const pointJ = polygon[j];
      const intersect =
        (pointI.longitude > longitude) !== (pointJ.longitude > longitude) &&
        latitude <
          ((pointJ.latitude - pointI.latitude) *
            (longitude - pointI.longitude)) /
            (pointJ.longitude - pointI.longitude) +
            pointI.latitude;
      if (intersect) inside = !inside;
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

  const fetchUserMap = async (userId: string): Promise<any> => {
    const url = `${API_URL}/api/maps/principalMap/user/${userId}`;
  
    try {
      const response = await fetch(url, {
        method: "GET", // Cambia a "POST", "PUT", "DELETE" si es necesario
        headers: {
          "Content-Type": "application/json",
          // Agrega otros headers si es necesario, como tokens de autenticación
        },
      });
  
      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la petición:", error);
      throw error;
    }
  };
  
    
  // Función para obtener los distritos desde el backend
  const fetchDistritos = async () => {


    try {

      setLoading(true);

    // Obtener userId del contexto
    if (!user?.id) {
      throw new Error("Usuario no autenticado");
    }

    // Obtener el mapa del usuario
      const userMap = await fetchUserMap(user.id); // Esperamos el resultado correctamente
      console.log("Datos recibidos del mapa del usuario:", userMap);
      setLoading(true);
      const response = await fetch(`${API_URL}/api/districts/map/${userMap.map.id}`);
      const data = await response.json();
      

      if (data.success && data.districts) {
        const distritosMapeados = data.districts
          .map((distrito: DistritoBackend) => {
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
                regionId: distrito.region_assignee ? distrito.region_assignee.id : null, 
              };
            } catch (error) {
              console.error(`Error procesando distrito ${distrito.name}:`, error);
              return null;
            }
          })
          .filter((d: Distrito | null): d is Distrito => d !== null);
        setDistritosBackend(distritosMapeados);
      } else {
        Alert.alert("Error", "No se pudieron cargar los distritos");
      }
    } catch (error) {
      console.error("Error al obtener los distritos:", error);
      Alert.alert("Error", "Ocurrió un error al cargar los distritos");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener todos los POIs desde el backend
  const fetchPOIs = async () => {
    try {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }
      const userMap = await fetchUserMap(user.id); // Esperamos el resultado correctamente
      const response = await fetch(`${API_URL}/api/poi/map/${userMap.map.id}`);
      const data = await response.json();
      if (data.pois) {  // Aquí se omite la validación de 'success'
        setPointsOfInterest(data.pois);
      } else {
        console.warn("No se pudieron obtener los puntos de interés");
      }
    } catch (error) {
      console.error("Error al obtener los puntos de interés:", error);
    }
  };

  // Función para desbloquear un distrito si el usuario se encuentra dentro de él
  const desbloquearDistrito = async (districtId: string, regionId:String) => {
    try {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }
      const response = await fetch(`${API_URL}/api/districts/unlock/${districtId}/${user.id}/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUnlocked: true }),
      });
      const data = await response.json();
      if (data.success) {
        console.log(`Distrito ${districtId} desbloqueado.`);
        setDistritosBackend((prev) =>
          prev.map((d) => (d.id === districtId ? { ...d, isUnlocked: true } : d))
        );
      } else {
        console.warn(`No se pudo desbloquear el distrito ${districtId}`);
      }
    } catch (error) {
      console.error("Error al desbloquear el distrito:", error);
    }
  };

  // Al montar el componente se obtienen distritos, POIs y se comienza a observar la ubicación
  useEffect(() => {
    fetchDistritos();
    fetchPOIs();
    let locationSubscription: Location.LocationSubscription | null = null;
    const startWatchingLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permiso denegado", "Necesitamos acceso a tu ubicación para mostrar el mapa.");
        return;
      }
      locationSubscription = await Location.watchPositionAsync(
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
    };
    startWatchingLocation();
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Verificar si el usuario se encuentra dentro de algún distrito y desbloquearlo si es necesario
  useEffect(() => {
    if (location && distritosBackend.length > 0) {
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
        const { id, nombre, isUnlocked, regionId } = distritoEncontrado;
        if (!isUnlocked) {
          desbloquearDistrito(id, regionId);
        }
        if (!distritosVisitados.has(nombre)) {
          setDistritosVisitados(new Set(distritosVisitados).add(nombre));
          setDistritoActual(nombre);
          setTimeout(() => {
            setMostrarLogro(true);
            setTimeout(() => setMostrarLogro(false), 6000);
          }, 4000);
        }
      } else {
        setDistritoActual(null);
      }
    }
  }, [location, distritosBackend]);

  // Función para obtener el distritoId basado en las coordenadas

  return (
    <View style={styles.container}>
      {/* Modal de Alerta */}
      <AlertModal 
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <>
          <Modal
            visible={showForm}
            transparent={true}
            onRequestClose={() => setShowForm(false)}
          >
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

              // Verificar si el punto está dentro de algún distrito
              let poiDistrict = null;
              for (const distrito of distritosBackend) {
                if (isPointInPolygon({ latitude, longitude }, distrito.coordenadas)) {
                  poiDistrict = distrito;
                  break;
                }
              }
              
              // Validamos que el punto esté en un distrito y que el distrito esté desbloqueado
              if (!poiDistrict) {
                showAlert('Ubicación no válida', 'No puedes crear un punto de interés fuera de un distrito.');
                return;
              }
              
              if (!poiDistrict.isUnlocked) {
                showAlert('Distrito bloqueado', `El distrito "${poiDistrict.nombre}" está bloqueado. Debes desbloquearlo primero para añadir puntos de interés.`);
                return;
              }
              
              // Si todo está correcto, mostramos el formulario
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
                  distrito.isUnlocked
                    ? "rgba(0, 255, 0, 0.3)"
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
  // Estilos para el modal de alerta
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalContent: {
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2d3748',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a5568',
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
});

export default MapScreen;
