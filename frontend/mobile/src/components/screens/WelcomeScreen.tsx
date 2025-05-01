import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../UI/Button';
import { styles as globalStyles } from '../../assets/styles/styles';
import CookieBanner from '../UI/CookieBanner';

// Definir el tipo para la navegación
type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Map: undefined;
  ForgotPassword: undefined;
  AdvertisementForm: undefined;
};

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  
  const handleRegisterPress = () => {
    navigation.navigate('Register');
  };
  
  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const handleAdvertisementFormPress = () => {
    navigation.navigate('AdvertisementForm');
  };
  
  return (
    <ImageBackground
      source={require('../../assets/images/login_background.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={globalStyles.semi_transparent_overlay} />
      <View style={styles.container}>
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              <Text style={styles.titleMain}>Transforma{'\n'}tus </Text>
              <Text style={styles.titleHighlight}>viajes</Text>
            </Text>
            
            <Text style={styles.description}>
              Descubre una nueva forma de viajar con nuestra plataforma de 
              geolocalización gamificada. Registra tus aventuras, completa retos y 
              conecta con otros viajeros.
            </Text>
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleRegisterPress}
              >
                <Text style={styles.primaryButtonText}>Comenzar gratis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={handleLoginPress}
              >
                <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>

            {/* Advertisment form */}
            <TouchableOpacity 
                style={styles.tertiaryButton}
                onPress={handleAdvertisementFormPress}
              >
                <Text style={styles.tertiaryButtonText}>Publicítate con nosotros</Text>
              </TouchableOpacity>
          </View>
        </View>
        {/* Versión 2.0 */}
        <Text style={styles.versionText}>Versión 2.0</Text>
      </View>

      {/* Banner de cookies */}
      <CookieBanner />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 50,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e293b',
    textAlign: 'center',
  },
  titleMain: {
    color: '#1e293b',
  },
  titleHighlight: {
    color: '#14b8a6',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 10,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#14b8a6',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  tertiaryButton: {
    marginTop: 12,
    backgroundColor: 'white',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  tertiaryButtonText: {
    color: '#334155',
    fontSize: 14,
  }
});

export default WelcomeScreen; 