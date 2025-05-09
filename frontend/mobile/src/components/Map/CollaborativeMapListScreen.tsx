import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Pressable,
  Keyboard,
  InteractionManager,
} from "react-native";
import { useNavigation, NavigationProp, useFocusEffect, useIsFocused } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../constants/config";
import { RootStackParamList } from "../../navigation/types";

// Interfaz para el mapa colaborativo
interface CollaborativeMap {
  id: string;
  name: string;
  description: string;
  is_colaborative: boolean;
  users_joined: {
    id: string;
    username: string;
  }[];
  created_at?: string;
}

// Definir los tipos para los parámetros de navegación
type NavigationProps = NavigationProp<RootStackParamList, 'CollaborativeMapListScreen'>;

const CollaborativeMapListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const isFocused = useIsFocused();
  const [maps, setMaps] = useState<CollaborativeMap[]>([]);
  const [map, setMap] = useState<CollaborativeMap | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");

  // Estado para el modal de creación de mapa
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [mapName, setMapName] = useState<string>("");
  const [mapDescription, setMapDescription] = useState<string>("");
  const [maxUsers, setMaxUsers] = useState<number>(5);
  const [errors, setErrors] = useState<{ mapName: string }>({ mapName: "" });

  // Estado para el modal de invitación
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [selectedMapId, setSelectedMapId] = useState<string>("");
  const [inviteInput, setInviteInput] = useState<string>("");
  const [inviteType, setInviteType] = useState<"email" | "username">("email");
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);

  // Estado para la confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [mapToDelete, setMapToDelete] = useState<string>("");
  const [subscription, setSubscription] = useState<any>(null);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

  // Colores para los jugadores
  const playerColors = [
  "#2196f399",
  "#4cb05099",
  "#fec10799",
  "#ff970099",
  "#ea1e6399",

  ];

  // Referencia para verificar si el componente está montado
  const isMountedRef = useRef(true);

  // Al montar/desmontar
  useEffect(() => {
    // Al montar
    isMountedRef.current = true;

    // Cargamos el userId una vez
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId && isMountedRef.current) {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Error obteniendo userId:", error);
      }
    };

    getUserId();

    // Al desmontar
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Solo un useEffect para fetchSubscription
  useEffect(() => {
    if (!userId) return;

    const fetchSubscription = async () => {
      try {
        if (!isMountedRef.current) return;

        const response = await fetch(`${API_URL}/api/subscriptions/active/${userId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Error en la solicitud de subscripción: ${response.statusText}`);
        }

        const data = await response.json();

        if (isMountedRef.current) {
          setSubscription(data);
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error("Error al obtener la subscripción", error);
        }
      }
    };

    fetchSubscription();
  }, [userId]);

  // Cargar mapas solo cuando userId cambia
  useEffect(() => {
    if (userId) {
      fetchCollaborativeMaps();
    }
  }, [userId]);

  // Limpieza centralizada al perder foco o desmontar
  useFocusEffect(
    useCallback(() => {
      // Al ganar foco
      isMountedRef.current = true;
      if (userId) {
        fetchCollaborativeMaps(); // Recargar datos si es necesario
      }

      // Al perder foco (navegar fuera) o desmontar
      return () => {
        console.log("CollaborativeMapListScreen perdiendo foco o desmontando - Limpieza COMPLETA...");
        isMountedRef.current = false;
        // Cerrar todos los modales
        setShowInviteModal(false);
        setShowCreateModal(false);
        setShowDeleteConfirm(false);
        // Limpiar estados relacionados con modales y selecciones
        setMap(null);
        setSelectedMapId("");
        setMapToDelete("");
        setInvitedFriends([]);
        setFriends([]);
        setMapName("");
        setMapDescription("");
        setErrors({ mapName: "" });
      };
    }, [userId]) // Dependencia principal para recarga
  );

  // Versión corregida de fetchCollaborativeMaps
  const fetchCollaborativeMaps = async () => {
    if (!isMountedRef.current || !isFocused) {
      console.log("fetchCollaborativeMaps: Componente no montado o no enfocado, abortando fetch.");
      if (loading) setLoading(false);
      if (refreshing) setRefreshing(false);
      return;
    }
    setLoading(true); // Mover setLoading aquí para indicar inicio
    if (refreshing) setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/api/maps/collaborative/user/${userId}`);
      const data = await response.json();

      if (isMountedRef.current && isFocused) { // Doble chequeo antes de setear estado
        if (data.success && data.maps && data.maps.length > 0) {
          setMaps(data.maps);
        } else {
          setMaps([]);
        }
      }
    } catch (error) {
      if (isMountedRef.current && isFocused) { // Doble chequeo antes de setear estado
        console.error("Error al obtener mapas:", error);
        setMaps([{
          id: "map-offline-1",
          name: "Mapa Sin Conexión",
          description: "Este mapa está disponible sin conexión",
          is_colaborative: true,
          users_joined: [{ id: userId, username: "Usuario Offline" }],
          created_at: new Date().toISOString()
        }]);
      }
    } finally {
      if (isMountedRef.current && isFocused) { // Doble chequeo antes de setear estado
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Función de refresh segura
  const onRefresh = () => {
    if (userId) {
      setRefreshing(true);
      fetchCollaborativeMaps();
    } else {
      setRefreshing(false);
    }
  };

  // Función para crear un nuevo mapa colaborativo
  const createCollaborativeMap = async () => {
    if (subscription && subscription.plan !== "PREMIUM") {
      throw new Error("Solo los usuarios premium pueden crear mapas colaborativos");
    }
    if (!mapName.trim()) {
      setErrors({ mapName: "El nombre es obligatorio" });
      return;
    }

    try {
      setLoading(true); // Mostrar cargando mientras se crea el mapa

      console.log("Creando mapa colaborativo:", {
        nombre: mapName,
        descripción: mapDescription,
        máxUsuarios: maxUsers,
        usuarioId: userId
      });

      // Crear el objeto con los datos del mapa
      const mapData = {
        name: mapName,
        description: mapDescription || "Mapa colaborativo",
        is_colaborative: true,
        max_users: maxUsers,
        createdAt: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/api/maps/createColaborative`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          MapData: mapData,
          userId,
        }),
      });

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("La respuesta del servidor no es válida (no es JSON)");
      }

      const data = await response.json();
      console.log("Respuesta del servidor:", data);

      if (data.success) {
        // Limpiar los campos del formulario
        setMapName("");
        setMapDescription("");
        setMaxUsers(5);
        setShowCreateModal(false);

        // Añadir el nuevo mapa a la lista si viene en la respuesta
        if (data.map) {
          setMaps(prevMaps => [data.map, ...prevMaps]);
        } else {
          // Si no hay mapa en la respuesta, recargar todos los mapas
          await fetchCollaborativeMaps();
        }

        Alert.alert("Éxito", "Mapa colaborativo creado correctamente");
      } else {
        throw new Error(data.message || "Error al crear el mapa colaborativo");
      }
    } catch (error) {
      console.error("Error al crear mapa colaborativo:", error);
      Alert.alert(
        "Error",
        `No se pudo crear el mapa colaborativo: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un mapa colaborativo
  const deleteCollaborativeMap = async () => {
    if (!mapToDelete || !userId) return;

    try {
      setLoading(true);
      console.log(`Intentando eliminar mapa con ID: ${mapToDelete} para el usuario: ${userId}`);

      const response = await fetch(`${API_URL}/api/maps/delete/${mapToDelete}/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("Respuesta del servidor:", data);
      }

      setMaps(maps.filter(map => map.id !== mapToDelete));
      setShowDeleteConfirm(false);
      setMapToDelete("");
      Alert.alert("Éxito", "Mapa colaborativo eliminado correctamente");

    } catch (error) {
      console.error("Error al eliminar mapa colaborativo:", error);
      setMaps(maps.filter(map => map.id !== mapToDelete));
      setShowDeleteConfirm(false);
      setMapToDelete("");
      Alert.alert(
        "Información",
        "El mapa ha sido eliminado de tu lista, pero puede haber un problema con el servidor."
      );

    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async (userId: string) => {
    try {
      console.log(`Solicitando amigos para el usuario: ${userId}`);
      const response = await fetch(`${API_URL}/api/friends/friends/${userId}`);
      const data = await response.json();

      console.log("Respuesta del backend:", data);

      if (Array.isArray(data)) {
        setFriends(data.map((user) => ({
          id: user.id,
          name: user.email,
        })));
      } else {
        console.warn("Formato inesperado en la respuesta de amigos:", data);
      }
    } catch (error) {
      console.error("Error al obtener amigos:", error);
    }
  };

  useEffect(() => {
    if (showInviteModal && userId) {
      console.log("Modal abierto, cargando amigos para el usuario:", userId);
      fetchFriends(userId);
    }
  }, [showInviteModal, userId]);

  const sendFriendRequest = async (friendId: string) => {
    try {
      console.log(`mapa colaborativo ${selectedMapId} para ${friendId} enviada por ${userId}`);
      const response = await fetch(`${API_URL}/api/friends/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: userId, receiverId: friendId, mapId: selectedMapId }),
      });
      console.log("Respuesta del backend:", response);
      const data = await response.json();

      if (data.success) {
        Alert.alert("Invitación enviada", `Has invitado a ` + data.friend.recipient.profile.username);
      } else {
        Alert.alert("No se pudo enviar la invitación", "El usuario ya tiene una invitación pendiente para este mapa.");
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
    }
  };

  const getAvailableFriends = () => {
    if (!friends || !Array.isArray(friends)) return [];
    if (!map || !map.users_joined) return friends;

    return friends.filter(
      (friend) =>
        !invitedFriends.includes(friend.id) &&
        !map.users_joined.some((user) => user.id === friend.id)
    );
  };

  const handleNavigateToMap = (item: CollaborativeMap) => {
    console.log(`[InteractionManager] Preparando navegación a mapId: ${item.id}`);

    setShowInviteModal(false);
    setShowCreateModal(false);
    setShowDeleteConfirm(false);
    setMap(null);
    setSelectedMapId("");
    setMapToDelete("");

    InteractionManager.runAfterInteractions(() => {
      if (isMountedRef.current) {
        console.log(`[InteractionManager] Ejecutando navegación a mapId: ${item.id}`);
        navigation.navigate('CollaborativeMapScreen', {
          mapId: item.id,
          userId: userId,
        });
      } else {
        console.log("[InteractionManager] Navegación cancelada, componente desmontado.");
      }
    });
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
                      Máximo 4 amigos (5 usuarios en total)
                    </Text>
          
                    {availableFriends.length === 0 ? (
                      <Text style={styles.noFriendsText}>
                        No te quedan amigos por invitar a este mapa.
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

  const renderMapItem = ({ item }: { item: CollaborativeMap }) => {
    const isCreator = item.users_joined && item.users_joined.length > 0 &&
      item.users_joined[0]?.id === userId;

    return (
      <TouchableOpacity
        style={styles.mapItem}
        onPress={() => handleNavigateToMap(item)}
      >
        <View style={styles.mapInfoContainer}>
          <Text style={styles.mapName}>{item.name}</Text>
          <Text style={styles.mapDescription}>
            {item.description || "Sin descripción"}
          </Text>
          <Text style={styles.mapUsers}>
            {item.users_joined?.length || 1} / 5 usuarios
          </Text>
        </View>

        <View style={styles.mapActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              setShowCreateModal(false);
              setShowDeleteConfirm(false);
              setSelectedMapId(item.id);
              setMap(item);
              setShowInviteModal(true);
            }}
          >
            <Icon name="person-add" size={20} color="#007df3" />
          </TouchableOpacity>

          
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                setMapToDelete(item.id);
                setShowDeleteConfirm(true);
              }}
            >
              <Icon name="delete" size={20} color="#00386d" />
            </TouchableOpacity>
          
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateModal = () => (
    subscription && subscription.plan === "PREMIUM" ? (
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={styles.modalTitle}>Crear Mapa Colaborativo</Text>

              <Text style={styles.inputLabel}>Nombre del mapa*</Text>
              <TextInput
                style={[styles.input, errors.mapName ? { borderColor: "#e53e3e" } : {}]}
                placeholder="Ej: Exploración de Sevilla"
                value={mapName}
                onChangeText={(text) => {
                  setMapName(text);
                  if (errors.mapName) setErrors({ mapName: "" });
                }}
                maxLength={30}
              />
              {errors.mapName ? (
                <Text style={{ color: "#e53e3e", marginBottom: 8, fontSize: 14 }}>
                  {errors.mapName}
                </Text>
              ) : null}

              <Text style={styles.inputLabel}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción del mapa colaborativo"
                value={mapDescription}
                onChangeText={setMapDescription}
                multiline={true}
                maxLength={100}
              />
  
              <Text style={styles.inputLabel}>Previsualización de los colores de los usuarios</Text>
              <View style={styles.pickerContainer}>
                {[2, 3, 4, 5].map((num) => {
                  const isSelected = maxUsers === num;
                  const buttonStyle = isSelected
                    ? styles.pickerItemSelected
                    : styles.pickerItem;
                  const backgroundColor = isSelected
                    ? playerColors[0]
                    : (num <= maxUsers ? playerColors[num - 1] : "#f0f0f0");

                  return (
                    <TouchableOpacity
                      key={num}
                      style={[styles.pickerItem, { backgroundColor: isSelected ? playerColors[0] : "#f0f0f0" }]}
                      onPress={() => setMaxUsers(num)}
                    >
                      <Text
                        style={[styles.pickerText, isSelected && styles.pickerTextSelected]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.playerPreview}>
                {[...Array(maxUsers)].map((_, index) => (
                  <View
                    key={index}
                    style={[styles.playerColorCircle, { backgroundColor: playerColors[index] }]}
                  />
                ))}
              </View>
              
  
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={[styles.buttonText, { color: "#fff" }]}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={createCollaborativeMap}
                >
                  <Text style={styles.buttonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>
    ) : (
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Oops</Text>
            <Text style={styles.inputLabel}>
              Tienes que ser usuario premium para desbloquear esta funcionalidad
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.buttonText, { color: "#fff" }]}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  navigation.navigate('Payment');
                }}
              >
                <Text style={styles.buttonText}>Mejorar a Premium</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  );

  const renderDeleteConfirmModal = () => (
    <Modal
      visible={showDeleteConfirm}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirm(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.confirmModal]}>
          <Icon name="warning" size={40} color="#00386d" style={styles.warningIcon} />

          <Text style={styles.confirmTitle}>Eliminar Mapa</Text>
          <Text style={styles.confirmText}>
            ¿Estás seguro de que deseas eliminar este mapa colaborativo? Esta acción no se puede deshacer.
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDeleteConfirm(false)}
            >
              <Text style={[styles.buttonText, { color: "#fff" }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.deleteConfirmButton]}
              onPress={deleteCollaborativeMap}
            >
              <Text style={styles.buttonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mapas Colaborativos</Text>
        <TouchableOpacity
          style={styles.createMapButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007df3" />
          <Text style={styles.loadingText}>Cargando mapas colaborativos...</Text>
        </View>
      ) : (
        <FlatList
          data={maps}
          renderItem={renderMapItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="map" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>
                No tienes mapas colaborativos
              </Text>
              <Text style={styles.emptySubtext}>
                Crea uno nuevo o espera a ser invitado
              </Text>
              <TouchableOpacity
                style={styles.createEmptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.createEmptyButtonText}>
                  Crear Mi Primer Mapa
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {renderCreateModal()}
      {renderInviteFriendsModal()}
      {renderDeleteConfirmModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#007df3",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  createMapButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  mapItem: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  mapInfoContainer: {
    flex: 1,
  },
  mapName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  mapDescription: {
    fontSize: 14,
    color: "#00386",
    marginBottom: 6,
  },
  mapUsers: {
    fontSize: 12,
    color: "#007df3",
  },
  mapActions: {
    flexDirection: "row",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#00386",
    marginBottom: 15,
    textAlign: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#00386",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00386",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  noFriendsText: {
    textAlign: "center",
    color: "#00386",
    marginVertical: 10,
    fontSize: 16,
  },
  createEmptyButton: {
    backgroundColor: "#007df3",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createEmptyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    elevation: 5,
  },
  confirmModal: {
    alignItems: "center",
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
  inviteButton: {
    backgroundColor: "#00b0dc", // Tono medio para el botón
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
    backgroundColor: "#00386d", // Tono oscuro para el botón de cerrar
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickerItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  pickerItemSelected: {
    backgroundColor: "#007df3",
  },
  pickerText: {
    fontSize: 16,
    color: "#00386",
  },
  pickerTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  playerPreview: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  playerColorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  playerPreviewText: {
    textAlign: "center",
    fontSize: 12,
    color: "#00386",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#00386d", // Rojo para botones de cancelar
  },
  createButton: {
    backgroundColor: "#007df3",
  },
  deleteConfirmButton: {
    backgroundColor: "#00386d",
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "white",
  },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  toggleButtonActive: {
    backgroundColor: "#007df3",
  },
  toggleText: {
    fontSize: 14,
    color: "#00386",
  },
  toggleTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  warningIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 16,
    color: "#00386",
    textAlign: "center",
    marginBottom: 24,
  },
});

export default CollaborativeMapListScreen;