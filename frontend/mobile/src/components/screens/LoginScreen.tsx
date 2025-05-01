import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, StyleSheet, Image, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '@components/UI/Button';
import TextInput from '@components/UI/TextInput';
import {styles} from '@assets/styles/styles';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';


const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

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
      const success = await signIn(formData.email, formData.password);
      
      if (success) {
        // Recuperar el usuario actualizado desde AsyncStorage
        const storedUser = await AsyncStorage.getItem('@MapYourWorld:user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  
        console.log('Rol del usuario:', parsedUser?.role);
  
        if (parsedUser?.role === 'ADMIN') {
          navigation.navigate('DashboardAdmin');
        } else {
          navigation.navigate('Map');
        }
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

  return (
    <ImageBackground
      source={require("../../assets/images/login_background.webp")} 
      style={styles.background_image}
      resizeMode="cover"
    >
      <View style={styles.semi_transparent_overlay} />
      <StyledScrollView className="flex-1">
        <StyledView className="flex-1 p-6 justify-start min-h-screen mt-20">
          <StyledView className="bg-white p-6 rounded-lg w-full shadow-md">
          <StyledView className="flex-row items-center justify-center mb-6">
            <Image source={require('../../assets/images/logo.png')} style={{ width: 35, height: 35 }} />
            <StyledText className="text-xl font-bold ml-2 text-gray-800">MapYourWorld</StyledText>
          </StyledView>
            <StyledText className="text-2xl font-bold text-center mb-2">
              Bienvenido de nuevo
            </StyledText>
            <StyledText className="text-gray-600 text-center mb-6">
              Inicia sesión para continuar tu aventura
            </StyledText>
            
            <TextInput
              label="Correo electrónico"
              placeholder="Correo electrónico"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              error={errors.email}
              icon="mail"
            />
            
            <TextInput
              label="Contraseña"
              placeholder="Contraseña"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
              error={errors.password}
              icon="lock"
            />
            
            <StyledText 
              className="text-teal-500 text-right mb-4"
              onPress={handleForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </StyledText>
            
            <Button 
              title="Iniciar sesión" 
              onPress={handleLogin}
              isLoading={isLoading}
              fullWidth
              className="mb-3"
            />
            
            <StyledView className="flex-row justify-center mt-4">
              <StyledText className="text-gray-600">
                ¿No tienes una cuenta?{' '}
              </StyledText>
              <StyledText 
                className="text-teal-500 font-medium"
                onPress={goToRegister}
              >
                Regístrate
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledScrollView>
    </ImageBackground>
  );
};

export default LoginScreen; 