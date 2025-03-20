import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, StyleSheet, Image, Alert, Platform } from 'react-native';
import { styled } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '@components/UI/Button';
import TextInput from '@components/UI/TextInput';
import {styles} from '@assets/styles/styles';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../navigation/types';

// Importar CSS solo en entorno web
if (Platform.OS === 'web') {
  require ('../../assets/styles/web.css')
  require ('../../assets/styles/auth.css')
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

// Constantes para colores de la aplicación
const APP_TEAL = '#2bbbad';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn, testModeSignIn } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Introduce un correo electrónico válido';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Usar el contexto de autenticación para iniciar sesión
      const success = await signIn(formData.email, formData.password);
      
      if (success) {
        // Si el inicio de sesión fue exitoso, navegar a la pantalla principal
        navigation.navigate('Map');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestMode = async () => {
    setIsLoading(true);
    try {
      // Utilizar el modo de prueba
      await testModeSignIn();
      navigation.navigate('Map');
    } catch (error) {
      console.error('Error al activar modo de prueba:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    // Navegar a la pantalla de recuperación de contraseña
    navigation.navigate('ForgotPassword');
  };

  // Estilos CSS personalizados para los campos de entrada
  const customInputStyles = `
    .input-container input {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 15px;
      font-size: 16px;
      transition: border-color 0.2s;
      height: 44px;
      box-sizing: border-box;
    }
    
    .input-container input:focus {
      border-color: ${APP_TEAL};
      outline: none;
    }
    
    .input-container {
      margin-bottom: 20px;
    }

    button {
      box-sizing: border-box;
      height: 44px;
    }
  `;

  return (
    <ImageBackground
      source={require("../../assets/images/login_background.webp")} 
      style={styles.background_image}
      resizeMode="cover"
      className='image-background'
    >
      <View style={styles.semi_transparent_overlay} />
      <StyledScrollView className="flex-1 base-container">
        <StyledView className="flex-1 justify-center items-center min-h-screen">
          <style dangerouslySetInnerHTML={{ __html: customInputStyles }} />
          <div style={{ 
            backgroundColor: 'white', 
            padding: 40,
            borderRadius: 12, 
            width: '410px',
            maxWidth: '410px', 
            margin: '0 auto',
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image source={require('../../assets/images/logo.png')} style={{ width: 40, height: 40 }} />
                <StyledText style={{ fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: '#333' }}>
                  MapYourWorld
                </StyledText>
              </div>
              <StyledText style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 30, marginBottom: 8, textAlign: 'center' }}>
                Bienvenido de nuevo
              </StyledText>
              <StyledText style={{ fontSize: 15, color: '#666', textAlign: 'center' }}>
                Inicia sesión para continuar tu aventura
              </StyledText>
            </div>
            
            <div style={{ width: '100%', marginBottom: 20 }}>
              <div className="input-container" style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                  Correo electrónico
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    style={{ 
                      width: '100%',
                      paddingLeft: '35px',
                      paddingRight: '10px',
                      height: '44px',
                      borderColor: errors.email ? '#e53e3e' : undefined
                    }}
                  />
                </div>
                {errors.email && (
                  <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                    {errors.email}
                  </div>
                )}
              </div>
              
              <div className="input-container" style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                  Contraseña
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    style={{ 
                      width: '100%',
                      paddingLeft: '35px',
                      paddingRight: '10px',
                      height: '44px',
                      borderColor: errors.password ? '#e53e3e' : undefined
                    }}
                  />
                </div>
                {errors.password && (
                  <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                    {errors.password}
                  </div>
                )}
              </div>
              
              <div style={{ textAlign: 'right', marginBottom: 25 }}>
                <a 
                  onClick={handleForgotPassword}
                  style={{ 
                    color: APP_TEAL, 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
            
            <div style={{ width: '100%' }}>
              <button 
                onClick={handleLogin}
                style={{
                  width: '100%',
                  backgroundColor: APP_TEAL,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  height: '44px',
                  transition: 'background-color 0.2s'
                }}
              >
                {isLoading ? 'Cargando...' : 'Iniciar sesión'}
              </button>
              
              <button 
                onClick={handleTestMode}
                style={{
                  width: '100%',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '12px 0',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  height: '44px',
                  transition: 'background-color 0.2s'
                }}
              >
                Entrar en Modo Prueba
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 15 }}>
                <div style={{ color: '#666', fontSize: '15px' }}>
                  ¿No tienes una cuenta?{' '}
                </div>
                <a 
                  onClick={goToRegister}
                  style={{ 
                    color: APP_TEAL, 
                    marginLeft: '5px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    textDecoration: 'none'
                  }}
                >
                  Regístrate
                </a>
              </div>
            </div>
          </div>
        </StyledView>
      </StyledScrollView>
    </ImageBackground>
  );
};

export default LoginScreen; 