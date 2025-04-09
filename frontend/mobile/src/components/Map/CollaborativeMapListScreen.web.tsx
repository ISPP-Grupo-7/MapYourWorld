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

const CollaborativeMapListScreenWeb: React.FC = () => {
    const navigation = useNavigation<NavigationProps>();
    const [maps, setMaps] = useState<CollaborativeMap[]>([]);
    const [map, setMap] = useState<CollaborativeMap | null>(null);
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

    const [subscription, setSubscription] = useState<any>(null);
    const [invitedFriends, setInvitedFriends] = useState<string[]>([]);

    // Colores para los jugadores (se mantiene el mismo orden que en la versión móvil)
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
                const storedUserId = await AsyncStorage.getItem("userId");
                if (storedUserId) {
                    console.log("Usuario encontrado en AsyncStorage:", storedUserId);
                    setUserId(storedUserId);
                } else {
                    console.log("No se encontró usuario en AsyncStorage, usando ID temporal para pruebas");
                    const temporalUserId = "user-456";
                    await AsyncStorage.setItem("userId", temporalUserId);
                    setUserId(temporalUserId);
                    Alert.alert(
                        "Modo de Prueba",
                        "Estás usando la aplicación en modo de prueba. Algunas funciones podrían estar limitadas.",
                        [{ text: "Entendido", style: "default" }]
                    );
                }
            } catch (error) {
                console.error("Error al obtener el ID del usuario:", error);
                setUserId("user-456");
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

    useEffect(() => {
        const fetchSubscription = async () => {
              if (!userId) return;
              try {
                const response = await fetch(`${API_URL}/api/subscriptions/active/${userId}`, {
                  method: "GET",
                  headers: { "Content-Type": "application/json" },
                });
                if (!response.ok) throw new Error(response.statusText);
                const data = await response.json();
                setSubscription(data);
              } catch (error) {
                console.error("Error al obtener la subscripción", error);
              }
            };
            fetchSubscription();
    }, [userId]);

    // Función para obtener los mapas colaborativos
    const fetchCollaborativeMaps = async () => {
        try {
            setLoading(true);
            console.log(`Obteniendo mapas colaborativos para el usuario: ${userId}`);
            const response = await fetch(`${API_URL}/api/maps/collaborative/user/${userId}`);
            if (!response.ok) {
                console.warn(`Error en la petición: ${response.status}`);
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.warn("La respuesta no es JSON válido");
            }
            try {
                const data = await response.json();
                console.log("Respuesta de mapas colaborativos:", data);
                if (data.success && data.maps && data.maps.length > 0) {
                    setMaps(data.maps);
                } else {
                    console.log("No se encontraron mapas colaborativos");
                    setMaps([]);
                }
            } catch (jsonError) {
                console.error("Error al procesar JSON:", jsonError);
                setMaps([{
                    id: "map-demo-1",
                    name: "Mapa Demo 1",
                    description: "Este es un mapa de demostración",
                    is_colaborative: true,
                    users_joined: [{ id: userId, username: "Tú" }],
                    created_at: new Date().toISOString()
                }]);
            }
        } catch (error) {
            console.error("Error al obtener los mapas colaborativos:", error);
            setMaps([{
                id: "map-offline-1",
                name: "Mapa Sin Conexión",
                description: "Este mapa está disponible sin conexión",
                is_colaborative: true,
                users_joined: [{ id: userId, username: "Usuario Offline" }],
                created_at: new Date().toISOString()
            }]);
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

        if (subscription && subscription.plan !== "PREMIUM") {
            throw new Error("Solo los usuarios premium pueden crear mapas colaborativos");
          }

        if (!mapName.trim()) {
            setErrors({ mapName: "El nombre es obligatorio" });
            return;
        }
        try {
            setLoading(true);
            console.log("Creando mapa colaborativo:", {
                nombre: mapName,
                descripción: mapDescription,
                máxUsuarios: maxUsers,
                usuarioId: userId
            });
            const mapData = {
                name: mapName,
                description: mapDescription || "Mapa colaborativo",
                is_colaborative: true,
                max_users: maxUsers,
                createdAt: new Date().toISOString()
            };
            const response = await fetch(`${API_URL}/api/maps/createColaborative`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ MapData: mapData, userId })
            });
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("La respuesta del servidor no es válida (no es JSON)");
            }
            const data = await response.json();
            console.log("Respuesta del servidor:", data);
            if (data.success) {
                setMapName("");
                setMapDescription("");
                setMaxUsers(6);
                setShowCreateModal(false);
                if (data.map) {
                    setMaps(prevMaps => [...prevMaps, data.map]);
                } else {
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
    // Función para invitar a un usuario al mapa colaborativo
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
        window.alert("Invitación enviada");
      }else {
        window.alert("El usuario ya tiene otra invitación pendiente para unirse a mapa.");  
      }
        } catch (error) {
            console.error("Error al enviar solicitud:", error);
        }
    };

    // Renderizado de cada elemento de la lista de mapas
    const renderMapItem = ({ item }: { item: CollaborativeMap }) => {
        // El usuario creador se considera el primer en la lista
        const isCreator = item.users_joined && item.users_joined.length > 0 && item.users_joined[0]?.id === userId;
        return (
            <TouchableOpacity
                style={webStyles.mapItem}
                onPress={() => {
                    navigation.navigate('CollaborativeMapScreen', {
                        mapId: item.id,
                        userId: userId
                    });
                }}
            >
                <View style={webStyles.mapInfoContainer}>
                    <Text style={webStyles.mapName}>{item.name}</Text>
                    <Text style={webStyles.mapDescription}>
                        {item.description || "Sin descripción"}
                    </Text>
                    <Text style={webStyles.mapUsers}>
                        {item.users_joined?.length || 1} / {maxUsers} usuarios
                    </Text>
                </View>
                <View style={webStyles.mapActions}>
                    <TouchableOpacity
                        style={webStyles.actionButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            setSelectedMapId(item.id);
                            setMap(item);
                            setShowInviteModal(true);
                        }}
                    >
                        <Icon name="person-add" size={20} color="#2196F3" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[webStyles.actionButton, webStyles.deleteButton]}
                        onPress={(e) => {
                            e.stopPropagation();
                            setMapToDelete(item.id);
                            setShowDeleteConfirm(true);
                        }}
                    >
                        <Icon name="delete" size={20} color="#f44336" />
                    </TouchableOpacity>

                </View>
            </TouchableOpacity>
        );
    };

    // Modal para crear un nuevo mapa colaborativo
    const renderCreateModal = () => (
        subscription && subscription.plan === "PREMIUM" ? (
        <Modal
            visible={showCreateModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCreateModal(false)}
        >
            <View style={webStyles.modalContainer}>
                <View style={webStyles.modalContent}>

                    <View>
                        <Text style={webStyles.modalTitle}>Crear Mapa Colaborativo</Text>

                        <Text style={webStyles.inputLabel}>Nombre del mapa*</Text>
                        <TextInput
                            style={webStyles.input}
                            placeholder="Ej: Exploración de Sevilla"
                            value={mapName}
                            onChangeText={(text) => {
                                setMapName(text);
                                if (errors.mapName) setErrors({ mapName: "" });
                            }}
                            maxLength={255}
                        />{errors.mapName ? (
                            <Text style={{ color: "#e53e3e", marginBottom: 8, fontSize: 14 }}>
                                {errors.mapName}
                            </Text>
                        ) : null}

                        <Text style={webStyles.inputLabel}>Descripción</Text>
                        <TextInput
                            style={[webStyles.input, webStyles.textArea]}
                            placeholder="Descripción del mapa colaborativo"
                            value={mapDescription}
                            onChangeText={setMapDescription}
                            multiline={true}
                            maxLength={100}
                        />

                        <Text style={webStyles.inputLabel}>Número máximo de usuarios (2-6)</Text>
                        <View style={webStyles.pickerContainer}>
                            {[2, 3, 4, 5, 6].map((num) => {
                                const isSelected = maxUsers === num;
                                return (
                                    <TouchableOpacity
                                        key={num}
                                        style={[
                                            webStyles.pickerItem,
                                            { backgroundColor: isSelected ? playerColors[0] : "#f0f0f0" }
                                        ]}
                                        onPress={() => setMaxUsers(num)}
                                    >
                                        <Text
                                            style={[
                                                webStyles.pickerText,
                                                isSelected && webStyles.pickerTextSelected
                                            ]}
                                        >
                                            {num}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={webStyles.playerPreview}>
                            {[...Array(maxUsers)].map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        webStyles.playerColorCircle,
                                        { backgroundColor: playerColors[index] }
                                    ]}
                                />
                            ))}
                        </View>
                        <Text style={webStyles.playerPreviewText}>
                            Vista previa de colores de jugadores
                        </Text>

                        <View style={webStyles.modalButtons}>
                            <TouchableOpacity
                                style={[webStyles.modalButton, webStyles.cancelButton]}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={[webStyles.buttonText, { color: "#fff" }]}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[webStyles.modalButton, webStyles.createButton]}
                                onPress={createCollaborativeMap}
                            >
                                <Text style={webStyles.buttonText}>Crear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
                    <View style={webStyles.modalContainer}>
                      <View style={webStyles.modalContent}>
                        <Text style={webStyles.modalTitle}>Oops</Text>
                        <Text style={webStyles.inputLabel}>
                          Tienes que ser usuario premium para desbloquear esta funcionalidad
                        </Text>
                        <View style={webStyles.modalButtons}>
                          <TouchableOpacity
                            style={[webStyles.modalButton, webStyles.cancelButton]}
                            onPress={() => setShowCreateModal(false)}
                          >
                            <Text style={[webStyles.buttonText, { color: "#fff" }]}>Volver</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[webStyles.modalButton, webStyles.createButton]}
                            onPress={() => {
                              setShowCreateModal(false);
                              navigation.navigate('Payment');  // Redirige a la página de pago
                            }}
                          >
                            <Text style={webStyles.buttonText}>Mejorar a Premium</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>
        )
    );


    const getAvailableFriends = () => {
        return friends.filter(
          (friend) =>
            !invitedFriends.includes(friend.id) &&
            !map?.users_joined.some((user) => user.id === friend.id)
        );
      };
    const InviteButton: React.FC<{ friendId: string; onInvite: (id: string) => void }> = ({ friendId, onInvite }) => {
        const [isPressed, setIsPressed] = useState(false);
        return (
          <button
            style={{
              ...webStyles.inviteButton,
              transform: isPressed ? "scale(0.95)" : "scale(1)",
              transition: "transform 0.1s",
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            onClick={() => onInvite(friendId)}
          >
            Invitar
          </button>
        );
      };
    // Modal para invitar a un usuario al mapa colaborativo
    const renderInviteFriendsModal = () => {
        if (!showInviteModal) return null;
        const availableFriends = getAvailableFriends();
      
        return (
          <div
            style={webStyles.modalOverlay}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowInviteModal(false);
            }}
          >
            <div style={webStyles.modalContent}>
              <h2 style={webStyles.modalTitle}>Invitar Amigos</h2>
              <p style={webStyles.modalSubtitle}>Máximo 5 amigos (6 usuarios en total)</p>
              <div style={{ maxHeight: 150, overflowY: "auto" }}>
              {availableFriends.length === 0 ? (
                <p style={{ textAlign: "center", color: "#666", margin: 10 }}>
                  Tus amigos ya se han unido a este mapa.
                </p>
              ) : (
                availableFriends.map((friend) => (
                  <div key={friend.id} style={webStyles.invitedItem}>
                    <span style={webStyles.friendName}>{friend.name}</span>
                    <InviteButton friendId={friend.id} onInvite={sendFriendRequest} />
                  </div>
                ))
              )}
            </div>
              <button style={webStyles.closeButton} onClick={() => setShowInviteModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        );
      };

    // Modal para confirmar la eliminación de un mapa
    const renderDeleteConfirmModal = () => (
        <Modal
            visible={showDeleteConfirm}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowDeleteConfirm(false)}
        >
            <View style={webStyles.modalContainer}>
                <View style={[webStyles.modalContent, webStyles.confirmModal]}>
                    <Icon name="warning" size={40} color="#f44336" style={webStyles.warningIcon} />
                    <Text style={webStyles.confirmTitle}>Eliminar Mapa</Text>
                    <Text style={webStyles.confirmText}>
                        ¿Estás seguro de que deseas eliminar este mapa colaborativo? Esta acción no se puede deshacer.
                    </Text>
                    <View style={webStyles.modalButtons}>
                        <TouchableOpacity
                            style={[webStyles.modalButton, webStyles.cancelButton]}
                            onPress={() => setShowDeleteConfirm(false)}
                        >
                            <Text style={[webStyles.buttonText, { color: "#fff" }]}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[webStyles.modalButton, webStyles.deleteConfirmButton]}
                            onPress={deleteCollaborativeMap}
                        >
                            <Text style={webStyles.buttonText}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={webStyles.container}>
            {/* Cabecera */}
            <View style={webStyles.header}>
                <Text style={webStyles.headerTitle}>Mapas Colaborativos</Text>
                <TouchableOpacity
                    style={webStyles.createMapButton}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Icon name="add" size={24} color="white" />
                </TouchableOpacity>
            </View>
            {/* Lista de mapas */}
            {loading ? (
                <View style={webStyles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={webStyles.loadingText}>Cargando mapas colaborativos...</Text>
                </View>
            ) : (
                <FlatList
                    data={maps}
                    renderItem={renderMapItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={webStyles.listContainer}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={
                        <View style={webStyles.emptyContainer}>
                            <Icon name="map" size={60} color="#cccccc" />
                            <Text style={webStyles.emptyText}>No tienes mapas colaborativos</Text>
                            <Text style={webStyles.emptySubtext}>
                                Crea uno nuevo o espera a ser invitado
                            </Text>
                            <TouchableOpacity
                                style={webStyles.createEmptyButton}
                                onPress={() => setShowCreateModal(true)}
                            >
                                <Text style={webStyles.createEmptyButtonText}>
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

const webStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
        paddingBottom: 80
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#2196F3",
        paddingHorizontal: 16,
        paddingVertical: 12,
        // Para web se puede usar boxShadow en lugar de elevation
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white"
    },
    createMapButton: {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center"
    },
    listContainer: {
        padding: 16
    },
    mapItem: {
        backgroundColor: "white",
        borderRadius: 8,
        marginBottom: 12,
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        // Sombra para web
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    mapInfoContainer: {
        flex: 1
    },
    mapName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4
    },
    mapDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 6
    },
    mapUsers: {
        fontSize: 12,
        color: "#2196F3"
    },
    mapActions: {
        flexDirection: "row"
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f0f0f0",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8
    },
    deleteButton: {
        backgroundColor: "#ffebee"
    },
    friendName: {
        fontSize: 16,
        color: "#023E8A",
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666"
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#666",
        marginTop: 16
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
        marginTop: 8,
        marginBottom: 24,
        textAlign: "center"
    },
    createEmptyButton: {
        backgroundColor: "#2196F3",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25
    },
    createEmptyButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)"
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
        width: "85%",
        maxWidth: 400,
        // Sombra para web
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2
    },
    modalOverlay: {
        position: "absolute",
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
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center"
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#666",
        marginBottom: 15,
        textAlign: "center",
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: "500"
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 10,
        marginBottom: 16,
        fontSize: 16
    },
    invitedItem: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingTop: 8,
        paddingBottom: 8,
    },
    inviteButton: {
        backgroundColor: "#14b8a6",
        borderRadius: 8,
        paddingTop: 16,      // Aumenta el espacio superior
        paddingBottom: 16,   // Aumenta el espacio inferior
        paddingLeft: 16,     // Aumenta el espacio a la izquierda
        paddingRight: 16,    // Aumenta el espacio a la derecha
        borderWidth: 0,
        color: "white",
        cursor: "pointer",
        fontSize: 16,        // Aumenta el tamaño del texto
      },
      closeButton: {
        backgroundColor: "#03045E",
        borderRadius: 8,
        paddingTop: 16,
        paddingBottom: 16,
        paddingLeft: 16,
        paddingRight: 16,
        borderWidth: 0,
        color: "white",
        cursor: "pointer",
        marginTop: 20,
        fontSize: 16,
      },
    textArea: {
        minHeight: 80,
        textAlignVertical: "top"
    },
    pickerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12
    },
    pickerItem: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0"
    },
    pickerText: {
        fontSize: 16,
        color: "#666"
    },
    pickerTextSelected: {
        color: "white",
        fontWeight: "bold"
    },
    playerPreview: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 8
    },
    playerColorCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginHorizontal: 4
    },
    playerPreviewText: {
        textAlign: "center",
        fontSize: 12,
        color: "#666",
        marginBottom: 24
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 8
    },
    cancelButton: {
        backgroundColor: "#f44336"
    },
    createButton: {
        backgroundColor: "#2196F3"
    },
    deleteConfirmButton: {
        backgroundColor: "#f44336"
    },
    buttonText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "white"
    },
    toggleContainer: {
        flexDirection: "row",
        marginBottom: 16
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        backgroundColor: "#f0f0f0"
    },
    toggleButtonActive: {
        backgroundColor: "#2196F3"
    },
    toggleText: {
        fontSize: 14,
        color: "#666"
    },
    toggleTextActive: {
        color: "white",
        fontWeight: "bold"
    },
    warningIcon: {
        marginBottom: 16
    },
    confirmTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 12
    },
    confirmText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 24
    },
    confirmModal: {
        alignItems: "center"
    }
});

export default CollaborativeMapListScreenWeb;
