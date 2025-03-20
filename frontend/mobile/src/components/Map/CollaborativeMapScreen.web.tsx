import React, { useEffect, useState, useRef } from "react";
import { Alert, ActivityIndicator, View, Text } from "react-native";
import { styled } from 'nativewind';
import { API_URL } from "@/constants/config";

// Agregar logs para depuración
console.log("Cargando CollaborativeMapScreen.web.tsx");
console.log("API_URL:", API_URL);

// Definición de tipos para los componentes de Leaflet
type LeafletComponent = any;
type LeafletLibrary = any;

// Variables para almacenar los componentes de Leaflet
let leafletLoaded = false;
let MapContainer: LeafletComponent = null;
let TileLayer: LeafletComponent = null;
let Polygon: LeafletComponent = null;
let Marker: LeafletComponent = null;
let L: LeafletLibrary = null;

const StyledView = styled(View);
const StyledText = styled(Text);

// Interfaces de distritos y POIs
interface DistritoBackend {
  id: string;
  name: string;
  description: string;
  boundaries: any;
  isUnlocked: boolean;
  user?: { id: string };
}

interface Distrito {
  id: string;
  nombre: string;
  coordenadas: { latitude: number; longitude: number }[];
  isUnlocked: boolean;
  unlockedByUserId?: string;
  colorIndex?: number;
}

interface POI {
  id?: string;
  name: string;
  description: string;
  location: {
    type: string;
    coordinates: number[];
  };
}

// Componente de mapa real que se renderizará
const LeafletMap = ({ location, distritos }: any) => {
  console.log("Renderizando LeafletMap colaborativo interno");
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Función para convertir un arreglo de { latitude, longitude } en arrays [lat, lng] para leaflet
  const convertirCoordenadas = (coords: { latitude: number; longitude: number }[]) =>
    coords.map((coord) => [coord.latitude, coord.longitude] as [number, number]);
  
  // Efecto para inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || !L) return;
    
    console.log("Inicializando mapa Leaflet colaborativo manualmente");
    
    // Crear instancia del mapa
    const map = L.map(mapContainerRef.current).setView(location, 13);
    
    // Agregar capa de mosaicos
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Añadir distritos al mapa
    distritos.forEach((distrito: Distrito) => {
      console.log(`Renderizando distrito colaborativo: ${distrito.nombre}`);
      const posiciones = convertirCoordenadas(distrito.coordenadas);
      const color = distrito.isUnlocked ? "rgb(0, 255, 0)" : "rgb(128, 128, 128)";
      
      L.polygon(posiciones, {
        fillColor: color,
        color: "#808080",
        weight: 2,
        fillOpacity: 0.4
      }).addTo(map);
    });
    
    // Guardar referencia al mapa
    mapInstanceRef.current = map;
    setMapReady(true);
    
    // Limpieza al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, distritos]);
  
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
};

// Componente adaptado para web (usando react-leaflet)
const CollaborativeMapScreenWeb: React.FC<{ mapId: string; userId: string }> = ({ mapId, userId }) => {
  console.log("Renderizando CollaborativeMapScreenWeb con mapId:", mapId, "userId:", userId);
  const [location, setLocation] = useState<[number, number]>([40.416775, -3.70379]); // Madrid por defecto
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const mapRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Cargar Leaflet solo una vez al inicio
  useEffect(() => {
    console.log("Cargando módulos de Leaflet para mapa colaborativo...");
    
    // Función para cargar Leaflet de manera segura
    const loadLeaflet = async () => {
      // Solo cargamos Leaflet si estamos en un entorno web y aún no se ha cargado
      if (typeof window !== 'undefined' && typeof document !== 'undefined' && !leafletLoaded) {
        try {
          console.log("Intentando cargar módulos para web en CollaborativeMapScreen");
          
          // Primero cargamos Leaflet
          const leafletModule = await import('leaflet');
          L = leafletModule.default || leafletModule;
          
          // Importamos el CSS - El linter TypeScript puede quejarse, pero esto funciona en entorno web
          if (typeof document !== 'undefined') {
            // Creamos una etiqueta link en el head para cargar el CSS
            const linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            linkElement.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            linkElement.crossOrigin = '';
            document.head.appendChild(linkElement);
            console.log("CSS de Leaflet cargado manualmente");
          }
          
          // Configurar los iconos de Leaflet
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
            iconUrl: require('leaflet/dist/images/marker-icon.png'),
            shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
          });
          
          // Guardar referencia global a L
          window.L = L;
          
          console.log("Leaflet configurado correctamente para el mapa colaborativo");
          leafletLoaded = true;
          setLeafletReady(true);
        } catch (error) {
          console.error("Error al cargar los módulos de Leaflet para el mapa colaborativo:", error);
          setError("No se pudo cargar el mapa colaborativo. Error al cargar las dependencias.");
          setLoading(false);
        }
      } else if (!leafletLoaded) {
        console.log("No se puede cargar Leaflet en este entorno para el mapa colaborativo");
        setError("El mapa colaborativo no puede cargarse en este entorno. Por favor, accede desde un navegador web compatible.");
        setLoading(false);
      } else {
        console.log("Leaflet ya está cargado para el mapa colaborativo");
        setLeafletReady(true);
      }
    };
    
    loadLeaflet();
  }, []);

  // Efectos para cargar datos y ubicación
  useEffect(() => {
    console.log("CollaborativeMapScreen.web useEffect");
    
    // Solo procedemos si Leaflet está cargado o tenemos un error
    if (leafletReady || error) {
      // Cargar distritos del mapa colaborativo
      fetchDistricts();
      
      // Intentar obtener ubicación actual del usuario
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        console.log("Obteniendo geolocalización para el mapa colaborativo...");
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            console.log("Posición obtenida:", position.coords);
            setLocation([position.coords.latitude, position.coords.longitude]);
            setLoading(false);
          },
          (err) => {
            console.error("Error al obtener la ubicación:", err);
            setError("No se pudo acceder a tu ubicación. Mostrando una ubicación predeterminada.");
            setLocation([40.416775, -3.70379]); // Madrid por defecto si falla
            setLoading(false);
          },
          { timeout: 100000, enableHighAccuracy: true, maximumAge: 0 }
        );
        return () => {
          navigator.geolocation.clearWatch(watchId);
        };
      } else {
        console.log("Geolocalización no disponible para el mapa colaborativo");
        setError("Tu navegador no soporta geolocalización.");
        setLocation([40.416775, -3.70379]);
        setLoading(false);
      }
    }
  }, [leafletReady, error, mapId]);

  // Función para transformar coordenadas desde GeoJSON al formato { latitude, longitude }
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

  // Función para obtener los distritos desde el backend para el mapa colaborativo
  const fetchDistricts = async () => {
    try {
      console.log("Obteniendo distritos para el mapa colaborativo...");
      setLoading(true);
      console.log(`Fetching from: ${API_URL}/api/districts/map/${mapId}`);
      const response = await fetch(`${API_URL}/api/districts/map/${mapId}`);
      
      if (!response.ok) {
        throw new Error(`Error de red: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Respuesta de distritos colaborativos:", data.success, data.districts?.length);
      
      if (data.success && data.districts && data.districts.length > 0) {
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
                unlockedByUserId: distrito.user?.id,
                colorIndex: undefined,
              } as Distrito;
            } catch (error) {
              console.error(`Error procesando distrito ${distrito.name}:`, error);
              return null;
            }
          })
          .filter((d: Distrito | null): d is Distrito => d !== null);
          
        console.log("Distritos colaborativos mapeados:", distritosMapeados.length);
        setDistritos(distritosMapeados);
        setLoading(false);
      } else {
        console.error("No se pudieron cargar los distritos colaborativos:", data);
        setError("No se pudieron cargar los distritos del mapa colaborativo");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error al obtener los distritos colaborativos:", error);
      setError(`Error al cargar los distritos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Renderizado condicional para mostrar pantalla de carga
  if (loading) {
    console.log("Renderizando pantalla de carga para el mapa colaborativo");
    return (
      <StyledView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        {error && <StyledText className="mt-4 text-red-500">{error}</StyledText>}
      </StyledView>
    );
  }

  // Renderizado condicional para mostrar error
  if (error) {
    console.log("Renderizando pantalla de error para el mapa colaborativo:", error);
    return (
      <StyledView className="flex-1 justify-center items-center p-4">
        <StyledText className="text-lg text-red-500 mb-4">
          {error}
        </StyledText>
        <StyledText className="text-base text-gray-700">
          API_URL: {API_URL}
        </StyledText>
        <StyledText className="text-base text-gray-700">
          mapId: {mapId}
        </StyledText>
      </StyledView>
    );
  }

  // Renderizado condicional si leaflet no está listo
  if (!leafletReady) {
    console.log("Esperando a que Leaflet esté listo para el mapa colaborativo");
    return (
      <StyledView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="mt-4">Cargando el mapa colaborativo...</StyledText>
      </StyledView>
    );
  }

  // Renderización del mapa usando un enfoque más seguro
  console.log("Renderizando mapa colaborativo con MapContainer");
  return <LeafletMap location={location} distritos={distritos} />;
};

const styles = {
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

export default CollaborativeMapScreenWeb;
