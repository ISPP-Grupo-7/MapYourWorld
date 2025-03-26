import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '@/services/auth.service';
import { API_URL } from '@/constants/config';
import Icon from "react-native-vector-icons/MaterialIcons";

// Interfaz para los logros
interface Achievement {
  name: string;
  description: string;
  dateEarned: string;
  points: number;
  iconUrl: string;
}

const iconPlaceholder = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQOuXSNhx4c8pKvcysPWidz4NibDU-xLeaJw&s";

const UserAchievementsScreen = () => {
  const user = getCurrentUser();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para el modal de creación de logros
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [achievementName, setAchievementName] = useState<string>("");
    const [achievementDescription, setAchievementDescription] = useState<string>("");
    const [achievementDate, setAchievementDate] = useState<string>("");
    const [achievementIcon, setAchievementIcon] = useState<string>(iconPlaceholder);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        let effectiveUser = user;
        if (!effectiveUser) {
          console.log("No hay usuario autenticado, usando modo de prueba para logros");
          const storedUserId = await AsyncStorage.getItem("userId");
          if (storedUserId) {
            console.log("Usando ID temporal guardado:", storedUserId);
            effectiveUser = { id: storedUserId, username: 'Usuario de Prueba', email: "mail@gmail.com", isPremium: true, createdAt: "2000-01-01" };
          } else {
            const temporalUserId = "user-456";
            console.log("Creando nuevo ID temporal:", temporalUserId);
            await AsyncStorage.setItem("userId", temporalUserId);
            effectiveUser = { id: temporalUserId, username: 'Usuario de Prueba', email: "mail@gmail.com", isPremium: true, createdAt: "2000-01-01" };
          }
        }

        // Datos simulados para los logros
        const mockAchievements: Achievement[] = [
          {
            name: "Primer Logro",
            description: "Has obtenido tu primer logro.",
            dateEarned: "2025-03-01",
            points: 10,
            iconUrl: iconPlaceholder,
          },
          {
            name: "Explorador",
            description: "Has visitado 10 lugares distintos.",
            dateEarned: "2025-03-05",
            points: 20,
            iconUrl: iconPlaceholder,
          },
          {
            name: "Veterano",
            description: "Has acumulado 100 puntos en total.",
            dateEarned: "2025-03-10",
            points: 30,
            iconUrl: iconPlaceholder,
          },
        ];

        setTimeout(() => {
          setAchievements(mockAchievements);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error al obtener los logros', error);
        setError('Error al obtener los logros');
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <ActivityIndicator size="large" color="#2bbbad" />
        </div>
        <div style={{ color: '#4b5563', fontSize: 16 }}>Cargando logros...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: 16,
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ color: '#ef4444', fontSize: 18, marginBottom: 8 }}>{error}</div>
        <div style={{ color: '#4b5563', fontSize: 16 }}>
          Inicia sesión para ver tus logros
        </div>
      </div>
    );
  }

  // Function to create a new achievement
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
        icono: achievementIcon,
      });

      // RN: Only premium users can create achievements
      if (user ? user.isPremium : false) {
        throw new Error("Solo los usuarios premium pueden crear logros");
      }

      const achievementData = {
        name: achievementName,
        description: achievementDescription || "Logro desbloqueado",
        achievementDate: achievementDate || new Date().toISOString(),
        icon: achievementIcon || iconPlaceholder,
      };

      const userId = user ? user.id : null;
      const response = await fetch(`${API_URL}/api/achievements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          achievementData,
          userId,
        }),
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
      Alert.alert(
        "Error",
        `No se pudo crear el logro: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Modal for creating an achievement
  const renderCreateAchievementModal = () => (
    <Modal visible={showCreateModal} transparent={true} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {user?.isPremium ? (
            <>
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

              <Text style={styles.inputLabel}>Ícono del logro</Text>
              <TextInput
                style={styles.input}
                placeholder="URL del icono"
                value={achievementIcon}
                onChangeText={setAchievementIcon}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={createAchievement}>
                  <Text style={styles.buttonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Oops</Text>
              <Text style={styles.inputLabel}>Tienes que ser usuario premium para desbloquear esta funcionalidad</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.buttonText}>Volver</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Mapas Colaborativos</Text>
      <TouchableOpacity
        style={styles.createAchievementButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>
      </View>
  )

  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        margin: '0 auto',
        minHeight: '100vh',
      }}
    >
      {/* Cabecera */}
      {renderHeader()}
      
      {/* Lista de logros */}
      <div
        style={{
          backgroundColor: 'rgb(234, 234, 234)',
          padding: 15,
          width: '100vw',
          minHeight: '100vh',
          display: 'grid',
          gap: 10,
          gridTemplateColumns: 'auto auto auto',
        }}>
        {achievements.map((achievement, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: 20,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              height: '20vh',
            }}
          >
            <img
              src={achievement.iconUrl}
              alt={achievement.name}
              style={{
                width: 60,
                height: 60,
                marginRight: 15,
                borderRadius: 8,
              }}
            />
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: '#0d9488',
                  marginBottom: 4,
                }}
              >
                {achievement.name}
              </h3>
              <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 4 }}>
                {achievement.description}
              </p>
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                Obtenido el: {achievement.dateEarned}
              </p>
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                Puntos: {achievement.points}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modales */}
      {renderCreateAchievementModal()}
    </div>
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
    backgroundColor: "#f44336", // Rojo para botones de cancelar
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
