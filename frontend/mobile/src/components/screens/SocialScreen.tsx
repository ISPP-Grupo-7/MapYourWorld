import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Button, Modal, StyleSheet  } from 'react-native';
import { styled } from 'nativewind';
import { API_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { request } from 'http';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from "../../navigation/types";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledInput = styled(TextInput);


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
type NavigationProps = NavigationProp<RootStackParamList, 'SocialScreen'>;
const SocialScreen = () => {
  const [friendRequests, setFriendRequests] = useState<{ id: string; name: string; requestType: string, mapId: string}[]>([]);
  const [friends, setFriends] = useState<{ id: string; name: string; email: string; firstName: string; lastName: string }[]>([]);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'amigos' | 'solicitudes' | 'buscar'>('amigos');
  const [userId, setUserId] = useState<string | null>(null);
  const { user } = useAuth();
  const [maps, setMaps] = useState<CollaborativeMap[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigation = useNavigation<NavigationProps>();
  
  // Verificamos el usuario con un console.log
  useEffect(() => {
    console.log("Usuario actual en Social:", user);
  }, [user]);

  useEffect(() => {
        const fetchSubscription = async () => {
          try {
            if (!userId) return;
            const response = await fetch(`${API_URL}/api/subscriptions/active/${userId}`, {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
              throw new Error(`Error en la solicitud de subscripción: ${response.statusText}`);
            }
            const data = await response.json();
            setSubscription(data);
          } catch (error) {
            console.error("Error al obtener la subscripción", error);
          }
        };
        const fetchCollaborativeMaps = async () => {
          try {
            if (!userId) {
              console.warn("No se encontró el ID del usuario");
              return;
            }
        
            console.log(`Obteniendo mapas colaborativos para el usuario: ${userId}`);
            const response = await fetch(`${API_URL}/api/maps/collaborative/user/${userId}`);
        
            if (!response.ok) {
              console.warn(`Error en la petición: ${response.status}`);
              setMaps([]); // Limpia en caso de error
              return;
            }
        
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              console.warn("La respuesta no es JSON válido");
              setMaps([]);
              return;
            }
        
            const data = await response.json();
            console.log("Respuesta de mapas colaborativos:", data);
        
            if (data.success && data.maps) {
              setMaps(data.maps);
            } else {
              setMaps([]);
            }
          } catch (error) {
            console.error("Error al obtener los mapas colaborativos:", error);
            setMaps([]);
          } finally {
            console.log("Petición de mapas colaborativos finalizada");
          }
        };
        fetchCollaborativeMaps();
        fetchSubscription();
  }, [userId]);

  useEffect(() => {
    if (user && user.id) {
      console.log("Cargando amigos para el usuario:", user.id);
      setUserId(user.id);
      fetchFriends(user.id);
      fetchFriendRequests(user.id);
    }
  }, [user]);
  // Actualizar lista de amigos
    useEffect(() => {
      if (user && user.id) {
        fetchFriends(user.id);
      }
    }, [friendRequests]);

  // Obtener lista de amigos
  const fetchFriends = async (userId: string) => {
    try {
      console.log(`Solicitando amigos para el usuario: ${userId}`);
      const response = await fetch(`${API_URL}/api/friends/friends/${userId}`);
      const data = await response.json();
  
      console.log("Respuesta de lista de amigos", data); // Verifica la estructura en consola
  
      if (Array.isArray(data)) {
        // Si la respuesta es directamente un array de usuarios, lo asignamos
        setFriends(data.map((user) => ({
          id: user.id,
          name: user.profile.username, 
          email: user.email,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName
        })));
      } else {
        console.warn("Formato inesperado en la respuesta de amigos:", data);
      }
    } catch (error) {
      console.error("Error al obtener amigos:", error);
    }
  };

  
  

  // Obtener solicitudes de amistad pendientes
  const fetchFriendRequests = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${userId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setFriendRequests(
          data.map((friend) => ({
            id: friend.id,
            name: friend.requester.profile.username,
            requestType: friend.requestType,
            mapId: friend.requestType === 'MAP' ? friend.map.id || null : null,
          }))
        );
         
      } else {
        console.warn("Formato inesperado de la respuesta:", data);
      }
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
    }
  };

  // Aceptar/Rechazar solicitud de amistad
  const updateFriendStatus = async (friendId: string, status: 'ACCEPTED' | 'DELETED') => {
    try {
      const response = await fetch(`${API_URL}/api/friends/update/${friendId}/${status}`, {
        method: "PUT",
      });
      const data = await response.json();
      if (data.success) {
        if (status === 'ACCEPTED' && user) {
          setFriends([...friends, { id: friendId, name: data.name, email: data.email, firstName: data.firstName, lastName: data.lastName }]);
          Alert.alert("Solicitud Aceptada", ` Ahora sois amigos, ¡A explorar!.`);
          fetchFriends(user.id);
        } else {
          Alert.alert("Solicitud Rechazada", `La solicitud ha sido eliminada.`);
        }
        setFriendRequests(friendRequests.filter((r) => r.id !== friendId));
      }
    } catch (error) {
      console.error(`Error al actualizar solicitud (${status}):`, error);
    }
  };


  const joinMap = async (friendId: string, status: 'ACCEPTED' | 'DELETED', mapId: string) => {

    console.log(`Uniendo a mapa ${mapId} con estado ${status} para el usuario ${userId}`);

    if (subscription?.plan !== "PREMIUM" && status === 'ACCEPTED' && maps.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/api/collabMap/join/${mapId}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
      });
      const data = await response.json();
  
      if (data.success) {
        if (status === 'ACCEPTED') {
          Alert.alert("Invitación aceptada", "Te has unido al mapa.");
        } else {
          Alert.alert("Invitación rechazada", "La invitación ha sido eliminada.");
        }
        setFriendRequests(friendRequests.filter((r) => r.id !== friendId));
      }
    } catch (error) {
      console.error(`Error al actualizar invitación (${status}):`, error);
    }
  };
  

  const searchFriends = async () => {
    try {
      console.log(`🔎 Buscando amigos con query: ${searchQuery}`);
      const response = await fetch(`${API_URL}/api/friends/search/${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
  
      console.log("🔍 Respuesta de la busqueda:", data); // Debug para verificar el formato
  
      if (Array.isArray(data)) {
        // ✅ Transformamos los datos para que coincidan con el formato `{ id, name }`
        setSearchResults(
          data.map((user: { id: string; profile: { username: string } }) => ({
            id: user.id,
            name: user.profile.username, // Se usa `email` como `name`
          }))
        );
      } else {
        console.warn("⚠️ Formato inesperado en la respuesta de búsqueda:", data);
        setSearchResults([]); // Limpia la lista si el formato es incorrecto
      }
    } catch (error) {
      console.error("❌ Error al buscar amigos:", error);
      setSearchResults([]); // Limpia la lista en caso de error
    }
  };
  
  // Enviar solicitud de amistad
  const sendFriendRequest = async (friendId: string) => {
    try {
      
      const response = await fetch(`${API_URL}/api/friends/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId: user?.id, receiverId: friendId }),
      });
      console.log("Respuesta del backend:", response);
      const data = await response.json();
      
      if (data.success) {
        Alert.alert("Solicitud de amistad enviada", `Has enviado una solicitud de amistad a `+ data.friend.recipient.profile.username);
      } else {
         Alert.alert("No se pudo enviar la solicitud de amistad", "El usuario ya es tu amigo o tiene una solicitud pendiente.");
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
    }
  };

  const renderFriends = () => (
    <StyledView className="bg-white p-6 rounded-xl shadow-lg">
      {/* Fila de encabezados */}
      <StyledView className="flex-row justify-between items-center mb-4 border-b border-gray-200 pb-2">
        <StyledText className="text-lg text-gray-800 font-semibold flex-1 text-center">
          Nombre de Usuario
        </StyledText>
        <StyledText className="text-lg text-gray-800 font-semibold flex-1 text-center">
          Correo
        </StyledText>
        <StyledText className="text-lg text-gray-800 font-semibold flex-1 text-center">
          Nombre y Apellidos
        </StyledText>
      </StyledView>
      {friends.length > 0 ? (
        friends.map((friend) => (
          <StyledView
            key={friend.id}
            className="flex-row items-center justify-between mb-4 border-b border-gray-200 pb-2"
          >
            <StyledText className="text-sm text-gray-500 font-semibold flex-1 text-center">
              {friend.name}
            </StyledText>
            <StyledText className="text-sm text-gray-500 font-semibold flex-1 text-center">
              {friend.email}
            </StyledText>
            <StyledText className="text-sm text-gray-500 font-semibold flex-1 text-center">
              {friend.firstName} {friend.lastName}
            </StyledText>
          </StyledView>
        ))
      ) : (
        <StyledText className="text-gray-500 text-center">
          Aún no tienes amigos
        </StyledText>
      )}
    </StyledView>
  );
  

  const renderRequests = () => (
    <StyledView className="bg-white p-6 rounded-xl shadow-lg">
      {friendRequests.length > 0 ? (
        friendRequests.map((request) => (
          <StyledView 
            key={request.id} 
            className="mb-4 border-b border-gray-200 pb-2"
          >
            {/* Contenedor flexible para el texto y los botones */}
            <StyledView className="flex-row flex-wrap items-center justify-between gap-2">
              {/* Mensaje dinámico según el tipo de solicitud */}
              <StyledText className="text-lg text-gray-800 font-semibold flex-1 flex-shrink">
                {request.requestType === 'FRIEND' 
                  ? `${request.name} quiere ser tu amigo.` 
                  : `${request.name} te ha invitado a un mapa.`}
              </StyledText>
  
              {/* Botones de acción */}
              <StyledView className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => 
                    request.requestType === 'FRIEND' 
                      ? updateFriendStatus(request.id, 'ACCEPTED') 
                      : joinMap(request.id, 'ACCEPTED', request.mapId)
                  }
                >
                  <StyledText className="text-[#2196F3] font-medium">Aceptar</StyledText>
                </TouchableOpacity>
  
                <TouchableOpacity
                  onPress={() => 
                    request.requestType === 'FRIEND' 
                      ? updateFriendStatus(request.id, 'DELETED') 
                      : joinMap(request.id, 'DELETED', request.mapId)
                  }
                >
                  <StyledText className="text-red-500 font-medium">Rechazar</StyledText>
                </TouchableOpacity>
              </StyledView>
            </StyledView>
          </StyledView>
        ))
      ) : (
        <StyledText className="text-gray-500 text-center">No tienes solicitudes pendientes</StyledText>
      )}
    </StyledView>
  );
  
  

  const renderSearch = () => (
    <StyledView className="bg-white p-6 rounded-xl shadow-lg">
      <StyledInput
        className="border p-2 mb-4 rounded-lg"
        placeholder="Buscar amigos por nombre de usuario"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity onPress={searchFriends}>
        <StyledText className="text-[#2196F3] font-medium text-center">Buscar</StyledText>
      </TouchableOpacity>

      {searchResults.map((user) => (
        <StyledView key={user.id} className="flex-row items-center justify-between mt-4">
          <StyledText className="text-lg text-gray-800">{user.name}</StyledText>
          <TouchableOpacity onPress={() => sendFriendRequest(user.id)}>
            <StyledText className="text-[#2196F3] font-medium">Agregar</StyledText>
          </TouchableOpacity>
        </StyledView>
      ))}
    </StyledView>
  );

  return (
  <>
    <StyledScrollView className="flex-1 p-6 bg-gray-100">
      {/* Tabs */}
      <StyledView className="flex-row justify-around mb-8">
        {['amigos', 'solicitudes', 'buscar'].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab as any)}
            className={`flex-1 mx-1 py-3 rounded-full border border-[#2196F3] ${activeTab === tab ? 'bg-[#2196F3]' : 'bg-white'}`}>
            <StyledText className={`text-center font-medium ${activeTab === tab ? 'text-white' : 'text-[#2196F3]'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </StyledText>
          </TouchableOpacity>
        ))}
      </StyledView>

      {activeTab === 'amigos' && renderFriends()}
      {activeTab === 'solicitudes' && renderRequests()}
      {activeTab === 'buscar' && renderSearch()}
    </StyledScrollView>

    {/* Modal premium */}
    <Modal
      visible={showUpgradeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowUpgradeModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Oops</Text>
          <Text style={styles.inputLabel}>
            Tienes que ser usuario premium para unirte a más de un mapa colaborativo.
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowUpgradeModal(false)}
            >
              <Text style={[styles.buttonText, { color: "#fff" }]}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton]}
              onPress={() => {
                setShowUpgradeModal(false);
                navigation.navigate("Payment");
              }}
            >
              <Text style={styles.buttonText}>Mejorar a Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </>
);

};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo semitransparente
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  inputLabel: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: "#aaa",
  },
  createButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SocialScreen; 