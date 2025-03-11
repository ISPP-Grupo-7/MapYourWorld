import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Alert, Text, Animated, Modal } from "react-native";
import MapView, { Polygon, Marker } from "react-native-maps";
import * as Location from "expo-location";
import PuntoDeInteresForm from "../POI/PoiForm";
import { API_URL } from '../../constants/config';

// Tipos para distritos y POIs
interface Distrito {
  id: string;
  nombre: string;
  coordenadas: { latitude: number; longitude: number }[];
  isUnlocked: boolean;
}

interface DistritoBackend {
  id: string;
  name: string;
  description: string;
  boundaries: any;
  isUnlocked: boolean;
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
  const fetchDistritos = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/districts`);
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
      const response = await fetch("http://192.168.1.49:3000/api/poi/all");
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
  const desbloquearDistrito = async (districtId: string) => {
    try {
      const response = await fetch(`http://192.168.1.49:3000/api/districts/unlock/${districtId}/1`, {
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
        Alert.alert("Permiso denegado", "Necesitamos acceso a tu ubicación para mostrar el mapa.");
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
        const { id, nombre, isUnlocked } = distritoEncontrado;
        if (!isUnlocked) {
          desbloquearDistrito(id);
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

              let poiDistrict = null;
              for (const distrito of distritosBackend) {
                if (isPointInPolygon({ latitude, longitude }, distrito.coordenadas)) {
                  poiDistrict = distrito; // Guardamos el ID del distrito
                  break;
                }
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
});

export default MapScreen;
