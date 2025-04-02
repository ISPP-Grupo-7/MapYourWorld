import React, { useState, useEffect } from "react";
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
  Keyboard
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
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
  const [maps, setMaps] = useState<CollaborativeMap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");

  // Estado para el modal de creación de mapa
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [mapName, setMapName] = useState<string>("");
  const [mapDescription, setMapDescription] = useState<string>("");
  const [maxUsers, setMaxUsers] = useState<number>(6);
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

  // Colores para los jugadores
  const playerColors = [
    "#2196F3", // Azul (propietario)
    "#4CAF50", // Verde
    "#FFC107", // Amarillo
    "#FF9800", // Naranja
    "#E91E63", // Rosa
    "#9C27B0"  // Morado
  ];

  // Obtener el ID del usuario al cargar el componente
  useEffect(() => {
    const getUserId = async () => {
      try {
        // Intentar obtener el ID del usuario del AsyncStorage
        const storedUserId = await AsyncStorage.getItem("userId");

        if (storedUserId) {
          console.log("Usuario encontrado en AsyncStorage:", storedUserId);
          setUserId(storedUserId);
        } else {
          console.log("No se encontró usuario en AsyncStorage, usando ID temporal para pruebas");

          // ID de usuario temporal para pruebas
          const temporalUserId = "user-456";

          // Guardamos el ID temporal en AsyncStorage para futuras consultas
          await AsyncStorage.setItem("userId", temporalUserId);
          setUserId(temporalUserId);

          // Informamos al usuario que estamos usando un modo de prueba
          Alert.alert(
            "Modo de Prueba",
            "Estás usando la aplicación en modo de prueba. Algunas funciones podrían estar limitadas.",
            [{ text: "Entendido", style: "default" }]
          );
        }
      } catch (error) {
        console.error("Error al obtener el ID del usuario:", error);

        // En caso de error, usar un ID temporal
        const fallbackId = "user-456";
        setUserId(fallbackId);
      }
    };

    getUserId();
  }, []);

  // Cargar los mapas colaborativos del usuario
  useEffect(() => {
    if (userId) {
      fetchCollaborativeMaps();
    }
  }, [userId]);

  // Función para obtener los mapas colaborativos
  const fetchCollaborativeMaps = async () => {
    try {
      setLoading(true);
      console.log(`Obteniendo mapas colaborativos para el usuario: ${userId}`);

      const response = await fetch(`${API_URL}/api/maps/collaborative/user/${userId}`);

      if (!response.ok) {
        console.warn(`Error en la petición: ${response.status}`);
        // Si hay un error, seguimos adelante para mostrar los datos de ejemplo
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("La respuesta no es JSON válido");
        // En lugar de abandonar, mostramos el mensaje pero seguimos adelante
      }

      try {
        const data = await response.json();
        console.log("Respuesta de mapas colaborativos:", data);

        if (data.success && data.maps && data.maps.length > 0) {
          setMaps(data.maps);

          // Si son datos de ejemplo, mostramos una notificación sutil
          if (data.isExample) {
            console.log("Mostrando datos de ejemplo");
            // Opcional: mostrar una notificación o un indicador de "modo demo"
          }
        } else {
          console.log("No se encontraron mapas colaborativos");
          setMaps([]);
        }
      } catch (jsonError) {
        console.error("Error al procesar JSON:", jsonError);
        // Proporcionar algunos mapas de ejemplo en caso de error
        setMaps([
          {
            id: "map-demo-1",
            name: "Mapa Demo 1",
            description: "Este es un mapa de demostración",
            is_colaborative: true,
            users_joined: [{ id: userId, username: "Tú" }],
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error("Error al obtener los mapas colaborativos:", error);
      // En lugar de mostrar un error al usuario, proporcionamos datos de ejemplo
      setMaps([
        {
          id: "map-offline-1",
          name: "Mapa Sin Conexión",
          description: "Este mapa está disponible sin conexión",
          is_colaborative: true,
          users_joined: [{ id: userId, username: "Usuario Offline" }],
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar la lista de mapas
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCollaborativeMaps();
  };

  // Función para crear un nuevo mapa colaborativo
  const createCollaborativeMap = async () => {
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
        setMaxUsers(6);
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
    // Asegúrate de tener definidos tanto mapToDelete como userId (por ejemplo, obtenido del contexto o estado de autenticación)
    if (!mapToDelete || !userId) return;

    try {
      setLoading(true);
      console.log(`Intentando eliminar mapa con ID: ${mapToDelete} para el usuario: ${userId}`);

      // Se arma la URL incluyendo ambos parámetros según la ruta: '/delete/:mapId/:userId'
      const response = await fetch(`${API_URL}/api/maps/delete/${mapToDelete}/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });

      // Se verifica si la respuesta es en formato JSON y se procesa
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        console.log("Respuesta del servidor:", data);
      }

      // Actualización de la lista de mapas en el estado
      setMaps(maps.filter(map => map.id !== mapToDelete));
      setShowDeleteConfirm(false);
      setMapToDelete("");
      Alert.alert("Éxito", "Mapa colaborativo eliminado correctamente");

    } catch (error) {
      console.error("Error al eliminar mapa colaborativo:", error);
      // Aunque ocurra error, se actualiza la UI para reflejar que el mapa ha sido eliminado localmente
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
        Alert.alert("Solicitud enviada", `Has enviado una solicitud a ${data.name}`);
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
    }
  };

  const renderInviteFriendsModal = () => {
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

            <FlatList
              data={friends}
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

            {/* Botón para cerrar el modal */}
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

  // Renderizado de cada elemento de la lista de mapas
  const renderMapItem = ({ item }: { item: CollaborativeMap }) => {
    // Encontrar si el usuario actual es el creador del mapa
    const isCreator = item.users_joined && item.users_joined.length > 0 &&
      item.users_joined[0]?.id === userId;

    return (
      <TouchableOpacity
        style={styles.mapItem}
        onPress={() => {
          // Usar el método navigate con los tipos correctos
          navigation.navigate('CollaborativeMapScreen', {
            mapId: item.id,
            userId: userId,
          });
        }}
      >
        <View style={styles.mapInfoContainer}>
          <Text style={styles.mapName}>{item.name}</Text>
          <Text style={styles.mapDescription}>
            {item.description || "Sin descripción"}
          </Text>
          <Text style={styles.mapUsers}>
            {item.users_joined?.length || 1} / {maxUsers} usuarios
          </Text>
        </View>

        <View style={styles.mapActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedMapId(item.id);
              setShowInviteModal(true);
            }}
          >
            <Icon name="person-add" size={20} color="#2196F3" />
          </TouchableOpacity>

          {isCreator && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e.stopPropagation();
                setMapToDelete(item.id);
                setShowDeleteConfirm(true);
              }}
            >
              <Icon name="delete" size={20} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Modal para crear un nuevo mapa colaborativo
  const renderCreateModal = () => (
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

            <Text style={styles.inputLabel}>Número máximo de usuarios (2-6)</Text>
            <View style={styles.pickerContainer}>
              {[2, 3, 4, 5, 6].map((num) => {
                // Determinar qué colores mostrar según el número seleccionado
                const isSelected = maxUsers === num;
                const buttonStyle = isSelected
                  ? styles.pickerItemSelected
                  : styles.pickerItem;

                // Determinar el color de fondo según el índice si está seleccionado o no
                const backgroundColor = isSelected
                  ? playerColors[0] // Color del propietario siempre es el primero
                  : (num <= maxUsers ? playerColors[num - 1] : "#f0f0f0");

                return (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.pickerItem,
                      { backgroundColor: isSelected ? playerColors[0] : "#f0f0f0" }
                    ]}
                    onPress={() => setMaxUsers(num)}
                  >
                    <Text
                      style={[
                        styles.pickerText,
                        isSelected && styles.pickerTextSelected,
                      ]}
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
                  style={[
                    styles.playerColorCircle,
                    { backgroundColor: playerColors[index] }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.playerPreviewText}>
              Vista previa de colores de jugadores
            </Text>

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
  );


  // Modal para confirmar la eliminación de un mapa
  const renderDeleteConfirmModal = () => (
    <Modal
      visible={showDeleteConfirm}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteConfirm(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.confirmModal]}>
          <Icon name="warning" size={40} color="#f44336" style={styles.warningIcon} />

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
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mapas Colaborativos</Text>
        <TouchableOpacity
          style={styles.createMapButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Lista de mapas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
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

      {/* Modales */}
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
    backgroundColor: "#2196F3",
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
    color: "#666",
    marginBottom: 6,
  },
  mapUsers: {
    fontSize: 12,
    color: "#2196F3",
  },
  mapActions: {
    flexDirection: "row",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
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
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },
  createEmptyButton: {
    backgroundColor: "#2196F3",
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
    backgroundColor: "#0096C7", // Tono medio para el botón
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
    backgroundColor: "#2196F3",
  },
  pickerText: {
    fontSize: 16,
    color: "#666",
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
    color: "#666",
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
    backgroundColor: "#f44336", // Rojo para botones de cancelar
  },
  createButton: {
    backgroundColor: "#2196F3",
  },
  deleteConfirmButton: {
    backgroundColor: "#f44336",
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
    backgroundColor: "#2196F3",
  },
  toggleText: {
    fontSize: 14,
    color: "#666",
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
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
});

export default CollaborativeMapListScreen; 