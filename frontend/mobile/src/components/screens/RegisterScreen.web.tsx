import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, StyleSheet, Image, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '@components/UI/Button';
import TextInput from '@components/UI/TextInput';
import {styles} from '@assets/styles/styles';
import { API_URL } from '@constants/config';
require ('@assets/styles/web.css')
require ('@assets/styles/auth.css')
import { useAuth } from '../../contexts/AuthContext'; // Ajusta la ruta según tu proyecto


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

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  
  const [formData, setFormData] = useState({
    email: '',
    username:'',
    lastName:'',
    firstName:'',
    picture:'',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    username:'',
    lastName:'',
    firstName:'',
    picture:'',
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

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es obligatorio';
      isValid = false;
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es obligatorio';
      isValid = false;
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es obligatorio';
      isValid = false;
    }

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      isValid = false;
    } else if (!/[A-Z]/.test(formData.password)) { // Al menos 1 letra mayúscula
      newErrors.password = 'La contraseña debe contener al menos una letra mayúscula';
      isValid = false;
    } else if (!/[a-z]/.test(formData.password)) { // Al menos 1 letra minúscula
      newErrors.password = 'La contraseña debe contener al menos una letra minúscula';
      isValid = false;
    } else if (!/[0-9]/.test(formData.password)) { // Al menos 1 número
      newErrors.password = 'La contraseña debe contener al menos un número';
      isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) { // Al menos 1 carácter especial
      newErrors.password = 'La contraseña debe contener al menos un carácter especial';
      isValid = false;
    }
    
    const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+[/#?]?.*$/;

    if (formData.picture && !urlRegex.test(formData.picture.trim())) {
      newErrors.picture = 'Debe ser una URL válida';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

    const { signUp } = useAuth();
    const handleRegister = async () => {
      if (!validateForm()) return;
    
      setIsLoading(true);
    
      try {
        const success = await signUp(formData);
    
        if (!success) {
          throw new Error('No se pudo registrar el usuario. Verifica los datos o intenta nuevamente.');
        }
    
        // Registro exitoso
        navigation.navigate('Map');
      } catch (error: unknown) {
        console.error('Error al registrarse:', error);
    
        // Si el error es una instancia de Error, usamos su mensaje
        let errorMessage: string = 'Ocurrió un error inesperado';
    
        if (error instanceof Error) {
          // Si el error es un objeto Error, usamos el mensaje directamente
          errorMessage = error.message;
        }
    
        // Mostrar el mensaje de error específico
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
                Crea tu cuenta
              </StyledText>
              <StyledText style={{ fontSize: 15, color: '#666', textAlign: 'center' }}>
                Comienza a documentar tus aventuras hoy mismo
              </StyledText>
            </div>
            
            <div style={{ width: '100%', marginBottom: 20 }}>
                  {/* Nombre */}
                  <div className="input-container" style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                      Nombre
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        style={{ 
                          width: '100%',
                          paddingLeft: '35px',
                          paddingRight: '10px',
                          height: '44px',
                          borderColor: errors.firstName ? '#e53e3e' : undefined
                        }}
                      />
                    </div>
                    {errors.firstName && (
                      <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                        {errors.firstName}
                      </div>
                    )}
                  </div>

                  {/* Apellidos */}
                  <div className="input-container" style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                      Apellidos
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Apellidos"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        style={{ 
                          width: '100%',
                          paddingLeft: '35px',
                          paddingRight: '10px',
                          height: '44px',
                          borderColor: errors.lastName ? '#e53e3e' : undefined
                        }}
                      />
                    </div>
                    {errors.lastName && (
                      <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                        {errors.lastName}
                      </div>
                    )}
                  </div>

                  {/* Nombre de usuario */}
                  <div className="input-container" style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                      Nombre usuario
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre usuario"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        style={{ 
                          width: '100%',
                          paddingLeft: '35px',
                          paddingRight: '10px',
                          height: '44px',
                          borderColor: errors.username ? '#e53e3e' : undefined
                        }}
                      />
                    </div>
                    {errors.username && (
                      <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                        {errors.username}
                      </div>
                    )}
                  </div>

                  {/*URL de avatar */}
                  <div className="input-container" style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                      URL de avatar
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="URL de avatar"
                        value={formData.picture}
                        onChange={(e) => handleChange('picture', e.target.value)}
                        style={{ 
                          width: '100%',
                          paddingLeft: '35px',
                          paddingRight: '10px',
                          height: '44px',
                          borderColor: errors.picture ? '#e53e3e' : undefined
                        }}
                      />
                    </div>
                    {errors.picture && (
                      <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                        {errors.picture}
                      </div>
                    )}
                  </div>

                  {/* Correo electrónico */}
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

                  {/* Contraseña */}
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
</div>

            
            <div style={{ width: '100%' }}>
              <button 
                onClick={handleRegister}
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
                {isLoading ? 'Cargando...' : 'Registrarse'}
              </button>
              
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 15 }}>
                <div style={{ color: '#666', fontSize: '15px' }}>
                  ¿Ya tienes una cuenta?{' '}
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

export default RegisterScreen; 