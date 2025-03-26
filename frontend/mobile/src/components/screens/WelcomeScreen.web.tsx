import React from 'react';
import { View, Text, ImageBackground, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
    <View style={webStyles.root}>
      <ImageBackground
        source={require('../../assets/images/login_background.webp')}
        style={webStyles.background}
        resizeMode="cover"
      >
        <View style={globalStyles.semi_transparent_overlay} />
        <View style={webStyles.container}>
          {/* Content */}
          <View style={webStyles.content}>
            <View style={webStyles.contentContainer}>
              <Text style={webStyles.title}>
                <Text style={webStyles.titleMain}>Transforma{'\n'}tus </Text>
                <Text style={webStyles.titleHighlight}>viajes</Text>
              </Text>
              
              <Text style={webStyles.description}>
                Descubre una nueva forma de viajar con nuestra plataforma de 
                geolocalización gamificada. Registra tus aventuras, completa retos y 
                conecta con otros viajeros.
              </Text>
              
              {/* Buttons */}
              <View style={webStyles.buttonContainer}>
                <TouchableOpacity 
                  style={webStyles.primaryButton}
                  onPress={handleRegisterPress}
                >
                  <Text style={webStyles.primaryButtonText}>Comenzar gratis</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={webStyles.secondaryButton}
                  onPress={handleLoginPress}
                >
                  <Text style={webStyles.secondaryButtonText}>Iniciar sesión</Text>
                </TouchableOpacity>

                {/* Advertisment form */}
                <TouchableOpacity 
                    style={webStyles.tertiaryButton}
                    onPress={handleAdvertisementFormPress}
                >
                  <Text style={webStyles.tertiaryButtonText}>Publicítate con nosotros</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          {/* Versión 2.0 */}
          <Text style={webStyles.versionText}>Versión 2.0</Text>
        </View>

        {/* Banner de cookies */}
        <CookieBanner />
      </ImageBackground>
    </View>
  );
};

const webStyles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
    maxWidth: 500,
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
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
    marginTop: 10,
    opacity: 0.7
  },
  tertiaryButton: {
    marginTop: 5,
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