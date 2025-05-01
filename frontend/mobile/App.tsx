/**
 * App principal de MapYourWorld Mobile
 */
import React, { useContext, useEffect, useRef, useState } from 'react';
import { SafeAreaView, StatusBar, View, Text, Image, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';
import { API_URL } from '@/constants/config';
import { ImageBackground } from 'react-native';

// Importamos las pantallas
import WelcomeScreen from './src/components/screens/WelcomeScreen';
import LoginScreen from './src/components/screens/LoginScreen';
import RegisterScreen from './src/components/screens/RegisterScreen';
import MapScreen from './src/components/Map/MapScreen';
import CollaborativeMapScreen from './src/components/Map/CollaborativeMapScreen';
import CollaborativeMapListScreen from './src/components/Map/CollaborativeMapListScreen';
import CollaborativeMapListScreenWeb from './src/components/Map/CollaborativeMapListScreen.web';
import HamburgerMenu from '@/components/UI/HamburgerMenu';
import { RootStackParamList } from './src/navigation/types';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import ForgotPasswordScreenMobile from './src/components/screens/ForgotPasswordScreen';
import ForgotPasswordScreenWeb from './src/components/screens/ForgotPasswordScreen.web';
import UserStatsScreen from './src/components/Stats/UserStatsScreen';
import UserAchievementsScreen from './src/components/Achievements/UserAchievementsScreen';
import AdvertisementForm from '@/components/screens/AdvertismentForm';
import DashboardAdmin from '@/components/screens/DashboardAdmin';
import SocialScreen from './src/components/screens/SocialScreen';
import SocialScreenWeb from './src/components/screens/SocialScreen.web';
import AnimatedPremiumButton from '@/components/UI/AnimatedPremiumButton';

// Aplicamos styled a los componentes nativos para poder usar Tailwind
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledSafeAreaView = styled(SafeAreaView);

// Componente de respaldo para pantallas no implementadas
const FallbackScreen = ({ title, message }: { title: string, message: string }) => (
  <StyledView className="flex-1 justify-center items-center p-5">
    <StyledText className="text-xl font-bold mb-2">{title}</StyledText>
    <StyledText className="text-base text-gray-600 text-center">{message}</StyledText>
  </StyledView>
);

// Usamos la definición de tipos de navegación centralizada
const Stack = createNativeStackNavigator<RootStackParamList>();

// Definimos un wrapper para MapScreen que incluye los distritos de ejemplo
const MapScreenWithDistritos = (props: any) => {
  // Usar la versión web cuando estamos en navegador
  if (Platform.OS === 'web') {
    try {
      // Importación dinámica del componente web
      const MapScreenWeb = require('./src/components/Map/MapScreen.web').default;
      return <MapScreenWeb {...props} />;
    } catch (error) {
      console.error("Error cargando MapScreen.web:", error);
      return (
        <StyledView className="flex-1 justify-center items-center p-4">
          <StyledText className="text-lg text-red-500">
            Error al cargar el mapa web. Por favor, intenta de nuevo.
          </StyledText>
        </StyledView>
      );
    }
  } else {
    return <MapScreen {...props} />;
  }
};

// Definimos un wrapper para ForgotPasswordScreen que selecciona la versión adecuada según la plataforma
const ForgotPasswordScreenWrapper = (props: any) => {
  if (Platform.OS === 'web') {
    return <ForgotPasswordScreenWeb {...props} />;
  } else {
    return <ForgotPasswordScreenMobile {...props} />;
  }
};

const SubscriptionScreenWrapper = (props: any) => {
  const authData = useAuth();
  const user = authData?.user;
  const updateSubscription = async () => {
    if (!user) return;
    try {
      // Obtener la suscripción actualizada del servidor
      const response = await fetch(`${API_URL}/api/subscriptions/active/${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      
      // Actualizar el estado en App.tsx usando el setSubscription que viene de props
      props.setSubscription(data);
    } catch (error) {
      console.error('Error al obtener la subscripción', error);
    }
  };

  if (Platform.OS === 'web') {
    const SubscriptionScreenWeb = require('@/components/screens/SubscriptionScreen.web').default;
    return <SubscriptionScreenWeb {...props} updateSubscription={updateSubscription} />;
  } 
  try {
    const SubscriptionScreen = require('@/components/screens/SubscriptionScreen').default;
    return (
      <SubscriptionScreen {...props} updateSubscription={updateSubscription} />
    );
  } catch (error) {
    console.error("Error cargando SubscriptionScreen:", error);
    return null;
  }
};

const UserAchievementsScreenWrapper = (props: any) => {
  if (Platform.OS === 'web') {
    const WebUserAchievementsScreen = require('./src/components/Achievements/UserAchievementsScreen.web').default;
    return <WebUserAchievementsScreen {...props} />;
  } else {
    return <UserAchievementsScreen {...props} />;
  }
};

const UserStatsScreenWrapper = (props: any) => {
  if (Platform.OS === 'web') {
    const WebUserStatsScreen = require('./src/components/Stats/UserStatsScreen.web').default;
    return <WebUserStatsScreen {...props} />;
  } else {
    return <UserStatsScreen {...props} />;
  }
};

// Definimos un wrapper para CollaborativeMapScreen que incluye los parámetros de ejemplo
const CollaborativeMapScreenWithParams = (props: any) => {
  const mapId = props.route?.params?.mapId || "map-123";
  const userId = props.route?.params?.userId || "user-456";
  
  if (Platform.OS === 'web') {
    try {
      const CollaborativeMapScreenWeb = require('./src/components/Map/CollaborativeMapScreen.web').default;
      return <CollaborativeMapScreenWeb mapId={mapId} userId={userId} />;
    } catch (error) {
      console.error("Error cargando CollaborativeMapScreen.web:", error);
      return (
        <StyledView className="flex-1 justify-center items-center p-4">
          <StyledText className="text-lg text-red-500">
            Error al cargar el mapa colaborativo web. Por favor, intenta de nuevo.
          </StyledText>
        </StyledView>
      );
    }
  } else {
    return <CollaborativeMapScreen mapId={mapId} userId={userId} />;
  }
};

const CollaborativeMapScreenListWithParams = (props: any) => {
  if (Platform.OS === 'web') {
    const CollaborativeMapListScreenWeb = require('@/components/Map/CollaborativeMapListScreen.web').default;
    return <CollaborativeMapListScreenWeb {...props} />;
  } 
  try {
    const CollaborativeMapListScreen = require('@/components/Map/CollaborativeMapListScreen').default;
    return (
      <CollaborativeMapListScreen {...props} />
    );
  } catch (error) {
    console.error("Error cargando CollaborativeMapListScreen:", error);
    return null;
  }
};

const SocialScreenWrapper = (props: any) => {
  if (Platform.OS === 'web') {
    const SocialScreenWeb = require('@/components/screens/SocialScreen.web').default;
    return <SocialScreenWeb {...props} />;
  } 
  try {
    const SocialScreen = require('@/components/screens/SocialScreen').default;
    return (
      <SocialScreen {...props} />
    );
  } catch (error) {
    console.error("Error cargando SocialScreen:", error);
    return null;
  }
};

const PERSISTENCE_KEY = "NAVIGATION_STATE";

// Componente principal de la aplicación
const AppContent = () => {
  const authData = useAuth();
  const user = authData?.user;
  const [subscription, setSubscription] = useState<any>(null);
  const [initialState, setInitialState] = useState<NavigationState | undefined>(undefined);
  const isReadyRef = useRef(false);

  // Restauramos el estado de navegación si estamos en web
  useEffect(() => {
    const restoreState = async () => {
      try {
        if (Platform.OS === 'web') {
          const savedStateString = localStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString ? JSON.parse(savedStateString) : undefined;
          setInitialState(state);
        }
      } catch (e) {
        console.error("Error al restaurar el estado de navegación", e);
      }
    };

    if (!isReadyRef.current) {
      restoreState().then(() => (isReadyRef.current = true));
    }
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_URL}/api/subscriptions/active/${user.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        setSubscription(data);
      } catch (error) {
        console.error('Error al obtener la subscripción', error);
      }
    };

    fetchSubscription();
  }, [user]);

  if (Platform.OS === 'web' && !isReadyRef.current) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }
  else{
  return (
    
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        if (Platform.OS === 'web') {
          localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
        }
      }}
    >
      <Stack.Navigator>
        <Stack.Screen name="Welcome" 
          component={WelcomeScreen} 
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Welcome</StyledText>
              </View>
            )
          }}
        />
        <Stack.Screen name="Register" 
          component={RegisterScreen} 
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Register</StyledText>
              </View>
            )
          }}
        />
        <Stack.Screen name="Login" 
          component={LoginScreen} 
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Login</StyledText>
              </View>
            )
          }}
        />
        <Stack.Screen name="AdvertisementForm" 
          component={AdvertisementForm} 
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Publicítate</StyledText>
              </View>
            )
          }}
        />
        <Stack.Screen 
          name="Map" 
          component={MapScreenWithDistritos}
          options={({ navigation }) => ({
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')}
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
              </View>
            ),
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ marginRight: 10 }}>
                  {subscription?.plan === "PREMIUM" ? (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Payment')}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text style={{ marginRight: 5, fontSize: 14, color: '#0d9488' }}>
                        Premium
                      </Text>
                      <Image
                        source={require('./src/assets/images/subscription_icon.png')}
                        style={{ width: 25, height: 25, marginRight: 10 }}
                      />
                    </TouchableOpacity>
                  ) : (
                    <AnimatedPremiumButton onPress={() => navigation.navigate('Payment')} />
                  )}
                </View>
                <HamburgerMenu />
              </View>
            ),
          })}
        />
        <Stack.Screen 
          name="CollaborativeMapListScreen" 
          component={CollaborativeMapScreenListWithParams}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Mapas Colaborativos</StyledText>
              </View>
            ),
            headerRight: () => <HamburgerMenu />,
          }} 
        />
        <Stack.Screen 
          name="CollaborativeMapScreen" 
          component={CollaborativeMapScreenWithParams}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Mapa Colaborativo</StyledText>
              </View>
            ),
            headerRight: () => <HamburgerMenu />,
          }} 
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreenWrapper}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Recuperar Contraseña</StyledText>
              </View>
            ),
          }} 
        />    
        <Stack.Screen 
          name="Payment" 
          component={() => <SubscriptionScreenWrapper setSubscription={setSubscription} />}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Pago</StyledText>
              </View>
            ),
          }} 
        />
        <Stack.Screen 
          name="UserAchievementsScreen" 
          component={UserAchievementsScreenWrapper}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Logros</StyledText>
              </View>
            ),
            headerRight: () => <HamburgerMenu />,
          }}
        />
        <Stack.Screen 
          name="SocialScreen" 
          component={SocialScreenWrapper}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Amigos</StyledText>
              </View>
            ),
            headerRight: () => <HamburgerMenu />,
          }} 
        />
        <Stack.Screen 
          name="DashboardAdmin" 
          component={DashboardAdmin}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Dashboard de administrador</StyledText>
              </View>
            )
          }}
        />
        <Stack.Screen 
          name="UserStats" 
          component={UserStatsScreenWrapper}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">Estadísticas</StyledText>
              </View>
            ),
            headerRight: () => <HamburgerMenu />,
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );}
};

// Componente App que envuelve todo con el proveedor de autenticación
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// Registramos directamente el componente App como componente raíz de la aplicación
registerRootComponent(App);

export default App;
