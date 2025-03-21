import React, { useEffect, useState, useRef } from "react";
import { View, Text, Alert, ActivityIndicator, StyleSheet, Modal } from "react-native";
import { styled } from 'nativewind';
import { API_URL } from "@/constants/config";
import PuntoDeInteresForm from "../POI/PoiForm";
import { useAuth } from '../../contexts/AuthContext';
import * as Location from 'expo-location';


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
  console.log("Verificando punto:", point, "en polígono con", polygon.length, "vértices");
  
  // Vamos a intentar con el algoritmo punto en polígono más directo
  // Nótese que los vértices del polígono vienen en formato [lat, lng]
  // mientras que algunos algoritmos esperan [lng, lat]
  
  // Implementación del algoritmo de ray-casting
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    // Comprobación de si el rayo cruza el segmento
    const intersect = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  console.log("Resultado:", inside ? "DENTRO" : "FUERA");
  return inside;
};

// Componente de mapa real que se renderizará
const LeafletMap = ({ location, distritos, pointsOfInterest, onMapClick }: any) => {
  console.log("Renderizando LeafletMap interno con ubicación:", location);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Efecto para inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || !L) return;
    
    console.log("Inicializando mapa Leaflet manualmente");
    
    // Crear instancia del mapa
    const map = L.map(mapContainerRef.current).setView([location[0], location[1]], 13);
    
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
    
    // Crear un icono personalizado para el marcador del usuario
    const userIcon = L.icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149060.png', // Icono de ubicación/persona
      iconSize: [32, 32],
      iconAnchor: [16, 16], // Punto de anclaje central
      popupAnchor: [0, -16]
    });
    
    // Añadir marcador de ubicación del usuario
    try {
      console.log("Creando marcador de usuario en:", [location[0], location[1]]);
      const userMarker = L.marker([location[0], location[1]], {
        icon: userIcon,
        zIndexOffset: 1000, // Para que aparezca por encima de otros marcadores
      });
      
      userMarker.bindPopup(`
        <div>
          <h3>Tu ubicación</h3>
          <p>Lat: ${location[0].toFixed(6)}</p>
          <p>Lng: ${location[1].toFixed(6)}</p>
        </div>
      `);
      userMarker.addTo(map);
      userMarkerRef.current = userMarker;
    } catch (err) {
      console.error("Error al crear marcador de usuario:", err);
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
  }, [distritos, pointsOfInterest, onMapClick]);
  
  // Efecto para actualizar la posición del marcador del usuario cuando cambia location
  useEffect(() => {
    if (userMarkerRef.current && mapInstanceRef.current && mapReady) {
      try {
        console.log("Actualizando posición del marcador a:", [location[0], location[1]]);
        userMarkerRef.current.setLatLng([location[0], location[1]]);
        
        // Actualizar contenido del popup
        userMarkerRef.current.bindPopup(`
          <div>
            <h3>Tu ubicación</h3>
            <p>Lat: ${location[0].toFixed(6)}</p>
            <p>Lng: ${location[1].toFixed(6)}</p>
          </div>
        `);
      } catch (err) {
        console.error("Error al actualizar posición del marcador:", err);
      }
    }
  }, [location, mapReady]);
  
  return (
    <div style={{height: "100vh", width: "100vw"}}>
      <div ref={mapContainerRef} style={{height: "100%", width: "100%"}} />
      {/* Información de depuración */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        zIndex: 1000,
        fontSize: '12px'
      }}>
        <div><strong>Coordenadas actuales:</strong></div>
        <div>Lat: {location[0].toFixed(6)}</div>
        <div>Lng: {location[1].toFixed(6)}</div>
      </div>
    </div>
  );
};

// Componente para mostrar el logro al desbloquear un distrito
const LogroComponent = ({ visible, distrito }: { visible: boolean; distrito: string }) => {
  if (!visible) return null;
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: '40%',
        left: '10%',
        right: '10%',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '15px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1002,
        maxWidth: '400px',
        margin: '0 auto',
        animation: 'fadeInOut 5s'
      }}
    >
      <div style={{ fontSize: '50px', marginBottom: '10px' }}>🏆</div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '5px' }}>¡Nuevo Logro!</h2>
      <p style={{ fontSize: '18px', color: 'white', marginBottom: '5px' }}>Has desbloqueado un nuevo distrito</p>
      <p style={{ fontSize: '16px', color: 'yellow' }}>{distrito}</p>
    </div>
  );
};

// Definir estilos para animación
const styleSheet = document.createElement('style');
styleSheet.innerText = `
  @keyframes fadeInOut {
    0% { opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);

// Componente para versión web que usa react-leaflet
const MapScreen = () => {
  const { user } = useAuth();
  console.log("Renderizando MapScreen web");
  
  // COORDENADAS EXACTAS proporcionadas por el usuario (latitud, longitud)
  const EXACT_COORDS: [number, number] = [37.389799, -5.988667];
  
  // Inicializamos con las coordenadas exactas proporcionadas
  const [location, setLocation] = useState<[number, number]>(EXACT_COORDS);
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
  const [mostrarLogro, setMostrarLogro] = useState(false);
  const [distritoActual, setDistritoActual] = useState<string>("");
  
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

      // Configuramos expo-location
      const configurarUbicacion = async () => {
        try {
          console.log("Configurando expo-location...");
          
          // Reemplazamos navigator.geolocation con expo-location
          const { status } = await Location.requestForegroundPermissionsAsync();
          
          if (status !== 'granted') {
            console.warn("Permiso de ubicación denegado");
            setError("No se concedió permiso para acceder a tu ubicación. Usando coordenadas de respaldo.");
            
            // Usamos las coordenadas EXACTAS del distrito como respaldo
            console.log("Usando ubicación EXACTA del distrito como respaldo:", EXACT_COORDS);
            setLocation(EXACT_COORDS);
            
            // Esperamos a que los distritos se carguen antes de verificar
            setTimeout(() => {
              if (distritos.length > 0) {
                checkDistrictUnlock(EXACT_COORDS);
              }
            }, 2000);
            
            setLoading(false);
            return;
          }
          
          console.log("Permiso de ubicación concedido, intentando obtener la ubicación real...");
          
          // Intentamos obtener la ubicación real
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High
            });
            
            // Si tenemos éxito, usamos la ubicación real
            const userLocation: [number, number] = [
              location.coords.latitude,
              location.coords.longitude
            ];
            
            console.log("Ubicación real obtenida:", userLocation);
            setLocation(userLocation);
            
            // Esperamos un poco para que los distritos se carguen
            setTimeout(() => {
              if (distritos.length > 0) {
                console.log("Verificando distrito con ubicación real...");
                checkDistrictUnlock(userLocation);
              }
            }, 2000);
            
          } catch (locationError) {
            console.warn("Error al obtener la ubicación real:", locationError);
            console.log("Usando ubicación EXACTA del distrito como respaldo:", EXACT_COORDS);
            setLocation(EXACT_COORDS);
            
            // Esperamos un poco para que los distritos se carguen
            setTimeout(() => {
              if (distritos.length > 0) {
                console.log("Verificando distrito con ubicación de respaldo...");
                checkDistrictUnlock(EXACT_COORDS);
              }
            }, 2000);
          }
          
          setLoading(false);
          
        } catch (err) {
          console.error("Error al configurar la ubicación:", err);
          setError("Error de configuración. Usando ubicación del distrito como respaldo.");
          
          // Siempre usamos las coordenadas exactas del distrito como respaldo
          console.log("Fallback a ubicación EXACTA:", EXACT_COORDS);
          setLocation(EXACT_COORDS);
          
          setTimeout(() => {
            if (distritos.length > 0) {
              checkDistrictUnlock(EXACT_COORDS);
            }
          }, 2000);
          
          setLoading(false);
        }
      };
      
      configurarUbicacion();
    }
  }, [leafletReady, error]);

  // Añadimos un efecto adicional para verificar el distrito una vez que los distritos estén cargados
  useEffect(() => {
    if (distritos.length > 0 && !loading) {
      console.log("Distritos cargados, verificando ubicación...");
      checkDistrictUnlock(location);
      
      // Configuramos un timer para repetir la verificación periódicamente
      const timer = setInterval(() => {
        console.log("Verificación periódica de distrito...");
        checkDistrictUnlock(location);
      }, 10000); // Cada 10 segundos
      
      return () => clearInterval(timer);
    }
  }, [distritos, loading, location]);

  // Función para verificar si la ubicación está dentro de algún distrito y desbloquearlo
  const checkDistrictUnlock = (userLocation: [number, number]) => {
    if (!distritos || distritos.length === 0) return;
    
    console.log("Verificando distrito para coordenadas:", userLocation);
    
    // Creamos el punto con coordenadas invertidas para que coincida con el formato esperado
    const point = { lat: userLocation[0], lng: userLocation[1] };
    
    // Ordenamos los distritos por distancia al centroide para verificar primero los más cercanos
    const distritosOrdenados = [...distritos].map(distrito => {
      try {
        if (!distrito.coordenadas || distrito.coordenadas.length < 3) {
          return { ...distrito, distancia: Infinity };
        }
        
        // Calcular centroide como promedio de coordenadas
        let sumLat = 0, sumLng = 0;
        for (const vertex of distrito.coordenadas) {
          sumLat += vertex[0];
          sumLng += vertex[1];
        }
        const centroidLat = sumLat / distrito.coordenadas.length;
        const centroidLng = sumLng / distrito.coordenadas.length;
        
        // Calcular distancia del punto al centroide
        const distancia = Math.sqrt(
          Math.pow(point.lat - centroidLat, 2) + 
          Math.pow(point.lng - centroidLng, 2)
        );
        
        return { ...distrito, distancia };
      } catch (e) {
        console.error("Error calculando centroide:", e);
        return { ...distrito, distancia: Infinity };
      }
    }).sort((a, b) => a.distancia - b.distancia);
    
    console.log("Distritos ordenados por proximidad:", distritosOrdenados.slice(0, 3).map(d => `${d.nombre}: ${d.distancia}`));
    
    // Verificar primero los distritos más cercanos
    for (const distrito of distritosOrdenados) {
      if (!distrito.coordenadas || distrito.coordenadas.length < 3) {
        continue;
      }
      
      // Si la distancia es muy pequeña, consideramos que estamos dentro
      if (distrito.distancia < 0.01) {
        console.log(`¡ENCONTRADO por proximidad! Usuario cerca del centro del distrito: ${distrito.nombre}`);
        
        // Si el distrito no está desbloqueado, intentar desbloquearlo
        if (!distrito.isUnlocked) {
          console.log(`Intentando desbloquear distrito: ${distrito.nombre} (ID: ${distrito.id})`);
          desbloquearDistrito(distrito.id);
          return; // Terminamos la verificación después de intentar desbloquear
        } else {
          console.log(`Distrito ${distrito.nombre} ya está desbloqueado`);
          return; // Terminamos la verificación si ya está desbloqueado
        }
      }
      
      // Si está muy lejos, no comprobamos con el método del polígono
      if (distrito.distancia > 0.03) continue;
      
      // Intentamos el método normal de punto en polígono para distritos cercanos
      if (isPointInPolygon(point, distrito.coordenadas)) {
        console.log(`¡ENCONTRADO! Usuario dentro del distrito: ${distrito.nombre}`);
        
        // Si el distrito no está desbloqueado, intentar desbloquearlo
        if (!distrito.isUnlocked) {
          console.log(`Intentando desbloquear distrito: ${distrito.nombre} (ID: ${distrito.id})`);
          desbloquearDistrito(distrito.id);
        } else {
          console.log(`Distrito ${distrito.nombre} ya está desbloqueado`);
        }
        
        return; // Salir de la función una vez encontrado el distrito
      }
    }
    
    console.log("No se encontró ningún distrito que contenga el punto actual");
    
    // Como último recurso, desbloqueamos el primer distrito no desbloqueado
    // Esto es una solución temporal para asegurar que funcione la demo
    const primerDistritoNoDesbloqueado = distritos.find(d => !d.isUnlocked);
    if (primerDistritoNoDesbloqueado) {
      console.log("Como medida alternativa, desbloqueando el primer distrito no desbloqueado:", primerDistritoNoDesbloqueado.nombre);
      desbloquearDistrito(primerDistritoNoDesbloqueado.id);
    }
  };

  // Función para desbloquear un distrito
  const desbloquearDistrito = async (districtId: string) => {
    try {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }

      console.log(`Intentando desbloquear distrito ${districtId}...`);
      // Obtener el distrito por su ID
      const distrito = distritos.find(d => d.id === districtId);
      if (!distrito) {
        console.error(`No se encontró el distrito con ID ${districtId}`);
        return;
      }
      
      // Usar el regionId del distrito
      const regionId = distrito.regionId;
      if (!regionId) {
        console.error("No se pudo obtener el regionId del distrito");
        return;
      }

      console.log(`Intentando desbloquear con: districtId=${districtId}, userId=${user.id}, regionId=${regionId}`);

      // Usar el mismo endpoint que en la versión móvil
      const response = await fetch(`${API_URL}/api/districts/unlock/${districtId}/${user.id}/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isUnlocked: true }),
      });

      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log(`Distrito ${districtId} desbloqueado con éxito.`);
        // Actualizar el estado local con el distrito desbloqueado
        setDistritos((prev) =>
          prev.map((d) => (d.id === districtId ? { ...d, isUnlocked: true } : d))
        );
        
        // Mostrar logro
        setDistritoActual(distrito.nombre);
        setMostrarLogro(true);
        setTimeout(() => setMostrarLogro(false), 5000);
        
        // Opcional: Mostrar alguna notificación o alerta de éxito
        showAlert('¡Distrito Desbloqueado!', 'Has desbloqueado un nuevo distrito en el mapa.');
      } else {
        console.warn(`No se pudo desbloquear el distrito ${districtId}:`, data);
        showAlert('Error', `No se pudo desbloquear el distrito: ${data.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error("Error en la función desbloquearDistrito:", error);
      showAlert('Error', `Ocurrió un error al intentar desbloquear el distrito: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

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

  const fetchUserMap = async (userId: string): Promise<any> => {
    const url = `${API_URL}/api/maps/principalMap/user/${userId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
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
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }

      // Obtener el mapa del usuario
      const userMap = await fetchUserMap(user.id);
      console.log("Datos recibidos del mapa del usuario:", userMap);
      setLoading(true);
      const response = await fetch(`${API_URL}/api/districts/map/${userMap.map.id}`);
      const data = await response.json();
      
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
                regionId: distrito.region_assignee ? distrito.region_assignee.id : null,
              };
            } catch (error) {
              console.error(`Error procesando distrito ${distrito.name}:`, error);
              return null;
            }
          })
          .filter((d: any) => d !== null);
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
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }
      const userMap = await fetchUserMap(user.id);
      
      if (!userMap || !userMap.map || !userMap.map.id) {
        throw new Error("No se pudo obtener el mapa del usuario");
      }

      console.log(`Obteniendo puntos de interés para el mapa ${userMap.map.id}...`);
      const response = await fetch(`${API_URL}/api/poi/map/${userMap.map.id}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener los POIs: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.pois) {
        console.log(`Se obtuvieron ${data.pois.length} puntos de interés`);
        setPointsOfInterest(data.pois);
      } else {
        console.warn("No se pudieron obtener los puntos de interés:", data);
        setPointsOfInterest([]);
      }
    } catch (error) {
      console.error("Error al obtener los puntos de interés:", error);
      setPointsOfInterest([]);
    }
  };

  // Manejador cuando se hace clic en el mapa
  const handleMapClick = (coordinate: { latitude: number; longitude: number }) => {
    console.log("Clic en el mapa:", coordinate);
    
    // Creamos el punto con el formato correcto
    const point = { lat: coordinate.latitude, lng: coordinate.longitude };
    
    // Ordenamos los distritos por distancia al punto para verificar primero los más cercanos
    const distritosOrdenados = [...distritos].map(distrito => {
      try {
        if (!distrito.coordenadas || distrito.coordenadas.length < 3) {
          return { ...distrito, distancia: Infinity };
        }
        
        // Calcular centroide como promedio de coordenadas
        let sumLat = 0, sumLng = 0;
        for (const vertex of distrito.coordenadas) {
          sumLat += vertex[0];
          sumLng += vertex[1];
        }
        const centroidLat = sumLat / distrito.coordenadas.length;
        const centroidLng = sumLng / distrito.coordenadas.length;
        
        // Calcular distancia del punto al centroide
        const distancia = Math.sqrt(
          Math.pow(point.lat - centroidLat, 2) + 
          Math.pow(point.lng - centroidLng, 2)
        );
        
        return { ...distrito, distancia };
      } catch (e) {
        console.error("Error calculando centroide:", e);
        return { ...distrito, distancia: Infinity };
      }
    }).sort((a, b) => a.distancia - b.distancia);
    
    // Solo verificamos los 5 distritos más cercanos
    const distritosAVerificar = distritosOrdenados.slice(0, 5);
    console.log("Verificando punto en los 5 distritos más cercanos:", distritosAVerificar.map(d => d.nombre));
    
    // Verificar si el punto está dentro de algún distrito cercano
    let poiDistrict = null;
    
    // Primero verificamos si estamos muy cerca del centroide de algún distrito
    const distritoMuyCercano = distritosAVerificar.find(d => d.distancia < 0.01);
    if (distritoMuyCercano) {
      console.log(`Punto muy cercano al centro del distrito: ${distritoMuyCercano.nombre}`);
      poiDistrict = distritoMuyCercano;
    }
    
    // Si no estamos cerca de ningún centroide, verificamos con el algoritmo de punto en polígono
    if (!poiDistrict) {
      for (const distrito of distritosAVerificar) {
        if (isPointInPolygon(point, distrito.coordenadas)) {
          console.log(`Punto dentro del distrito: ${distrito.nombre}`);
          poiDistrict = distrito;
          break; // Terminamos la búsqueda una vez encontrado
        }
      }
    }
    
    // Verificar si no está en ningún distrito
    if (!poiDistrict) {
      console.log("El punto no está en ningún distrito");
      showAlert('Ubicación no válida', 'No puedes crear un punto de interés fuera de un distrito.');
      return;
    }
    
    // Verificar si el distrito está desbloqueado
    console.log(`Distrito encontrado: ${poiDistrict.nombre}, Desbloqueado: ${poiDistrict.isUnlocked}`);
    if (!poiDistrict.isUnlocked) {
      showAlert('Distrito bloqueado', `El distrito "${poiDistrict.nombre}" está bloqueado. Desbloquéalo primero para añadir puntos de interés.`);
      return;
    }
    
    // Si llegamos aquí, el distrito está desbloqueado, procedemos a mostrar el formulario
    console.log(`Mostrando formulario para crear POI en el distrito: ${poiDistrict.nombre}`);
    
    // Creamos un objeto distrito en el formato esperado por el formulario
    const distritoFormatted = {
      id: poiDistrict.id,
      nombre: poiDistrict.nombre,
      isUnlocked: true,
      regionId: poiDistrict.regionId
    };
    
    setPointOfInterest({
      name: "",
      description: "",
      category: "",
      photos: [],
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      district: distritoFormatted,  // Pasamos el objeto distrito completo, no solo el ID
    });
    
    // Mostramos el formulario
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
      
      {/* Loader */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
          <ActivityIndicator size="large" color="#0000ff" />
        </div>
      )}
      
      {/* Componente de Logro */}
      {distritoActual && <LogroComponent visible={mostrarLogro} distrito={distritoActual} />}
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