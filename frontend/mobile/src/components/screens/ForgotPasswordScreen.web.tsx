import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, StyleSheet, Image, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '@components/UI/Button';
import TextInput from '@components/UI/TextInput';
import {styles} from '@assets/styles/styles';
import { API_URL } from '@constants/config';
require ('../../assets/styles/web.css')
require ('../../assets/styles/auth.css')

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

// Constantes para colores de la aplicación
const APP_TEAL = '#2bbbad';

// Definir el tipo para la navegación
type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Map: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Introduce un correo electrónico válido');
      return false;
    }
    setError('');
    return true;
  };

  const handleChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Esta funcionalidad está en desarrollo, pero aquí mostramos cómo se implementaría
      // cuando el backend esté listo
      /*
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsSent(true);
      } else {
        Alert.alert('Error', data.message || 'No se pudo procesar la solicitud.');
      }
      */
      
      // Simular éxito mientras se desarrolla la funcionalidad
      setTimeout(() => {
        setIsSent(true);
      }, 1500);
      
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
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
                Recuperar Contraseña
              </StyledText>
              <StyledText style={{ fontSize: 15, color: '#666', textAlign: 'center' }}>
                {isSent 
                  ? 'Hemos enviado instrucciones a tu correo electrónico para restablecer tu contraseña.'
                  : 'Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.'
                }
              </StyledText>
              
              <div style={{ 
                marginTop: 10, 
                backgroundColor: '#fff8e1', 
                border: '1px solid #ffe57f', 
                borderRadius: '8px', 
                padding: '10px',
                textAlign: 'center',
                color: '#856404',
                width: '100%'
              }}>
                <StyledText style={{ fontSize: 14 }}>
                  Esta funcionalidad está en desarrollo
                </StyledText>
              </div>
            </div>
            
            {!isSent ? (
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
                      value={email}
                      onChange={(e) => handleChange(e.target.value)}
                      style={{ 
                        width: '100%',
                        paddingLeft: '35px',
                        paddingRight: '10px',
                        height: '44px',
                        borderColor: error ? '#e53e3e' : undefined
                      }}
                    />
                  </div>
                  {error && (
                    <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ 
                marginTop: 20, 
                marginBottom: 40,
                backgroundColor: '#e6f7ff', 
                border: '1px solid #91d5ff', 
                borderRadius: '8px', 
                padding: '15px',
                textAlign: 'center',
                color: '#0050b3'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block', marginBottom: '10px', color: '#1890ff' }}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                <div style={{ fontSize: '15px' }}>
                  Por favor, revisa tu bandeja de entrada y sigue las instrucciones enviadas. 
                  Si no encuentras el correo, revisa la carpeta de spam.
                </div>
              </div>
            )}
            
            <div style={{ width: '100%' }}>
              {!isSent ? (
                <button 
                  onClick={handleSubmit}
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
                    marginBottom: '20px',
                    height: '44px',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
              ) : (
                <button 
                  onClick={() => setIsSent(false)}
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
                    marginBottom: '20px',
                    height: '44px',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Reenviar instrucciones
                </button>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 15 }}>
                <div style={{ color: '#666', fontSize: '15px' }}>
                  ¿Recordaste tu contraseña?{' '}
                </div>
                <a 
                  onClick={goToLogin}
                  style={{ 
                    color: APP_TEAL, 
                    marginLeft: '5px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    fontSize: '15px',
                    textDecoration: 'none'
                  }}
                >
                  Iniciar sesión
                </a>
              </div>
            </div>
          </div>
        </StyledView>
      </StyledScrollView>
    </ImageBackground>
  );
};

export default ForgotPasswordScreen; 