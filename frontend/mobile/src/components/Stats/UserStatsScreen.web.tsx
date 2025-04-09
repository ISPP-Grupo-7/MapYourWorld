  import React, { useState, useEffect, useCallback } from 'react';
  import { useAuth } from '@/contexts/AuthContext';
  import { API_URL } from '@/constants/config';
  import { ActivityIndicator } from 'react-native';
  import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
  import { RootStackParamList } from '@/navigation/types';
  import AlertModal from '../UI/Alert';

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
  
    const [alertVisible, setAlertVisible] = useState<boolean>(false);
    const [alertTitle, setAlertTitle] = useState<string>("");
    const [alertMessage, setAlertMessage] = useState<string>("");
    const [alertOnAction, setAlertOnAction] = useState<(() => void) | undefined>(undefined);
  
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
    const showAlert = (title: string, message: string, onAction?: () => void) => {
      setAlertTitle(title);
      setAlertMessage(message);
      setAlertOnAction(() => onAction);
      setAlertVisible(true);
    };

    const checkPremiumAndFetchStats = async () => {
      if (!user) {
        setError("No hay usuario autenticado");
        setLoading(false);
        return;
      }
  
      setLoading(true);
  
      try {
        const responseSub = await fetch(`${API_URL}/api/subscriptions/active/${user.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!responseSub.ok) throw new Error(responseSub.statusText);
        const subscription = await responseSub.json();
  
        if (subscription.plan !== "PREMIUM") {
          showAlert(
            "Función Premium",
            "La creación de logros personalizados es exclusiva para usuarios premium. ¡Mejora tu cuenta para desbloquear esta función!",
            () => {
              navigation.navigate('Payment');
              setAlertVisible(false);
            }
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Error al verificar subscripción", error);
        setError("Error al verificar subscripción");
        setLoading(false);
        return;
      }
  
      try {
        const response = await fetch(`${API_URL}/api/userStat/${user.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
  
        const statsData: Stats = {
          achievements: data.numeroLogros || 0,
          friends: data.numeroAmigos || 0,
          createdPOI: data.numeroPoisCreados || 0,
          unlockedDistricts: data.numeroDistritosDesbloqueados || 0,
          collabMaps: data.numeroMapasColaborativos || 0,
        };
  
        setStats(statsData);
      } catch (err) {
        console.error("Error al obtener las estadísticas:", err);
        setError("Error al obtener las estadísticas");
      } finally {
        setLoading(false);
      }
    };
  
    // useFocusEffect se ejecuta cada vez que la pantalla se enfoca
    useFocusEffect(
      useCallback(() => {
        checkPremiumAndFetchStats();
      }, [user])
    );

    if (loading) {
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
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
            backgroundColor: '#f9fafb'
          }}
        >
          <div style={{ color: '#ef4444', fontSize: 18, marginBottom: 8 }}>{error}</div>
          <div style={{ color: '#4b5563', fontSize: 16 }}>
            Inicia sesión para ver tus estadísticas
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          backgroundColor: '#f9fafb',
          padding: 16,
          maxWidth: '800px',
          margin: '0 auto',
          marginTop: 16,
          boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
        }}
      >
      <div
        style={{
          backgroundColor: '#E0F7FA',
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: 20,
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ width: '100%', marginBottom: 16, textAlign: 'center' }}>
            <h2 style={{ color: '#14b8a6', fontSize: 30, marginBottom: 10 }}>🏆 Logros</h2>
            <div style={{ fontSize: 25, fontWeight: 'bold', color: '#0d9488' }}>
              {stats?.achievements}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Amigos */}
      <div
        style={{
          backgroundColor: '#F1F8E9',
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 12 }}>
          <div style={{ width: '100%', marginBottom: 16, textAlign: 'center' }}>
            <h2 style={{ color: '#14b8a6', fontSize: 30, marginBottom: 10 }}>👥 Amigos</h2>
            <div style={{ fontSize: 25, fontWeight: 'bold', color: '#0d9488' }}>
              {stats?.friends}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: 20,
          marginBottom: 16
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            padding: '0 12px',
          }}
        >
          {/* POIs Creados */}
          <div
            style={{
              backgroundColor: '#FFF9C4',
              textAlign: 'center',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: 16,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h2 style={{ color: '#14b8a6', fontSize: 25, marginBottom: 10, marginTop: 10 }}>🗺️ POIs Creados</h2>
            <div style={{ fontSize: 25, fontWeight: 'bold', color: '#0d9488' }}>
              {stats?.createdPOI}
            </div>
          </div>

          {/* Distritos Desbloqueados */}
          <div
            style={{
              backgroundColor: '#FFE0B2',
              textAlign: 'center',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: 16,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h2 style={{ color: '#f59e0b', fontSize: 25, marginBottom: 10 }}>🚪 Distritos Desbloqueados</h2>
            <div style={{ fontSize: 25, fontWeight: 'bold', color: '#0d9488' }}>
              {stats?.unlockedDistricts}
            </div>
          </div>

          {/* Mapas Colaborativos */}
          <div
            style={{
              backgroundColor: '#E1BEE7',
              textAlign: 'center',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              padding: 16,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <h2 style={{ color: '#9333ea', fontSize: 25, marginBottom: 10 }}>🗺️ Mapas Colaborativos</h2>
            <div style={{ fontSize: 25, fontWeight: 'bold', color: '#0d9488' }}>
              {stats?.collabMaps}
            </div>
          </div>
        </div>
      </div>

            {/* Componente de alerta */}
            <AlertModal
              visible={alertVisible}
              title={alertTitle}
              message={alertMessage}
              onClose={() => setAlertVisible(false)}
              onAction={alertOnAction}
            />
          </div>
        );
      };

  export default UserStatsScreen;
