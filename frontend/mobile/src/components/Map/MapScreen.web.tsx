import React, { useEffect, useState, useRef } from "react";
import { View, Text, Alert, ActivityIndicator, StyleSheet, Modal } from "react-native";
import { styled } from 'nativewind';
import { API_URL } from "@/constants/config";
import PuntoDeInteresForm from "../POI/PoiForm";

// Agregar logs para depuración
console.log("Cargando MapScreen.web.tsx");
console.log("API_URL:", API_URL);

// Interfaces para POIs y distritos
interface POI {
  id?: string;
  name: string;
  description: string;
  category?: string; // Categoría del POI: MONUMENTOS, ESTACIONES, MERCADOS, PLAZAS, OTROS
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
}

// Componente de Modal para alertas personalizado
const AlertModal = ({ visible, title, message, onClose }: { visible: boolean, title: string, message: string, onClose: () => void }) => {
  if (!visible) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001 // Mayor que el formulario POI
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{ 
          backgroundColor: 'white',
          borderRadius: '12px', 
          padding: '20px',
          maxWidth: '90%',
          width: '350px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h2 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: '#2d3748'
        }}>
          {title}
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#4a5568',
          marginBottom: '20px'
        }}>
          {message}
        </p>
        <button 
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#3182ce',
            color: 'white',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={onClose}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

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

// Función para verificar si un punto está dentro de un polígono (distrito)
const isPointInPolygon = (
  point: { lat: number; lng: number },
  polygon: number[][]
) => {
  let inside = false;
  const { lat, lng } = point;
  const len = polygon.length;
  let j = len - 1;
  for (let i = 0; i < len; i++) {
    const vertex1 = polygon[i];
    const vertex2 = polygon[j];
    if (
      (vertex1[1] > lng) !== (vertex2[1] > lng) &&
      lat <
      ((vertex2[0] - vertex1[0]) * (lng - vertex1[1])) /
      (vertex2[1] - vertex1[1]) +
      vertex1[0]
    ) {
      inside = !inside;
    }
    j = i;
  }
  return inside;
};

// Componente de mapa real que se renderizará
const LeafletMap = ({ location, distritos, pointsOfInterest, onMapClick }: any) => {
  console.log("Renderizando LeafletMap interno");
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Efecto para inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || !L) return;
    
    console.log("Inicializando mapa Leaflet manualmente");
    
    // Crear instancia del mapa
    const map = L.map(mapContainerRef.current).setView(location, 13);
    
    // Agregar capa de mosaicos
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Añadir distritos al mapa
    distritos.forEach((distrito: any, index: number) => {
      console.log(`Renderizando distrito ${index}: ${distrito.nombre}`);
      const color = distrito.isUnlocked ? "rgb(0, 255, 0)" : "rgb(128, 128, 128)";
      
      L.polygon(distrito.coordenadas, {
        fillColor: color,
        color: color,
        fillOpacity: 0.4
      }).addTo(map);
    });
    
    // Añadir marcadores para los puntos de interés
    if (pointsOfInterest && pointsOfInterest.length > 0) {
      console.log(`Renderizando ${pointsOfInterest.length} puntos de interés`);
      
      // Definir iconos personalizados para cada categoría
      const iconSize = [32, 32]; // Tamaño de los iconos en píxeles
      const iconAnchor = [16, 32]; // Punto de anclaje del icono (centro inferior)
      const popupAnchor = [0, -30]; // Punto de anclaje del popup (superior)
      
      const categoryIcons: Record<string, any> = {
        MONUMENTOS: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/3105/3105768.png',
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor
        }),
        ESTACIONES: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor
        }),
        MERCADOS: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/3082/3082011.png',
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor
        }),
        PLAZAS: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/3254/3254074.png',
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor
        }),
        OTROS: L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          iconSize: iconSize,
          iconAnchor: iconAnchor,
          popupAnchor: popupAnchor
        })
      };
      
      // Icono por defecto para POIs sin categoría
      const defaultIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        iconSize: iconSize,
        iconAnchor: iconAnchor,
        popupAnchor: popupAnchor
      });
      
      pointsOfInterest.forEach((poi: POI) => {
        // Seleccionar el icono según la categoría del POI o usar el icono por defecto
        const icon = poi.category ? categoryIcons[poi.category] || defaultIcon : defaultIcon;
        
        const marker = L.marker(
          [
            poi.location.coordinates[1], // latitude
            poi.location.coordinates[0], // longitude
          ],
          { icon: icon }
        );
        
        marker.bindPopup(`
          <div>
            <h3>${poi.name}</h3>
            <p>${poi.description}</p>
            ${poi.category ? `<p><strong>Categoría:</strong> ${poi.category}</p>` : ''}
          </div>
        `);
        
        marker.addTo(map);
      });
    }
    
    // Agregar evento de clic para añadir nuevo POI
    map.on('click', (e: any) => {
      if (onMapClick) {
        const latlng = e.latlng;
        onMapClick({ latitude: latlng.lat, longitude: latlng.lng });
      }
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
  }, [location, distritos, pointsOfInterest, onMapClick]);
  
  return (
    <div style={{height: "100vh", width: "100vw"}}>
      <div ref={mapContainerRef} style={{height: "100%", width: "100%"}} />
    </div>
  );
};

// Componente para versión web que usa react-leaflet
const MapScreen = () => {
  console.log("Renderizando MapScreen web");
  const [location, setLocation] = useState<[number,number]>([40.416775,-3.703790]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [pointsOfInterest, setPointsOfInterest] = useState<POI[]>([]);
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
  
  // Estado para el modal de alertas
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: ''
  });
  
  const mapRef = useRef(null);
  const [leafletReady, setLeafletReady] = useState(false);
  
  // Función para mostrar alerta en modal
  const showAlert = (title: string, message: string) => {
    setAlertModal({
      visible: true,
      title,
      message
    });
  };
  
  // Función para cerrar el modal de alerta
  const closeAlertModal = () => {
    setAlertModal({
      ...alertModal,
      visible: false
    });
  };
  
  // Cargar Leaflet solo una vez al inicio
  useEffect(() => {
    console.log("Cargando módulos de Leaflet...");
    
    // Función para cargar Leaflet de manera segura
    const loadLeaflet = async () => {
      // Solo cargamos Leaflet si estamos en un entorno web y aún no se ha cargado
      if (typeof window !== 'undefined' && typeof document !== 'undefined' && !leafletLoaded) {
        try {
          console.log("Intentando cargar módulos para web");
          
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
          
          console.log("Leaflet configurado correctamente");
          leafletLoaded = true;
          setLeafletReady(true);
        } catch (error) {
          console.error("Error al cargar los módulos de Leaflet:", error);
          setError("No se pudo cargar el mapa. Error al cargar las dependencias.");
          setLoading(false);
        }
      } else if (!leafletLoaded) {
        console.log("No se puede cargar Leaflet en este entorno");
        setError("El mapa no puede cargarse en este entorno. Por favor, accede desde un navegador web compatible.");
        setLoading(false);
      } else {
        console.log("Leaflet ya está cargado");
        setLeafletReady(true);
      }
    };
    
    loadLeaflet();
  }, []);

  // Efectos para cargar datos y ubicación
  useEffect(() => {
    console.log("MapScreen.web useEffect");
    
    // Solo procedemos si Leaflet está cargado o tenemos un error
    if (leafletReady || error) {
      fetchDistritos();
      fetchPOIs();

      // En web usamos la API de geolocalización del navegador
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        console.log("Obteniendo geolocalización...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Posición obtenida:", position.coords);
            setLocation([
              position.coords.latitude,
              position.coords.longitude
            ]);
            setLoading(false);
          },
          (err) => {
            console.error("Error al obtener la ubicación:", err);
            setError("No se pudo acceder a tu ubicación. Mostrando una ubicación predeterminada.");
            // Ubicación por defecto (Madrid)
            setLocation([40.416775, -3.703790]);
            setLoading(false);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        console.log("Geolocalización no disponible");
        setError("Tu navegador no soporta geolocalización.");
        // Ubicación por defecto
        setLocation([40.416775, -3.703790]);
        setLoading(false);
      }
    }
  }, [leafletReady, error]);

  // Función para transformar coordenadas desde GeoJSON al formato de react-native-maps
  const transformarCoordenadasGeoJSON = (geoJson: any): any => {
    try {
      if (!geoJson || !geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
        return [];
      }
      let coordenadas: any[] = [];
      const procesarCoordenadas = (coords: any[]): void => {
        if (coords.length === 2 && typeof coords[0] === "number" && typeof coords[1] === "number") {
          coordenadas.push([coords[1], coords[0]]);
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
      console.log("Obteniendo distritos...");
      setLoading(true);
      console.log("Fetching from:", `${API_URL}/api/districts`);
      const response = await fetch(`${API_URL}/api/districts`);
      if (!response.ok) {
        throw new Error(`Error de red: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Respuesta de distritos:", data.success, data.districts?.length);
      if (data.success && data.districts) {
        const distritosMapeados = data.districts
          .map((distrito: any) => {
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
          .filter((d: any) => d !== null);
        console.log("Distritos mapeados:", distritosMapeados.length);
        setDistritos(distritosMapeados);
        setLoading(false);
      } else {
        console.error("No se pudieron cargar los distritos:", data);
        setError("No se pudieron cargar los distritos");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error al obtener los distritos:", error);
      setError(`Error al cargar los distritos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setLoading(false);
    }
  };

  // Función para obtener todos los POIs desde el backend
  const fetchPOIs = async () => {
    try {
      console.log("Obteniendo puntos de interés...");
      const response = await fetch(`${API_URL}/api/poi/all`);
      const data = await response.json();
      if (data.pois) {
        console.log(`Se obtuvieron ${data.pois.length} puntos de interés`);
        setPointsOfInterest(data.pois);
      } else {
        console.warn("No se pudieron obtener los puntos de interés");
      }
    } catch (error) {
      console.error("Error al obtener los puntos de interés:", error);
    }
  };

  // Manejador cuando se hace clic en el mapa
  const handleMapClick = (coordinate: { latitude: number; longitude: number }) => {
    console.log("Clic en el mapa:", coordinate);
    
    // Verificar si el punto está dentro de algún distrito
    let poiDistrict = null;
    for (const distrito of distritos) {
      if (isPointInPolygon(
        { lat: coordinate.latitude, lng: coordinate.longitude },
        distrito.coordenadas
      )) {
        poiDistrict = distrito;
        break;
      }
    }
    
    // Verificar si el distrito existe y está desbloqueado
    if (!poiDistrict) {
      // No está en ningún distrito
      showAlert('Ubicación no válida', 'No puedes crear un punto de interés fuera de un distrito.');
      return;
    }
    
    if (!poiDistrict.isUnlocked) {
      // Está en un distrito bloqueado
      showAlert('Distrito bloqueado', `El distrito "${poiDistrict.nombre}" está bloqueado. Desbloquéalo primero para añadir puntos de interés.`);
      return;
    }
    
    // Si llegamos aquí, el distrito está desbloqueado
    setPointOfInterest({
      ...pointOfInterest,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      district: poiDistrict,
    });
    
    setShowForm(true);
  };

  // Renderizado condicional para mostrar pantalla de carga
  if (loading) {
    console.log("Renderizando pantalla de carga");
    return (
      <StyledView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        {error && <StyledText className="mt-4 text-red-500">{error}</StyledText>}
      </StyledView>
    );
  }

  // Renderizado condicional para mostrar error
  if (error) {
    console.log("Renderizando pantalla de error:", error);
    return (
      <StyledView className="flex-1 justify-center items-center p-4">
        <StyledText className="text-lg text-red-500 mb-4">
          {error}
        </StyledText>
        <StyledText className="text-base text-gray-700">
          API_URL: {API_URL}
        </StyledText>
      </StyledView>
    );
  }

  // Renderizado condicional si leaflet no está listo
  if (!leafletReady) {
    console.log("Esperando a que Leaflet esté listo");
    return (
      <StyledView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="mt-4">Cargando el mapa...</StyledText>
      </StyledView>
    );
  }

  // Renderización del mapa con el componente Modal para el formulario
  console.log("Renderizando mapa completo");
  return (
    <>
      {/* Modal de alertas */}
      <AlertModal 
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        onClose={closeAlertModal}
      />
      
      {showForm && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={(e) => {
            // Cerrar modal al hacer clic fuera del formulario
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div 
            style={{ 
              backgroundColor: 'white',
              borderRadius: '12px', 
              padding: '20px',
              maxWidth: '90%',
              width: '380px',
              maxHeight: '90vh', 
              overflow: 'auto',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
            }}
          >
            {/* Estilo personalizado para el formulario web */}
            <style dangerouslySetInnerHTML={{ __html: `
              .form-container input, .form-container textarea {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 16px;
                margin-bottom: 10px;
              }
              
              .form-container .dropdown {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                font-size: 16px;
                background-color: white;
                cursor: pointer;
                margin-bottom: 10px;
              }
              
              .form-container .section-title {
                font-size: 18px;
                font-weight: 500;
                margin-bottom: 8px;
              }
              
              .form-container .add-photo-btn {
                width: 64px;
                height: 64px;
                border-radius: 8px;
                border: 1px solid #d1d5db;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
              }
              
              .form-container .btn-primary {
                width: 100%;
                padding: 12px;
                border-radius: 8px;
                background-color: #2563eb;
                color: white;
                font-weight: 600;
                text-align: center;
                margin-bottom: 10px;
                cursor: pointer;
                border: none;
              }
              
              .form-container .btn-danger {
                width: 100%;
                padding: 12px;
                border-radius: 8px;
                background-color: #dc2626;
                color: white;
                font-weight: 600;
                text-align: center;
                cursor: pointer;
                border: none;
              }
            ` }} />

            <h1 style={{
              fontSize: '22px',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              Registrar Punto de Interés
            </h1>

            <div className="form-container">
              <PuntoDeInteresForm
                pointOfInterest={pointOfInterest}
                setPointOfInterest={setPointOfInterest}
                setShowForm={setShowForm}
                onSave={(newPOI: any) => {
                  // Convertir el POI recién creado al formato esperado
                  const poiConverted = {
                    ...newPOI,
                    category: newPOI.category, // Aseguramos que la categoría se incluya
                    location: {
                      type: "Point",
                      coordinates: [newPOI.longitude, newPOI.latitude],
                    },
                  };
                  console.log('Nuevo POI creado:', poiConverted);
                  setPointsOfInterest((prev) => [...prev, poiConverted]);
                }}
                showAlert={showAlert}
              />
            </div>
          </div>
        </div>
      )}
      <LeafletMap 
        location={location} 
        distritos={distritos} 
        pointsOfInterest={pointsOfInterest}
        onMapClick={handleMapClick}
      />
    </>
  );
};

const StyledView = styled(View);
const StyledText = styled(Text);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logroContainer: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
  },
  logroEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  logroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  logroSubtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 5,
  },
  logroDistrito: {
    fontSize: 16,
    color: 'yellow',
    fontWeight: 'bold',
  },
});

export default MapScreen;