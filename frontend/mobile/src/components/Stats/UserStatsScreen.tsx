import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from '../../constants/config';

interface UserStats {
  totalPoisCreados: number;
  totalAmigos: number;
  totalLogros: number;
  distanciaAcumulada: number;
  daysConsecutive: number;
  rankingPoints: number;
}

const UserStatsScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let effectiveUser = user;
        console.log("Usuario logeado:", effectiveUser);
        if (!effectiveUser) {
          console.log("No hay usuario autenticado, usando modo de prueba para estadísticas");
          const storedUserId = await AsyncStorage.getItem("userId");
          if (storedUserId) {
            console.log("Usando ID temporal guardado:", storedUserId);
            effectiveUser = { id: storedUserId, username: 'Usuario de Prueba' };
          } else {
            const temporalUserId = "user-456";
            console.log("Creando nuevo ID temporal:", temporalUserId);
            await AsyncStorage.setItem("userId", temporalUserId);
            effectiveUser = { id: temporalUserId, username: 'Usuario de Prueba' };
            Alert.alert(
              "Modo de Prueba",
              "Estás viendo estadísticas en modo de prueba. Los datos mostrados son simulados.",
              [{ text: "Entendido", style: "default" }]
            );
          }
        }
        
        // Realizar llamada a la API para obtener las estadísticas del usuario
        const response = await fetch(`${API_URL}/api/statistics/user/${effectiveUser!.id}`);
        console.log("Respuesta de la API:", response);
        let userStat = null;

        if (response.ok) {
          // Si la respuesta es exitosa, parsear el JSON
          const data = await response.json();
          console.log("Estadísticas:", data);
          userStat = data;
        } else if (response.status === 404) {
          // Si la respuesta es 404, significa que no existe la línea de estadísticas para el usuario
          console.log("No se encontraron estadísticas para el usuario (404), creando con valores por defecto");
          const createResponse = await fetch(`${API_URL}/api/statistics`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId: effectiveUser!.id })
          });
          if (!createResponse.ok) {
            throw new Error("Error al crear estadísticas por defecto");
          }
          const createdData = await createResponse.json();
          userStat = createdData;
          console.log("Estadísticas creadas:", userStat);
        } else {
          // Para otros códigos de error, lanzar excepción
          throw new Error("Error al obtener las estadísticas");
        }
        // Mapear la respuesta al formato esperado por el frontend
        const mappedStats: UserStats = {
          totalPoisCreados: userStat.totalPoisCreados,
          totalAmigos: userStat.totalAmigos,
          totalLogros: userStat.totalAchievements,
          distanciaAcumulada: parseFloat(userStat.distanceCumulative),
          daysConsecutive: userStat.daysConsecutive,
          rankingPoints: userStat.rankingPoints,
        };
        console.log("Estadísticas mapeadas:", mappedStats);
        setStats(mappedStats);
        setLoading(false);
      } catch (error: any) {
        console.error("Error al obtener las estadísticas:", error);
        setError("Error al obtener las estadísticas");
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} h ${mins} min`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="bg-white rounded-xl shadow-md p-5 mb-4">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Ranking</Text>
          <View className="flex-row flex-wrap justify-between mt-3">
            <View className="w-1/2 pr-2 mb-4">
              <Text className="text-gray-500 text-sm">Logros</Text>
              <Text className="text-xl font-bold text-teal-600">{stats?.totalLogros}</Text>
            </View>
            <View className="w-1/2 pr-2 mb-4">
              <Text className="text-gray-500 text-sm">Días Consecutivos</Text>
              <Text className="text-xl font-bold text-teal-600">{stats?.daysConsecutive}</Text>
            </View>
            <View className="w-1/2 pl-2 mb-4">
              <Text className="text-gray-500 text-sm">Puntos de Ranking</Text>
              <Text className="text-xl font-bold text-teal-600">#{stats?.rankingPoints}</Text>
            </View>
          </View>
        </View>
        
        <View className="bg-white rounded-xl shadow-md p-5 mb-4">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Actividad Social</Text>
          <View className="flex-row flex-wrap justify-between mt-3">
            <View className="w-1/2 pr-2 mb-4">
              <Text className="text-gray-500 text-sm">Amigos</Text>
              <Text className="text-xl font-bold text-teal-600">{stats?.totalAmigos}</Text>
            </View>
          </View>
        </View>
        
        <View className="bg-white rounded-xl shadow-md p-5 mb-4">
          <Text className="text-2xl font-bold text-gray-800 mb-2">Actividad en Mapas</Text>
          <View className="flex-row flex-wrap justify-between mt-3">
            <View className="w-1/2 pr-2 mb-4">
              <Text className="text-gray-500 text-sm">Distancia Acumulada</Text>
              <Text className="text-xl font-bold text-teal-600">{stats?.distanciaAcumulada} km</Text>
            </View>
            <View className="w-1/2 pl-2 mb-4">
              <Text className="text-gray-500 text-sm">POIs Creados</Text>
              <Text className="text-xl font-bold text-teal-600">{stats?.totalPoisCreados || 0}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default UserStatsScreen;