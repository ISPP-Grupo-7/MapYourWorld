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
import CollaborativeMapScreenWeb from './src/components/Map/CollaborativeMapScreen.web';
import CollaborativeMapListScreen from './src/components/Map/CollaborativeMapListScreen';
import HamburgerMenu from '@/components/UI/HamburgerMenu';
import { RootStackParamList } from './src/navigation/types';
import { AuthProvider } from './src/contexts/AuthContext';

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

// Pantalla temporal para recuperar contraseña
const ForgotPasswordScreen = () => (
  <FallbackScreen 
    title="Recuperar Contraseña" 
    message="Esta funcionalidad está en desarrollo" 
  />
);

// Usamos la definición de tipos de navegación centralizada
const Stack = createNativeStackNavigator<RootStackParamList>();

// Definimos un wrapper para MapScreen que incluye los distritos de ejemplo
const MapScreenWithDistritos = (props: any) => <MapScreen {...props} />;

// Definimos un wrapper para CollaborativeMapScreen que incluye los parámetros de ejemplo
const CollaborativeMapScreenWithParams = (props: any) => {
  // Obtenemos el mapId y userId de los parámetros de navegación
  const mapId = props.route?.params?.mapId || "map-123";
  const userId = props.route?.params?.userId || "user-456";
  
  // Usar la versión web cuando estamos en navegador
  if (Platform.OS === 'web') {
    return <CollaborativeMapScreenWeb mapId={mapId} userId={userId} />;
  } else {
    return <CollaborativeMapScreen mapId={mapId} userId={userId} />;
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
          component={ForgotPasswordScreen}
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