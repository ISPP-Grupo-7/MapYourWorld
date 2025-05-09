import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, Modal, StyleSheet, Pressable, StatusBar } from 'react-native'; // Importar Pressable
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants/config';

const HamburgerMenu = () => {
  const { user } = useAuth();

  const [menuVisible, setMenuVisible] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Función simplificada para navegar
  const handleNavigate = (screen: keyof RootStackParamList, params?: object) => {
    setMenuVisible(false);
    // @ts-ignore - Usamos ts-ignore ya que es difícil tipificar correctamente la navegación
    navigation.navigate(screen, params);
  };

  // Función para obtener el perfil del usuario
  const fetchProfile = async (userId: string) => {
    
    setIsLoading(true);
    try {
      // Ajusta la URL base según tu configuración
      const response = await fetch(`${API_URL}/api/auth/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener el perfil');
      }
      
      const data = await response.json();
      setProfile(data.profile);
      console.log('Perfil obtenido:', data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar el perfil cuando el componente se monta o cuando cambia el usuario
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user]);


  return (
    <View style={{ marginRight: 10, zIndex: 100 }}> {/* Añadir zIndex alto al contenedor del botón */}
      <TouchableOpacity
        onPress={() => {
          console.log("Botón hamburguesa presionado, menuVisible antes:", menuVisible);
          setMenuVisible(true);
        }}
        style={{ padding: 8 }}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Text style={{ fontSize: 30 }}>☰</Text>
      </TouchableOpacity>

      {menuVisible && (
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
          hardwareAccelerated // Puedes probar a añadir esto
          statusBarTranslucent // Y esto, si sospechas de la StatusBar
        >
          {/* Usar Pressable para el overlay */}
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            {/* Evitar que el toque en el menuContainer cierre el modal */}
            <Pressable onPress={(e) => e.stopPropagation()} style={[styles.menuContainer, { elevation: 10 }]}> {/* Añadir elevation al menú */}
              

              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuItemText}>
                  {profile?.username || 'Usuario no disponible'}
                </Text>
              </TouchableOpacity>

                          
              <TouchableOpacity onPress={() => handleNavigate('Welcome')} style={styles.menuItem}>
                <Text style={styles.menuItemText}>Cerrar sesión</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              
              <TouchableOpacity onPress={() => handleNavigate('SocialScreen')} style={styles.menuItem}>
                <Text style={styles.menuItemText}>Social</Text>
              </TouchableOpacity>


              <TouchableOpacity onPress={() => handleNavigate('Map')} style={styles.menuItem}>
                <Text style={styles.menuItemText}>Mapa Individual</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleNavigate('CollaborativeMapListScreen')} 
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Mapas Colaborativos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleNavigate('UserStats')}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Estadísticas</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleNavigate('UserAchievementsScreen')} 
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>Logros</Text>
              </TouchableOpacity>

            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)', // Ligeramente más oscuro para depurar
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 60, // Ajuste para StatusBar de Android
    marginRight: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: 250, // Un poco más ancho
    // elevation: 5, // Ya lo pusimos inline
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 110, // zIndex más alto para el contenido del menú
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 18, // Texto más grande
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
    width: '100%',
  },
});

export default HamburgerMenu;
