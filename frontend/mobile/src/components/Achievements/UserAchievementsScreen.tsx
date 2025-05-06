import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, Alert, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { AchievementUtils, TransformedAchievement } from '../../utils/AchievementUtils';

interface Achievement {
  id?: string;
  name: string;
  description: string;
  points: number;
  iconUrl: string;
}

type Stats = {
  achievements: number;
  friends: number;
  createdPOI: number;
  unlockedDistricts: number;
  collabMaps: number;
};

const allAchievements: Achievement[] = [
  { id: "0e6bfcb2-350a-4c98-9195-9ec6b516e390", name: "Explorador Novato", description: "Crea tu primer punto de interés.", points: 10, iconUrl: "https://images.pexels.com/photos/1051077/pexels-photo-1051077.jpeg" },
  { id: "288930cb-27c2-4340-910b-3f2ffcc914dd", name: "Cartógrafo Aficionado", description: "Crea 10 puntos de interés.", points: 50, iconUrl: "https://images.pexels.com/photos/8869349/pexels-photo-8869349.jpeg" },
  { id: "8693fa93-723b-45c5-8392-662f73566787", name: "Maestro del Mapa", description: "Crea 50 puntos de interés.", points: 250, iconUrl: "https://images.pexels.com/photos/7634707/pexels-photo-7634707.jpeg" },
  { id: "c1339ed7-60d5-4027-9220-42df6d30d3f8", name: "Conector Social", description: "Haz tu primer amigo.", points: 15, iconUrl: "https://images.pexels.com/photos/9353433/pexels-photo-9353433.jpeg" },
  { id: "96bbe1f5-3e3c-4277-8113-9cdf8c8eaf2b", name: "Círculo de Amigos", description: "Haz 10 amigos.", points: 75, iconUrl: "https://images.pexels.com/photos/7968883/pexels-photo-7968883.jpeg" },
  { id: "295f40ea-bca7-4e35-911c-b217b6dec467", name: "Red Social", description: "Haz 50 amigos.", points: 400, iconUrl: "https://images.pexels.com/photos/10431338/pexels-photo-10431338.jpeg" },
  { id: "03d762f3-7701-4a87-a4d5-77f37330b506", name: "Primeros pasos", description: "Acumula 10 kilómetros de distancia.", points: 20, iconUrl: "https://images.pexels.com/photos/3601094/pexels-photo-3601094.jpeg" },
  { id: "b1b2d415-69c8-4b73-8e80-94fe825afcc0", name: "Maratonista Urbano", description: "Acumula 50 kilómetros de distancia.", points: 150, iconUrl: "https://images.pexels.com/photos/1526790/pexels-photo-1526790.jpeg" },
  { id: "5e99b4ec-c150-4de3-a83c-f1573d77b4de", name: "Explorador Incansable", description: "Acumula 200 kilómetros de distancia.", points: 750, iconUrl: "https://images.pexels.com/photos/421160/pexels-photo-421160.jpeg" },
  { id: "3cec81ea-6160-4188-9ffc-6610ba90e9a1", name: "Racha Inicial", description: "Inicia sesión 3 días consecutivos.", points: 25, iconUrl: "https://images.pexels.com/photos/4350099/pexels-photo-4350099.jpeg" },
  { id: "d17553e9-5308-4fa0-9b04-be015186ff9f", name: "Racha Semanal", description: "Inicia sesión 7 días consecutivos.", points: 100, iconUrl: "https://images.pexels.com/photos/2265488/pexels-photo-2265488.jpeg" },
  { id: "238e196c-bd6e-4413-9329-71e7a9753a70", name: "Racha Mensual", description: "Inicia sesión 30 días consecutivos.", points: 500, iconUrl: "https://images.pexels.com/photos/31525462/pexels-photo-31525462.jpeg" },
];

const iconPlaceholder = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQOuXSNhx4c8pKvcysPWidz4NibDU-xLeaJw&s";

const UserAchievementsScreen = () => {
  const authData = useAuth();
  const user = authData?.user;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [achievementName, setAchievementName] = useState<string>("");
  const [achievementDescription, setAchievementDescription] = useState<string>("");
  const [achievementPoints, setAchievementPoints] = useState<number>(0);
  const [achievementIcon, setAchievementIcon] = useState<string>(iconPlaceholder);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [filter, setFilter] = useState<'user' | 'all'>('user');

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_URL}/api/subscriptions/active/${user.id}`, {
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

    const fetchAchievements = async (
          userId: string
        ) => {
          if (!userId) return;
          setLoading(true);
          try {
            const unlocked = await AchievementUtils.getUnlockedAchievements(userId);
            setAchievements(unlocked);
            setError(null);
          } catch (err: any) {
            console.error("Error al obtener estadísticas o logros:", err);
            setError(err.message || "Error al obtener estadísticas o logros");
          } finally {
            setLoading(false);
          }
        };

    const fetchAllAchievements = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/achievements`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        setAchievements(data);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener todos los logros", error);
        setError("Error al obtener todos los logros");
        setLoading(false);
      }
    };


    fetchSubscription();
    if (filter === 'user' && user) {
      fetchAchievements(user.id);
    } else {
      fetchAllAchievements();
    }
  }, [user, filter]);

  const createAchievement = async () => {
    if (!achievementName.trim()) {
      Alert.alert("Error", "Por favor, ingresa un nombre para el logro");
      return;
    }
    try {
      setLoading(true);
      console.log("Creando logro:", {
        nombre: achievementName,
        descripción: achievementDescription,
        iconUrl: achievementIcon,
      });
      if (subscription && subscription.plan !== "PREMIUM") {
        throw new Error("Solo los usuarios premium pueden crear logros");
      }
      const achievementData = {
        name: achievementName,
        description: achievementDescription || "Logro desbloqueado",
        iconUrl: achievementIcon || iconPlaceholder,
        points: achievementPoints,
      };
      const response = await fetch(`${API_URL}/api/achievements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(achievementData),
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Error al crear el logro");
      }
      const data = await response.json();
      console.log("Respuesta del servidor:", data);
      if (data.success) {
        setAchievementName("");
        setAchievementDescription("");
        setAchievementIcon("default_icon.png");
        setAchievementPoints(0);
        setShowCreateModal(false);
        Alert.alert("Éxito", "Logro creado correctamente");
      } else {
        throw new Error(data.message || "Error al crear el logro");
      }
    } catch (error) {
      console.error("Error al crear logro:", error);
      Alert.alert("Error", `No se pudo crear el logro: ${error instanceof Error ? error.message : "Error desconocido"}`);
    } finally {
      setLoading(false);
    }
  };

  const renderCreateAchievementModal = () =>
    subscription && subscription.plan === "PREMIUM" ? (
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¡Crea tu propio logro!</Text>
            <Text style={styles.inputLabel}>Nombre del logro*</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Explorador Maestro"
              value={achievementName}
              onChangeText={setAchievementName}
              maxLength={30}
            />
            <Text style={styles.inputLabel}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción del logro"
              value={achievementDescription}
              onChangeText={setAchievementDescription}
              multiline={true}
              maxLength={100}
            />
            <Text style={styles.inputLabel}>Puntos</Text>
            <TextInput
              style={styles.input}
              placeholder="Puntos del logro"
              value={achievementPoints.toString()}
              onChangeText={(text) => setAchievementPoints(Number(text))}
              keyboardType="numeric"
            />
            <Text style={styles.inputLabel}>Ícono del logro</Text>
            <TextInput
              style={styles.input}
              placeholder="URL del icono"
              value={achievementIcon}
              onChangeText={setAchievementIcon}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.buttonText]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createAchievement}
              >
                <Text style={styles.buttonText}>Crear</Text>
              </TouchableOpacity>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Función Premium</Text>
            <Text style={{ ...styles.inputLabel, textAlign: "center", marginBottom: 20 }}>
              Tienes que ser usuario premium para desbloquear esta funcionalidad
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { marginBottom: 15 }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.buttonText]}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton, { marginBottom: 15 }]}
                onPress={() => {
                  setShowCreateModal(false);
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

    const styles = StyleSheet.create({
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#00b0dc",
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 4,
        marginBottom: 15,
      },
      container: {
        flex: 1,
        backgroundColor: "rgb(249,250,251)",
      },
      headerLeft: {
        flex: 1,
        flexDirection: "column",
      },
      headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
      },
      filterContainer: {
        flexDirection: "row",
      },
      filterButton: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 2.5,
        borderColor: "white",
        backgroundColor: "white",

      },
      activeFilterButton: {
        borderWidth: 2,
        borderColor: "#00b0dc",
        backgroundColor: "#00b0dc",
      },
      filterText: {
        fontWeight: "bold",
        color: "#007df3",
      },
      activeFilterText: {
        color: "white",
      },
      createAchievementButton: {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
      },
      achievementCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: "row",
        alignItems: "center",
        elevation: 3,
        marginHorizontal: 10,
      },
      achievementName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#00b0dc",
      },
      achievementDescription: {
        fontSize: 14,
        color: "#00386d",
      },
      achievementInfo: {
        fontSize: 12,
        color: "#ade8f4",
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
        color: "#00b0dc",
      },
      inputLabel: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: "500",
      },
      detailLabel: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: "500",
        alignSelf: "center",
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
      detailModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginHorizontal: 8,
        backgroundColor: "black",
      },
      cancelButton: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#00b0dc",
      },
      createButton: {
        backgroundColor: "#00b0dc",
      },
      buttonText: {
        fontWeight: "bold",
        fontSize: 16,
        color: "14b8a6",
      },
      detailButtonText: {
        fontWeight: "bold",
        color: "black",
        alignSelf: "center",
      },
      cancelDetailButton: {
        fontWeight: "bold",
        color: "#00b0dc",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#00b0dc",
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 8,
        width: "50%",
        alignSelf: "center",
      },
      emptyStateContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
      },
      emptyStateText: {
        fontSize: 16,
        color: '#ade8f4',
        textAlign: 'center',
      },
    });

    return (
      <ScrollView style={styles.container}>
        <View>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filter === 'user' && styles.activeFilterButton,
                  ]}
                  onPress={() => setFilter('user')}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === 'user' && styles.activeFilterText,
                    ]}
                  >
                    Logros obtenidos
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filter === 'all' && styles.activeFilterButton,
                    { marginLeft: 10 },
                  ]}
                  onPress={() => setFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterText,
                      filter === 'all' && styles.activeFilterText,
                    ]}
                  >
                    Todos los logros
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.createAchievementButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Icon name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
          {filter === 'user' && achievements.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Aún no has conseguido ningún logro.
              </Text>
            </View>
          ) : (
            achievements.map((ach, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSelectedAchievement(ach);
                  setShowDetailModal(true);
                }}
              >
                <View style={styles.achievementCard}>
                  <Image
                    source={{ uri: ach.iconUrl }}
                    style={{ width: 50, height: 50, marginRight: 15 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.achievementName}>{ach.name}</Text>
                    <Text style={styles.achievementDescription}>{ach.description}</Text>
                    <Text style={styles.achievementInfo}>Puntos: {ach.points}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
        {renderCreateAchievementModal()}
        {selectedAchievement && (
          <Modal
            visible={showDetailModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDetailModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedAchievement.name}</Text>
                <Image
                  source={{ uri: selectedAchievement.iconUrl }}
                  style={{
                    width: 100,
                    height: 100,
                    alignSelf: "center",
                    marginBottom: 20,
                  }}
                />
                <Text style={styles.detailLabel}>
                  {selectedAchievement.description}
                </Text>
                <Text style={styles.detailLabel}>
                  Puntos: {selectedAchievement.points}
                </Text>
                <TouchableOpacity
                  style={[ styles.cancelDetailButton]}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={[styles.detailButtonText]}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    );
    

  };


export default UserAchievementsScreen;
