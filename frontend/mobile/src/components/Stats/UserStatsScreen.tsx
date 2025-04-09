import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/config';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

interface Stats {
  achievements: number;
  friends: number;
  createdPOI: number;
  unlockedDistricts: number;
  collabMaps: number;
}

const UserStatsScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {

      setLoading(true);
  
      let isActive = true;
  
      const checkSubscriptionAndFetchStats = async () => {
        if (!user) {
          if (isActive) {
            setError("No hay usuario autenticado");
            setLoading(false);
          }
          return;
        }
        try {
          const responseSub = await fetch(`${API_URL}/api/subscriptions/active/${user.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!responseSub.ok) throw new Error(responseSub.statusText);
          const subscription = await responseSub.json();
  
          if (subscription.plan !== "PREMIUM") {
            if (isActive) {
              setIsPremium(false);
              setShowPremiumModal(true);
              setLoading(false);
            }
            return;
          } else {
            if (isActive) {
              setIsPremium(true);
            }
          }
        } catch (error) {
          console.error("Error al verificar la suscripción", error);
          if (isActive) {
            setError("Error al verificar la suscripción");
            setLoading(false);
          }
          return;
        }
  
        try {
          console.log("Fetching stats for user:", user.id);
          
          const response = await fetch(`${API_URL}/api/userStat/${user.id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          if (!response.ok) throw new Error(response.statusText);
          const data = await response.json();
          console.log("Stats:", data);
  
          if (isActive) {
            const statsData: Stats = {
              achievements: data.numeroLogros || 0,
              friends: data.numeroAmigos || 0,
              createdPOI: data.numeroPoisCreados || 0,
              unlockedDistricts: data.numeroDistritosDesbloqueados || 0,
              collabMaps: data.numeroMapasColaborativos || 0,
            };
            setStats(statsData);
          }
        } catch (err) {
          console.error("Error al obtener las estadísticas:", err);
          if (isActive) {
            setError("Error al obtener las estadísticas");
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };
  
      checkSubscriptionAndFetchStats();
  
      return () => {
        isActive = false;
      };
    }, [user])
  );

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: "#f9fafb",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    card: {
      backgroundColor: "white",
      borderRadius: 12,
      padding: 24,
      width: "100%",
      maxWidth: 500,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 8,
      elevation: 6,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1f2937",
      marginBottom: 24,
      textAlign: "center",
    },
    statBox: {
      marginBottom: 20,
    },
    statLabel: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#0d9488",
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      color: "#4b5563",
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: "#f9fafb",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: "#4b5563",
    },
    errorContainer: {
      flex: 1,
      backgroundColor: "#f9fafb",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    errorText: {
      color: "#ef4444",
      fontSize: 18,
      marginBottom: 8,
      textAlign: "center",
    },
    errorSubText: {
      color: "#4b5563",
      fontSize: 16,
      textAlign: "center",
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
    modalTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: "center",
      color: "#14b8a6",
    },
    inputLabel: {
      fontSize: 16,
      marginBottom: 8,
      fontWeight: "500",
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
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: "#14b8a6",
    },
    createButton: {
      backgroundColor: "#14b8a6",
    },
    buttonText: {
      fontWeight: "bold",
      fontSize: 16,
      color: "black",
    },
  });

  const renderPremiumModal = () => (
    <Modal
      visible={showPremiumModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPremiumModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Función Premium</Text>
          <Text style={[styles.inputLabel, { textAlign: "center", marginBottom: 20 }]}>
            Tienes que ser usuario premium para desbloquear esta funcionalidad
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { marginBottom: 15 }]}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.createButton, { marginBottom: 15 }]}
              onPress={() => {
                setShowPremiumModal(false);
                navigation.navigate('Payment');
              }}
            >
              <Text style={styles.buttonText}>Mejorar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2bbbad" />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubText}>
          Inicia sesión para ver tus estadísticas
        </Text>
      </View>
    );
  }

  if (isPremium === false) {
    return (
      <View style={styles.screen}>
        {renderPremiumModal()}
      </View>
    );
  }

  return (
    <ScrollView
    contentContainerStyle={{
      backgroundColor: "#f9fafb",
      padding: 16,
    }}
  >
      {/* Logros */}
      <View style={{ backgroundColor: "#E0F7FA", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#14b8a6", fontSize: 30, marginBottom: 10 }}>🏆 Logros</Text>
          <Text style={{ fontSize: 25, fontWeight: "bold", color: "#0d9488" }}>{stats?.achievements}</Text>
        </View>
      </View>
  
      {/* Amigos */}
      <View style={{ backgroundColor: "#F1F8E9", borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#14b8a6", fontSize: 30, marginBottom: 10 }}>👥 Amigos</Text>
          <Text style={{ fontSize: 25, fontWeight: "bold", color: "#0d9488" }}>{stats?.friends}</Text>
        </View>
      </View>
  
      {/* POIs Creados */}
      <View style={{ backgroundColor: "#FFF9C4", borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#14b8a6", fontSize: 30, marginBottom: 10 }}>🗺️ POIs Creados</Text>
          <Text style={{ fontSize: 25, fontWeight: "bold", color: "#0d9488" }}>{stats?.createdPOI}</Text>
        </View>
      </View>
  
      {/* Distritos Desbloqueados */}
      <View style={{ backgroundColor: "#FFE0B2", borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#f59e0b", fontSize: 30, marginBottom: 10 }}>🚪 Distritos Desbloqueados</Text>
          <Text style={{ fontSize: 25, fontWeight: "bold", color: "#0d9488" }}>{stats?.unlockedDistricts}</Text>
        </View>
      </View>
  
      {/* Mapas Colaborativos */}
      <View style={{ backgroundColor: "#E1BEE7", borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: "#9333ea", fontSize: 30, marginBottom: 10 }}>🗺️ Mapas Colaborativos</Text>
          <Text style={{ fontSize: 25, fontWeight: "bold", color: "#0d9488" }}>{stats?.collabMaps}</Text>
        </View>
      </View>
      
  
      {showPremiumModal && renderPremiumModal()}
    </ScrollView>
  );

}

export default UserStatsScreen;
