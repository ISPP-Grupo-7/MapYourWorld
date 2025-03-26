// CollaborativeMapScreen.web.tsx
import React, { useEffect, useState, useRef } from "react";
import { API_URL } from "@/constants/config";
import PuntoDeInteresForm from "../POI/PoiForm";
import { useAuth } from "@/contexts/AuthContext";

// Definición de colores disponibles para los usuarios
const USER_COLORS = [
  "#2196f3", 
  "#4cb050", 
  "#fec107", 
  "#ff9700", 
  "#ea1e63", 
  "#9c27b3",
];

// Tipos para distritos, usuarios y POIs
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
  color: string;
  colorIndex?: number;
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

// Componente de logro (achievements) para mostrar notificación al desbloquear un distrito
const LogroComponent = ({ visible, distrito }: { visible: boolean; distrito: string }) => {
  if (!visible) return null;
  return (
    <div style={styles.logroContainer}>
      <span style={styles.logroEmoji}>🏆</span>
      <h2 style={styles.logroTitle}>¡Logro Conseguido!</h2>
      <p style={styles.logroSubtitle}>Distrito desbloqueado en mapa colaborativo</p>
      <p style={styles.logroDistrito}>{distrito}</p>
    </div>
  );
};

// Componente que renderiza el mapa usando Leaflet
const LeafletMap = ({
  location,
  distritos,
  pointsOfInterest,
  onMapClick,
}: {
  location: { latitude: number; longitude: number };
  distritos: Distrito[];
  pointsOfInterest: POI[];
  onMapClick: (coordinate: { latitude: number; longitude: number }) => void;
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;
    const L = window.L;
    // Inicializar el mapa y centrarlo en la ubicación actual
    const map = L.map(mapContainerRef.current).setView(
      [location.latitude, location.longitude],
      13
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Dibujar polígonos para cada distrito
    distritos.forEach((distrito) => {
      const polygon = L.polygon(
        distrito.coordenadas.map((coord) => [coord.latitude, coord.longitude]),
        {
          color: "#808080",
          fillColor:
            distrito.isUnlocked && distrito.color
              ? distrito.color
              : "rgba(128, 128, 128, 0.7)",
          fillOpacity: 0.4,
          weight: 2,
        }
      );
      polygon.addTo(map);
    });

    // Agregar marcadores para cada punto de interés
    pointsOfInterest.forEach((poi) => {
      const coords: [number, number] = [
        poi.location.coordinates[1], // latitude
        poi.location.coordinates[0], // longitude
      ];
      const marker = L.marker(coords).bindPopup(
        `<h3>${poi.name}</h3><p>${poi.description}</p>`
      );
      marker.addTo(map);
    });

    // Evento de clic en el mapa
    map.on("click", (e: any) => {
      if (onMapClick) {
        onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    });

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
    <div ref={mapContainerRef} style={{ position: "absolute", top: 0, left: 0, height: "100vh", width: "100vw", zIndex: 1 }} />
  );
};

const CollaborativeMapScreen: React.FC<CollaborativeMapScreenProps> = ({
  mapId,
  userId,
}) => {
  // Estados de la pantalla
  const [location, setLocation] = useState<[number, number]>([37.3754, -5.9903]); // Ubicación por defecto
  const [distritosBackend, setDistritosBackend] = useState<Distrito[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [distritoActual, setDistritoActual] = useState<string | null>(null);
  const [mostrarLogro, setMostrarLogro] = useState<boolean>(false);
  const [distritosVisitados, setDistritosVisitados] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState<boolean>(false);
  const [pointOfInterest, setPointOfInterest] = useState<any>({
    name: "",
    description: "",
    category: "",
    photos: [],
    latitude: 0,
    longitude: 0,
    district: "",
  });
  const [pointsOfInterest, setPointsOfInterest] = useState<POI[]>([]);
  const [mapUsers, setMapUsers] = useState<MapUser[]>([]);
  const [userColorIndex, setUserColorIndex] = useState<number>(-1);
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [isCreatingMap, setIsCreatingMap] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Cargar Leaflet dinámicamente y su CSS
  const [leafletReady, setLeafletReady] = useState(false);
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !window.L) {
        try {
          const leafletModule = await import("leaflet");
          const L = leafletModule.default || leafletModule;
          // Asignar L al objeto global para que el componente LeafletMap lo encuentre
          (window as any).L = L;
          // Cargar CSS de Leaflet
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
          setLeafletReady(true);
        } catch (err) {
          console.error("Error loading Leaflet:", err);
          setError("Error loading map dependencies");
        }
      } else {
        setLeafletReady(true);
      }
    };
    loadLeaflet();
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
          ((vertex2.latitude - vertex1.latitude) *
            (longitude - vertex1.longitude)) /
            (vertex2.longitude - vertex1.longitude) +
            vertex1.latitude
      ) {
        inside = !inside;
      }
      j = i;
    }
    return inside;
  };

  // Función para transformar coordenadas (GeoJSON a formato {latitude, longitude})
  const transformarCoordenadasGeoJSON = (
    geoJson: any
  ): { latitude: number; longitude: number }[] => {
    try {
      if (!geoJson || !geoJson.coordinates || !Array.isArray(geoJson.coordinates)) {
        return [];
      }
      const coordenadas: { latitude: number; longitude: number }[] = [];
      const procesarCoordenadas = (coords: any[]) => {
        if (
          coords.length === 2 &&
          typeof coords[0] === "number" &&
          typeof coords[1] === "number"
        ) {
          coordenadas.push({ latitude: coords[1], longitude: coords[0] });
        } else if (Array.isArray(coords)) {
          coords.forEach((item) => {
            if (Array.isArray(item)) procesarCoordenadas(item);
          });
        }
      };
      procesarCoordenadas(geoJson.coordinates);
      return coordenadas;
    } catch (error) {
      console.error("Error transforming coordinates:", error);
      return [];
    }
  };

  // --- Funciones para obtener datos desde el backend ---
  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/districts/map/${mapId}`);
      const data = await response.json();
      if (!data.success || !data.districts) {
        setDistritosBackend([]);
        return;
      }
      
      // Crear un mapa para almacenar el color de cada distrito según cada usuario
      let userColors = new Map<string, string>();
      
      // Iterar sobre todos los usuarios del mapa para obtener sus colores
      for (const user of mapUsers) {
        try {
          const colorResponse = await fetch(`${API_URL}/api/districts/user-districts/${user.id}`);
          const colorData = await colorResponse.json();
          if (colorData.success && colorData.userDistricts) {
            colorData.userDistricts.forEach((ud: any) => {
              userColors.set(ud.districtId, ud.color);
            });
          }
        } catch (err) {
          console.error(`Error al obtener colores del usuario ${user.id}:`, err);
        }
      }
      
      // Mapear los distritos y asignar el color obtenido, si existe
      const distritosMapeados = data.districts
        .map((distrito: DistritoBackend) => {
          const coords = transformarCoordenadasGeoJSON(distrito.boundaries);
          if (coords.length < 3) return null;
          return {
            id: distrito.id,
            nombre: distrito.name,
            coordenadas: coords,
            isUnlocked: distrito.isUnlocked,
            unlockedByUserId: distrito.user?.id,
            color: userColors.get(distrito.id) || "rgba(128, 128, 128, 0.7)",
            regionId: distrito.region_assignee ? distrito.region_assignee.id : null,
          } as Distrito;
        })
        .filter((d: Distrito | null): d is Distrito => d !== null);
        
      setDistritosBackend(distritosMapeados);
    } catch (error) {
      console.error("Error fetching districts:", error);
      setError("Error fetching districts");
    } finally {
      setLoading(false);
    }
  };
  

  const fetchPOIs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/poi/map/${mapId}`);
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setPointsOfInterest([]);
        return;
      }
      const data = await response.json();
      if (data.success && data.pois) {
        setPointsOfInterest(data.pois);
      } else {
        setPointsOfInterest([]);
      }
    } catch (error) {
      console.error("Error fetching POIs:", error);
      setPointsOfInterest([]);
    }
  };

  const fetchMapUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/maps/users/${mapId}`);
      const data = await response.json();
      if (data.success && data.users) {
        const assignedColors: { [key: string]: string } = {};
        const usersWithColors: MapUser[] = data.users.map((u: any, index: number) => {
          let color = u.color;
          if (!color) {
            const availableColor =
              USER_COLORS.find((col) => !Object.values(assignedColors).includes(col)) ||
              "#808080";
            color = availableColor;
            assignedColors[u.id] = color;
          }
          return { id: u.id, username: u.username || `Usuario ${index + 1}`, color, colorIndex: USER_COLORS.indexOf(color) } as MapUser;
        });
        setMapUsers(usersWithColors);
        const currentUser = usersWithColors.find((u) => u.id === userId);
        if (currentUser) {
          setUserColorIndex(USER_COLORS.indexOf(currentUser.color));
        } else {
          setUserColorIndex(0);
        }
      }
    } catch (error) {
      console.error("Error fetching map users:", error);
    }
  };

  const fetchFriends = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/friends/${userId}`);
      const data = await response.json();
      console.log("Respuesta de amigos:", data);
      if (data.success && Array.isArray(data.friends)) {
        setFriends(data.friends.map((u: any) => ({ id: u.id, name: u.email || u.username })));
      } else if (Array.isArray(data)) {
        // Caso en que la respuesta sea directamente un array
        setFriends(data.map((u: any) => ({ id: u.id, name: u.email || u.username })));
      } else {
        console.warn("Formato inesperado en la respuesta de amigos:", data);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
  };
  useEffect(() => {
    if (showInviteModal && user && user.id) {
      console.log("Modal abierto, cargando amigos para el usuario:", user.id);
      fetchFriends(user.id);
    }
  }, [showInviteModal, user]);
  

const desbloquearDistrito = async (districtId: string, regionId: string) => {
  try {
    // Buscar el distrito en el estado actual
    const distritoActual = distritosBackend.find((d) => d.id === districtId);
    // Suponiendo que "rgba(128, 128, 128, 0.7)" es el color por defecto de un distrito bloqueado
    if (distritoActual && distritoActual.isUnlocked && distritoActual.color !== "rgba(128, 128, 128, 0.7)") {
      // El distrito ya tiene asignado un color; no se procede a cambiarlo.
      return;
    }
    
    const userColor = USER_COLORS[userColorIndex];
    const response = await fetch(
      `${API_URL}/api/districts/unlock/${districtId}/${userId}/${regionId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: userColor }),
      }
    );
    const data = await response.json();
    if (data.success) {
      setDistritosBackend((prev) =>
        prev.map((d) =>
          d.id === districtId
            ? { ...d, isUnlocked: true, unlockedByUserId: userId, color: userColor }
            : d
        )
      );
    }
  } catch (error) {
    console.error("Error unlocking district:", error);
  }
};

  // Asegurar que el mapa colaborativo existe (crear o recuperar)
  const ensureCollaborativeMapExists = async () => {
    try {
      setIsCreatingMap(true);
      const storedUserId = localStorage.getItem("userId");
      const effectiveUserId = storedUserId || userId || "user-456";
      const response = await fetch(`${API_URL}/api/maps/createOrGetCollaborative`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapId, userId: effectiveUserId }),
      });
      if (!response.ok) return null;
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) return null;
      const data = await response.json();
      if (!data.success) return null;
      return data.map;
    } catch (error) {
      console.error("Error ensuring collaborative map exists:", error);
      return null;
    } finally {
      setIsCreatingMap(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    console.log("Enviando solicitud de amistad a:", friendId);
    console.log("Mapa actual:", mapId);
    try {
      const response = await fetch(`${API_URL}/api/friends/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user?.id, receiverId: friendId, mapId: mapId }),
      });
      const data = await response.json();
      if (data.success) {
        alert(`Solicitud enviada a ${data.name}`);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  // Inicializar el mapa colaborativo (usuarios, distritos y POIs)
  const initializeMap = async () => {
    try {
      if (!mapId) {
        alert("No se ha proporcionado un ID de mapa válido");
        return;
      }
      await ensureCollaborativeMapExists();
      await fetchMapUsers();
      await fetchDistricts();
      await fetchPOIs();
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Error initializing map");
    }
  };

  // Seguimiento de ubicación usando la API de geolocalización del navegador
  useEffect(() => {
    if (!mapId) {
      alert("No se ha proporcionado un ID de mapa válido");
      return;
    }
    setLoading(true);
    initializeMap().finally(() => setLoading(false));
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLocation([position.coords.latitude, position.coords.longitude]);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Error obteniendo geolocalización");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setError("Geolocalización no soportada");
    }
  }, [mapId]);

  useEffect(() => {
    if (mapUsers.length > 0) {
      fetchDistricts();
    }
  }, [mapUsers]);

  // Verificar si el usuario está dentro de un distrito y desbloquearlo si corresponde
  useEffect(() => {
    if (location && distritosBackend.length > 0 && userColorIndex >= 0) {
      let foundDistrict: Distrito | null = null;
      for (const d of distritosBackend) {
        if (
          isPointInPolygon(
            { latitude: location[0], longitude: location[1] },
            d.coordenadas
          )
        ) {
          foundDistrict = d;
          break;
        }
      }
      if (foundDistrict) {
        if (!foundDistrict.isUnlocked) {
          desbloquearDistrito(foundDistrict.id, foundDistrict.regionId);
          if (!distritosVisitados.has(foundDistrict.nombre)) {
            setDistritosVisitados(new Set(distritosVisitados).add(foundDistrict.nombre));
            setDistritoActual(foundDistrict.nombre);
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

  // Handler del clic en el mapa para agregar un nuevo POI
  const handleMapClick = (coordinate: { latitude: number; longitude: number }) => {
    let poiDistrict: Distrito | null = null;
    for (const d of distritosBackend) {
      if (
        isPointInPolygon(
          { latitude: coordinate.latitude, longitude: coordinate.longitude },
          d.coordenadas
        )
      ) {
        poiDistrict = d;
        break;
      }
    }
    if (!poiDistrict) {
      alert("Ubicación no válida: No puedes crear un punto de interés fuera de un distrito.");
      return;
    }
    if (!poiDistrict.isUnlocked) {
      alert(`Distrito bloqueado: El distrito "${poiDistrict.nombre}" está bloqueado.`);
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

  // Renderizado del modal para invitar amigos
  const renderInviteFriendsModal = () => {
    if (!showInviteModal) return null;
    return (
      <div
        style={styles.modalOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowInviteModal(false);
        }}
      >
        <div style={styles.modalContent}>
          <h2 style={styles.modalTitle}>Invitar Amigos</h2>
          <p style={styles.modalSubtitle}>Máximo 5 amigos (6 usuarios en total)</p>
          <div style={{ maxHeight: 150, overflowY: "auto" }}>
            {friends.map((friend) => (
              <div key={friend.id} style={styles.invitedItem}>
                <span style={styles.friendName}>{friend.name}</span>
                <button style={styles.inviteButton} onClick={() => sendFriendRequest(friend.id)}>
                  Invitar
                </button>
              </div>
            ))}
          </div>
          <button style={styles.closeButton} onClick={() => setShowInviteModal(false)}>
            Cerrar
          </button>
        </div>
      </div>
    );
  };

  // Botón para recargar datos
  const renderReloadButton = () => {
    return (
      <button
        style={styles.reloadButton}
        onClick={async () => {
          setLoading(true);
          await initializeMap();
          setLoading(false);
        }}
      >
        &#x21bb; Recargar datos
      </button>
    );
  };

  // Leyenda que muestra los usuarios y su color asignado
  const renderUserColorLegend = () => {
    return (
      <div style={styles.legendContainer}>
        <h3 style={styles.legendTitle}>Usuarios</h3>
        <div style={{ maxHeight: 150, overflowY: "auto" }}>
          {mapUsers.map((userItem) => (
            <div key={userItem.id} style={styles.legendItem}>
              <div style={{ ...styles.colorSquare, backgroundColor: userItem.color }} />
              <span style={styles.legendText}>
                {userItem.username} {userItem.id === userId ? "(Tú)" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading || isCreatingMap || !leafletReady) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner"></div>
        <p style={styles.loadingText}>
          {isCreatingMap ? "Creando mapa colaborativo..." : "Cargando mapa..."}
        </p>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {renderInviteFriendsModal()}
      {showForm && (
        <div
          style={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowForm(false);
          }}
        >
          <div style={styles.formModalContent}>
            <h1 style={styles.formTitle}>Registrar Punto de Interés</h1>
            <PuntoDeInteresForm
              pointOfInterest={pointOfInterest}
              setPointOfInterest={setPointOfInterest}
              setShowForm={setShowForm}
              onSave={(newPOI: any) => {
                const poiConverted = {
                  ...newPOI,
                  location: { type: "Point", coordinates: [newPOI.longitude, newPOI.latitude] },
                };
                setPointsOfInterest((prev) => [...prev, poiConverted]);
              }}
            />
          </div>
        </div>
      )}
      <LeafletMap
        location={{ latitude: location[0], longitude: location[1] }}
        distritos={distritosBackend}
        pointsOfInterest={pointsOfInterest}
        onMapClick={handleMapClick}
      />
      {renderUserColorLegend()}
      <button style={styles.inviteFriendsButton} onClick={() => setShowInviteModal(true)}>
        &#128101; Invitar Amigos
      </button>
      {renderReloadButton()}
      <LogroComponent visible={mostrarLogro} distrito={distritoActual || ""} />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
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
  formModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  legendContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 8,
    maxWidth: "40%",
    maxHeight: 200,
    overflowY: "auto",
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
    zIndex: 1001,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  legendItem: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  colorSquare: {
    width: 20,
    height: 20,
    marginRight: 5,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000",
  },
  legendText: {
    fontSize: 12,
  },
  inviteFriendsButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "#2196F3",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: "10px 15px",
    borderRadius: 25,
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
    border: "none",
    color: "white",
    cursor: "pointer",
    zIndex: 1001,
  },
  reloadButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FF9800",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: "10px 15px",
    borderRadius: 25,
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
    border: "none",
    color: "white",
    cursor: "pointer",
    zIndex: 1001,
  },
  inviteButton: {
    backgroundColor: "#0096C7",
    borderRadius: 8,
    padding: "10px 20px",
    border: "none",
    color: "white",
    cursor: "pointer",
  },
  closeButton: {
    backgroundColor: "#03045E",
    borderRadius: 8,
    padding: "12px 20px",
    border: "none",
    color: "white",
    cursor: "pointer",
    marginTop: 20,
  },
  invitedItem: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    padding: "8px 0",
  },
  friendName: {
    fontSize: 16,
    color: "#023E8A",
    flex: 1,
  },
  // Estilos para LogroComponent
  logroContainer: {
    position: "absolute",
    top: "40%",
    left: "10%",
    right: "10%",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
    borderRadius: 15,
    textAlign: "center",
    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
    zIndex: 1001,
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
};

export default CollaborativeMapScreen;
