import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../UI/Button';
import TextInput from '../UI/TextInput';
import { styles as globalStyles } from '../../assets/styles/styles';
import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    lastname:'',
    firstname:'',
    picture:'',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    username:'',
    lastname:'',
    firstname:'',
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
    if (!formData.firstname.trim()) {
      newErrors.firstname = 'El nombre es obligatorio';
      isValid = false;
    }
    if (!formData.lastname.trim()) {
      newErrors.lastname = 'El apellido es obligatorio';
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
    

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data?.message || 'Error desconocido al registrarse';
            throw new Error(errorMessage);

        }
        

        // Registro exitoso
        navigation.navigate('Map');
    } catch (error: unknown) {
        console.error('Error al registrarse:', error);

        let errorMessage: string = 'Ocurrió un error inesperado'; // Declaramos explícitamente el tipo

        // Verificar si el error es una instancia de Error
        if (error instanceof Error) {
            errorMessage = error.message;
        } 
        // Verificar si el error es un objeto con una propiedad `message`
        else if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = (error as { message: string }).message;
        }

        // Mostrar el error al usuario
        Alert.alert('Registro fallido', errorMessage);
    } finally {
        setIsLoading(false);
    }
};






  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground
      source={require('../../assets/images/login_background.webp')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={globalStyles.semi_transparent_overlay} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          {/* Formulario */}
          <View style={styles.formContainer}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
              <Text style={styles.appName}>MapYourWorld</Text>
            </View>
            
            <Text style={styles.title}>
              Crea tu cuenta
            </Text>
            <Text style={styles.subtitle}>
              Comienza a documentar tus aventuras hoy mismo
            </Text>


            <TextInput
              label="Nombre"
              placeholder="Nombre"
              value={formData.firstname}
              onChangeText={(text) => handleChange('firstname', text)}
              autoCapitalize="words"
              error={errors.firstname}
              icon="user"
            />
            <TextInput
              label="Apellidos"
              placeholder="Apellidos"
              value={formData.lastname}
              onChangeText={(text) => handleChange('lastname', text)}
              autoCapitalize="words"
              error={errors.lastname}
              icon="user"
            />

            <TextInput
              label="Nombre usuario"
              placeholder="Nombre usuario"
              value={formData.username}
              onChangeText={(text) => handleChange('username', text)}
              autoCapitalize="words"
              error={errors.username}
              icon="user"
            />
            

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

            <Button 
              title="Registrarse" 
              onPress={handleRegister}
              isLoading={isLoading}
              fullWidth
              className="mt-4 mb-3"
            />

            <View style={styles.loginPromptContainer}>
              <Text style={styles.loginPromptText}>
                ¿Ya tienes una cuenta?{' '}
              </Text>
              <Text 
                style={styles.loginLink}
                onPress={goToLogin}
              >
                Inicia sesión
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 35, 
    height: 35,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginPromptText: {
    color: '#64748b',
  },
  loginLink: {
    color: '#14b8a6',
    fontWeight: '500',
  },
});

export default RegisterScreen; 