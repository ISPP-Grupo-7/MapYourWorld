import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { styled } from 'nativewind';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { styles as globalStyles } from '@assets/styles/styles';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Constantes para colores de la aplicación
const APP_TEAL = '#2bbbad';

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
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar procesar la solicitud.');
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <StyledScrollView className="flex-1 bg-white">
      <StyledView className="flex-1 p-6">
        <StyledView className="items-center mb-8">
          <StyledView className="flex-row items-center justify-center mb-2">
            <Image source={require('../../assets/images/logo.png')} style={{ width: 40, height: 40 }} />
            <StyledText className="text-2xl font-bold ml-2 text-gray-800">
              MapYourWorld
            </StyledText>
          </StyledView>
          <StyledText className="text-2xl font-bold mb-2 text-center text-gray-800">
            Recuperar Contraseña
          </StyledText>
          <StyledText className="text-base text-center text-gray-600">
            {isSent 
              ? 'Hemos enviado instrucciones a tu correo electrónico para restablecer tu contraseña.'
              : 'Introduce tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.'
            }
          </StyledText>
          
          <StyledView className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg w-full">
            <StyledText className="text-sm text-yellow-800 text-center">
              Esta funcionalidad está en desarrollo
            </StyledText>
          </StyledView>
        </StyledView>
        
        {!isSent ? (
          <StyledView className="mb-6">
            <StyledText className="mb-2 font-medium text-gray-700">Correo electrónico</StyledText>
            <StyledView className="relative">
              <StyledTextInput
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg"
                placeholder="Correo electrónico"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </StyledView>
            {error ? (
              <StyledText className="mt-1 text-red-500 text-sm">{error}</StyledText>
            ) : null}
          </StyledView>
        ) : (
          <StyledView className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <StyledText className="text-center text-blue-800 mb-2 font-medium">Información</StyledText>
            <StyledText className="text-center text-blue-800">
              Por favor, revisa tu bandeja de entrada y sigue las instrucciones enviadas. 
              Si no encuentras el correo, revisa la carpeta de spam.
            </StyledText>
          </StyledView>
        )}
        
        {!isSent ? (
          <StyledTouchableOpacity
            className={`p-3 rounded-lg mb-4 ${isLoading ? 'bg-gray-400' : 'bg-teal-500'}`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <StyledText className="text-white text-center font-bold text-lg">
              {isLoading ? 'Enviando...' : 'Enviar instrucciones'}
            </StyledText>
          </StyledTouchableOpacity>
        ) : (
          <StyledTouchableOpacity
            className="p-3 rounded-lg mb-4 bg-teal-500"
            onPress={() => setIsSent(false)}
          >
            <StyledText className="text-white text-center font-bold text-lg">
              Reenviar instrucciones
            </StyledText>
          </StyledTouchableOpacity>
        )}
        
        <StyledView className="flex-row justify-center mt-4">
          <StyledText className="text-gray-600">¿Recordaste tu contraseña? </StyledText>
          <StyledTouchableOpacity onPress={goToLogin}>
            <StyledText className="text-teal-500 font-bold">Iniciar sesión</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
      </StyledView>
    </StyledScrollView>
  );
};

export default ForgotPasswordScreen; 