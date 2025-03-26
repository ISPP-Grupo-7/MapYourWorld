/**
 * App principal de MapYourWorld Mobile
 */
import React, { useState } from 'react';
import { SafeAreaView, StatusBar, View, Text, Image, TouchableOpacity, Platform } from 'react-native';
import { styled } from 'nativewind';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';

// Importamos las pantallas
import WelcomeScreen from './src/components/screens/WelcomeScreen';
import LoginScreen from './src/components/screens/LoginScreen';
import RegisterScreen from './src/components/screens/RegisterScreen';
import MapScreen from './src/components/Map/MapScreen';
import CollaborativeMapScreen from './src/components/Map/CollaborativeMapScreen';
import CollaborativeMapListScreen from './src/components/Map/CollaborativeMapListScreen';
import HamburgerMenu from '@/components/UI/HamburgerMenu';
import { RootStackParamList } from './src/navigation/types';
import { AuthProvider } from './src/contexts/AuthContext';
import ForgotPasswordScreenMobile from './src/components/screens/ForgotPasswordScreen';
import ForgotPasswordScreenWeb from './src/components/screens/ForgotPasswordScreen.web';
import UserStatsScreen from './src/components/Stats/UserStatsScreen';
import UserAchievementsScreen from './src/components/Achievements/UserAchievementsScreen';
import AdvertisementForm from '@/components/screens/AdvertismentForm';

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

// Definimos un wrapper para CollaborativeMapScreen que incluye los parámetros de ejemplo
const CollaborativeMapScreenWithParams = (props: any) => {
  // Obtenemos el mapId y userId de los parámetros de navegación
  const mapId = props.route?.params?.mapId || "map-123";
  const userId = props.route?.params?.userId || "user-456";
  
  // Usar la versión web cuando estamos en navegador
  if (Platform.OS === 'web') {
    try {
      // Importación dinámica del componente web
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

// Definimos un wrapper para ForgotPasswordScreen que selecciona la versión adecuada según la plataforma
const ForgotPasswordScreenWrapper = (props: any) => {
  // Usar la versión web cuando estamos en navegador
  if (Platform.OS === 'web') {
    return <ForgotPasswordScreenWeb {...props} />;
  } else {
    return <ForgotPasswordScreenMobile {...props} />;
  }
};

const SubscriptionScreenWrapper = (props: any) => {
  if (Platform.OS === 'web') {
    const SubscriptionScreenWeb = require('@/components/screens/SubscriptionScreen.web').default;
    return <SubscriptionScreenWeb {...props} />;
  } 

  try {
    const SubscriptionScreen = require('@/components/screens/SubscriptionScreen').default;
    return (
        <SubscriptionScreen {...props} />
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

// Componente principal de la aplicación
const AppContent = () => {
  return (
    <NavigationContainer>
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
          
        }}/>
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
          
        }}/>
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
          
        }}/>
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
          
        }}/>
        <Stack.Screen 
          name="Map" 
          component={MapScreenWithDistritos}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={require('./src/assets/images/logo.png')} 
                  style={{ width: 35, height: 35, marginRight: 5 }}
                />
                <StyledText className="text-xl font-bold ml-2 text-gray-800">MapYourWorld</StyledText>
              </View>
            ),
            headerRight: () => <HamburgerMenu />,
          }} 
        />
        <Stack.Screen 
          name="CollaborativeMapListScreen" 
          component={CollaborativeMapListScreen}
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
          component={SubscriptionScreenWrapper}
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
  );
};

// Componente App que envuelve todo con el proveedor de autenticación
// TODO: VOLVER A CAMBIAR
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