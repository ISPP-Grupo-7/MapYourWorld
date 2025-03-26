import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { API_URL } from '../../constants/config';
import { useAuth } from '@/contexts/AuthContext';
// Si tienes un globalStyles, impórtalo:
import { styles as globalStyles } from '../../assets/styles/styles';

interface FriendRequest {
  id: string;
  name: string;
  requestType: string;
  mapId: string | null;
}

interface Friend {
  id: string;
  name: string;
}

const SocialScreenWeb = () => {
  // Estados
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'amigos' | 'solicitudes' | 'buscar'>('amigos');
  const [userId, setUserId] = useState<string | null>(null);

  // Acceso al contexto de Auth
  const { user } = useAuth();

  // Efectos
  useEffect(() => {
    if (user && user.id) {
      setUserId(user.id);
      fetchFriends(user.id);
      fetchFriendRequests(user.id);
    }
  }, [user]);

  useEffect(() => {
    // Cuando cambien las friendRequests, recargamos la lista de amigos
    if (user && user.id) {
      fetchFriends(user.id);
    }
  }, [friendRequests]);

  // Lógica de la pantalla: llamadas a API y manejo de solicitudes
  const fetchFriends = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/friends/${userId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setFriends(
          data.map((userItem: any) => ({
            id: userItem.id,
            name: userItem.email,
          }))
        );
      }
    } catch (error) {
      console.error('Error al obtener amigos:', error);
    }
  };

  const fetchFriendRequests = async (userId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/request/${userId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setFriendRequests(
          data.map((friend: any) => ({
            id: friend.id,
            name: friend.requester.email,
            requestType: friend.requestType,
            mapId: friend.requestType === 'MAP' ? friend.map?.id || null : null,
          }))
        );
      }
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
    }
  };

  const updateFriendStatus = async (friendId: string, status: 'ACCEPTED' | 'DELETED') => {
    try {
      const response = await fetch(`${API_URL}/api/friends/update/${friendId}/${status}`, {
        method: 'PUT',
      });
      const data = await response.json();
      if (data.success) {
        if (status === 'ACCEPTED' && user) {
          Alert.alert('Solicitud Aceptada', `${data.name} ahora es tu amigo.`);
        } else {
          Alert.alert('Solicitud Rechazada', `${data.name} ha sido eliminada.`);
        }
        // Quitamos la solicitud de la lista
        setFriendRequests((prev) => prev.filter((r) => r.id !== friendId));
      }
    } catch (error) {
      console.error(`Error al actualizar solicitud (${status}):`, error);
    }
  };

  const joinMap = async (friendId: string, status: 'ACCEPTED' | 'DELETED', mapId: string | null) => {
    console.log(userId, friendId, mapId);
    
    try {
      const response = await fetch(`${API_URL}/api/collabMap/join/${mapId}/${userId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json", 
        },
        body: JSON.stringify({ friendId }),
      });
      const data = await response.json();
      if (data.success) {
        if (status === 'ACCEPTED' && user) {
          Alert.alert('Invitación Aceptada', 'Te has unido al mapa.');
        } else {
          Alert.alert('Invitación Rechazada', 'Has rechazado la invitación.');
        }
        // Quitamos la solicitud de la lista
        setFriendRequests((prev) => prev.filter((r) => r.id !== friendId));
      }
    } catch (error) {
      console.error(`Error al actualizar invitación (${status}):`, error);
    }
  };

  const searchFriends = async () => {
    try {
      const response = await fetch(`${API_URL}/api/friends/search/${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSearchResults(
          data.map((userItem: any) => ({
            id: userItem.id,
            name: userItem.email,
          }))
        );
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error al buscar amigos:', error);
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/friends/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: user?.id, receiverId: friendId }),
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Solicitud enviada', `Has enviado una solicitud a ${data.name}`);
      }
    } catch (error) {
      console.error('Error al enviar solicitud:', error);
    }
  };

  // Renderizados parciales
  const renderFriends = () => (
    <View style={webStyles.cardContent}>
      {friends.length > 0 ? (
        friends.map((friend) => (
          <View key={friend.id} style={webStyles.itemCard}>
            <Text style={webStyles.itemText}>{friend.name}</Text>
          </View>
        ))
      ) : (
        <Text style={webStyles.infoText}>Aún no tienes amigos</Text>
      )}
    </View>
  );

  const renderRequests = () => (
    <View style={webStyles.cardContent}>
      {friendRequests.length > 0 ? (
        friendRequests.map((request) => (
          <View key={request.id} style={webStyles.itemCard}>
            <Text style={[webStyles.itemText, { flex: 1 }]}>
              {request.requestType === 'FRIEND'
                ? `${request.name} quiere ser tu amigo.`
                : `${request.name} te ha invitado a un mapa.`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={webStyles.acceptButton}
                onPress={() =>
                  request.requestType === 'FRIEND'
                    ? updateFriendStatus(request.id, 'ACCEPTED')
                    : joinMap(request.id, 'ACCEPTED', request.mapId)
                }
              >
                <Text style={webStyles.acceptButtonText}>Aceptar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={webStyles.rejectButton}
                onPress={() =>
                  request.requestType === 'FRIEND'
                    ? updateFriendStatus(request.id, 'DELETED')
                    : joinMap(request.id, 'DELETED', request.mapId)
                }
              >
                <Text style={webStyles.rejectButtonText}>Rechazar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={webStyles.infoText}>No tienes solicitudes pendientes</Text>
      )}
    </View>
  );

  const renderSearch = () => (
    <View style={webStyles.cardContent}>
      <TextInput
        style={webStyles.input}
        placeholder="Buscar amigos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={webStyles.primaryButton} onPress={searchFriends}>
        <Text style={webStyles.primaryButtonText}>Buscar</Text>
      </TouchableOpacity>
      {searchResults.map((userItem) => (
        <View key={userItem.id} style={webStyles.itemCard}>
          <Text style={webStyles.itemText}>{userItem.name}</Text>
          <TouchableOpacity style={webStyles.acceptButton} onPress={() => sendFriendRequest(userItem.id)}>
            <Text style={webStyles.acceptButtonText}>Agregar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  // Render principal
  return (
    <View style={webStyles.root}>

        <View style={webStyles.container}>
          {/* Contenedor blanco, igual que en WelcomeScreen */}
          <View style={webStyles.contentContainer}>
            <Text style={webStyles.title}>Amigos</Text>

            {/* Tabs */}
            <View style={webStyles.tabContainer}>
              {['amigos', 'solicitudes', 'buscar'].map((tab) => {
                const active = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[webStyles.tabButton, active && webStyles.tabButtonActive]}
                    onPress={() => setActiveTab(tab as any)}
                  >
                    <Text style={[webStyles.tabButtonText, active && webStyles.tabButtonTextActive]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Contenido según pestaña */}
            {activeTab === 'amigos' && renderFriends()}
            {activeTab === 'solicitudes' && renderRequests()}
            {activeTab === 'buscar' && renderSearch()}
          </View>
        </View>
    </View>
  );
};

export default SocialScreenWeb;

// -----------------------
// Estilos adaptados de WelcomeScreen
// -----------------------
const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
    maxWidth: 700, // Aumenta el ancho máximo de 600 a 800 (o el valor que prefieras)
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    justifyContent: 'flex-start', // Para que el contenido se ubique en la parte superior en vez de centrado
    marginTop: 50, // Ajusta este valor para posicionar el contenedor más arriba
  },
  
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1e293b', // Similar a WelcomeScreen
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#14b8a6',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#14b8a6',
  },
  tabButtonText: {
    color: '#14b8a6',
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: 'white',
  },
  // Contenido de las tarjetas
  cardContent: {
    marginTop: 10,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  itemText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 8,
  },
  // Botones de acción
  acceptButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e11d48',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  rejectButtonText: {
    color: '#e11d48',
    fontWeight: 'bold',
  },
  // Búsqueda
  input: {
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
