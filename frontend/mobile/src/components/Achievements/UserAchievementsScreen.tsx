import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Image, Alert, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';
import Icon from "react-native-vector-icons/MaterialIcons";
import { getCurrentUser } from '@/services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

interface Achievement {
  name: string;
  description: string;
  dateEarned: string;
  points: number;
  iconUrl: string;
}

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
  const [achievementDate, setAchievementDate] = useState<string>("");
  const [achievementPoints, setAchievementPoints] = useState<number>(0);
  const [achievementIcon, setAchievementIcon] = useState<string>(iconPlaceholder);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        if (!user) return;
        const response = await fetch(`${API_URL}/api/subscriptions/active/${user.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Error en la solicitud de subscripcion: ${response.statusText}`);
        }
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error("Error al obtener la subscripcion", error);
      }
    };

    const fetchAchievements = async () => {
      try {
        if (!user) {
          setError("No hay usuario autenticado");
          setLoading(false);
          return;
        }
        setLoading(true);
        const response = await fetch(`${API_URL}/api/user-achievements/user/${user.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Error en la solicitud: ${response.statusText}`);
        }
        const data = await response.json();
        const transformed = data.map((item: any) => ({
          name: item.achievement.name,
          description: item.achievement.description,
          dateEarned: item.dateEarned,
          points: item.achievement.points,
          iconUrl: item.achievement.iconUrl,
        }));
        setAchievements(transformed);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener los logros", error);
        setError("Error al obtener los logros");
        setLoading(false);
      }
    };

    fetchSubscription();
    fetchAchievements();
  }, [user]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Cargando logros...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>{error}</Text>
      </View>
    );
  }

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
        fecha: achievementDate,
        iconUrl: achievementIcon,
      });
      if (subscription && subscription.plan !== "PREMIUM") {
        throw new Error("Solo los usuarios premium pueden crear logros");
      }
      const achievementData = {
        name: achievementName,
        description: achievementDescription || "Logro desbloqueado",
        achievementDate: achievementDate || new Date().toISOString(),
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
        throw new Error("La respuesta del servidor no es válida (no es JSON)");
      }
      const data = await response.json();
      console.log("Respuesta del servidor:", data);
      if (data.success) {
        setAchievementName("");
        setAchievementDescription("");
        setAchievementDate(new Date().toISOString());
        setAchievementIcon("default_icon.png");
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

  const renderCreateAchievementModal = () => (subscription && subscription.plan === "PREMIUM" ? (
    <Modal
      visible={showCreateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Crear Logro</Text>
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
          <Text style={styles.inputLabel}>Fecha del logro</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={achievementDate}
            onChangeText={setAchievementDate}
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
              <Text style={[styles.buttonText, { color: "#fff" }]}>Cancelar</Text>
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
          <Text style={styles.modalTitle}>Oops</Text>
          <Text style={styles.inputLabel}>Tienes que ser usuario premium para desbloquear esta funcionalidad</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={[styles.buttonText, { color: "#fff" }]}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ));

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View>
        <View style={styles.header} className="p-4">
          <Text style={styles.headerTitle}>Logros</Text>
          <TouchableOpacity style={styles.createAchievementButton} onPress={() => setShowCreateModal(true)}>
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {achievements.map((ach, index) => (
          <TouchableOpacity key={index} onPress={() => { setSelectedAchievement(ach); setShowDetailModal(true); }}>
            <View className="bg-white rounded-xl shadow-md p-5 mb-4 flex-row">
              <Image
                source={{ uri: ach.iconUrl }}
                style={{ width: 50, height: 50, marginRight: 15 }}
              />
              <View className="flex-1">
                <Text className="text-xl font-bold text-teal-600">{ach.name}</Text>
                <Text className="text-gray-600">{ach.description}</Text>
                <Text className="text-sm text-gray-500">Obtenido el: {ach.dateEarned}</Text>
                <Text className="text-sm text-gray-500">Puntos: {ach.points}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
                style={{ width: 100, height: 100, alignSelf: "center", marginBottom: 20 }}
              />
              <Text style={styles.inputLabel}>{selectedAchievement.description}</Text>
              <Text style={styles.inputLabel}>Obtenido el: {selectedAchievement.dateEarned}</Text>
              <Text style={styles.inputLabel}>Puntos: {selectedAchievement.points}</Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDetailModal(false)}
              >
                <Text style={[styles.buttonText, { color: "#fff" }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
  createAchievementButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: "#f44336",
  },
  createButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "white",
  },
});

export default UserAchievementsScreen;
