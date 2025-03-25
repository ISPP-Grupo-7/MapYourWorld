import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Button } from 'react-native';
import { styled } from 'nativewind';
import { API_URL } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { request } from 'http';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledInput = styled(TextInput);

const SocialScreen = () => {
  const [friendRequests, setFriendRequests] = useState<{ id: string; name: string; requestType: string, mapId: string}[]>([]);
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'amigos' | 'solicitudes' | 'buscar'>('amigos');
  const [userId, setUserId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Verificamos el usuario con un console.log
  useEffect(() => {
    console.log("Usuario actual en Social:", user);
  }, [user]);

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

  // Obtener solicitudes de amistad pendientes
  const fetchFriendRequests = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${userId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setFriendRequests(
          data.map((friend) => ({
            id: friend.id,
            name: friend.requester.email,
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
          setFriends([...friends, { id: friendId, name: data.name }]);
          Alert.alert("Solicitud Aceptada", `${data.name} ahora es tu amigo.`);
          fetchFriends(user.id);
        } else {
          Alert.alert("Solicitud Rechazada", `${data.name} ha sido eliminada.`);
        }
        setFriendRequests(friendRequests.filter((r) => r.id !== friendId));
      }
    } catch (error) {
      console.error(`Error al actualizar solicitud (${status}):`, error);
    }
  };


  const joinMap = async (friendId: string, status: 'ACCEPTED' | 'DELETED', mapId: string) => {
    console.log(`Uniendo a mapa ${mapId} con estado ${userId}`);
    try {
      const response = await fetch(`${API_URL}/api/collabMap/join/${mapId}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json", 
        },
        body: JSON.stringify({ friendId }), // Aquí se incluye el friendId
      });
      const data = await response.json();
      if (data.success) {
        if (status === 'ACCEPTED' && user) {
          Alert.alert("Invitación Aceptada, te has unido al mapa");
        } else {
          Alert.alert("Invitación Rechazada", `${data.name} ha sido eliminada.`);
        }
        setFriendRequests(friendRequests.filter((r) => r.id !== friendId));
      }
    } catch (error) {
      console.error(`Error al actualizar Invitación (${status}):`, error);
    }
  };

  const searchFriends = async () => {
    try {
      console.log(`🔎 Buscando amigos con query: ${searchQuery}`);
      const response = await fetch(`${API_URL}/api/friends/search/${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
  
      console.log("🔍 Respuesta del backend:", data); // Debug para verificar el formato
  
      if (Array.isArray(data)) {
        // ✅ Transformamos los datos para que coincidan con el formato `{ id, name }`
        setSearchResults(
          data.map((user: { id: string; email: string }) => ({
            id: user.id,
            name: user.email, // Se usa `email` como `name`
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
        Alert.alert("Solicitud enviada", `Has enviado una solicitud a ${data.name}`);
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
    }
  };

  const renderFriends = () => (
    <StyledView className="bg-white p-6 rounded-xl shadow-lg">
      {friends.length > 0 ? (
        friends.map((friend) => (
          <StyledView key={friend.id} className="flex-row items-center justify-between mb-4 border-b border-gray-200 pb-2">
            <StyledText className="text-lg text-gray-800 font-semibold">{friend.name}</StyledText>
          </StyledView>
        ))
      ) : (
        <StyledText className="text-gray-500 text-center">Aún no tienes amigos</StyledText>
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
        placeholder="Buscar amigos..."
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
  );
};
export default SocialScreen; 