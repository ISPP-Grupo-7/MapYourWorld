import React, { useState } from 'react';
import { View, Text, ScrollView, ImageBackground, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Button from '../UI/Button';
import TextInput from '../UI/TextInput';
import { styles as globalStyles } from '../../assets/styles/styles';
import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext'; // Ajusta la ruta según tu proyecto
import { Ionicons } from '@expo/vector-icons';
import TermsAndConditions from '../UI/TermsAndConditions';

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
    acceptTerms: false,
  });
  const [errors, setErrors] = useState({
    email: '',
    username:'',
    lastName:'',
    firstName:'',
    picture:'',
    password: '',
    acceptTerms: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsAlreadyRead, setTermsAlreadyRead] = useState(false);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field as keyof typeof errors]) {
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
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debes leer y aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return { isValid, needsTermsAcceptance: !formData.acceptTerms && isValid };
  };

  const { signUp } = useAuth();
  const handleRegister = async () => {
    const { isValid, needsTermsAcceptance } = validateForm();
    
    // Si todo está bien pero falta aceptar términos, mostramos el modal
    if (needsTermsAcceptance) {
      setTermsModalVisible(true);
      return;
    }
    
    // Si no es válido, detenemos el proceso
    if (!isValid) return;

    setIsLoading(true);

    try {
      // Llamada al método signUp del AuthContext
      // signUp solo recibe (username, email, password) según tu implementación,
      // por lo que se ignoran los demás campos o podrías modificar signUp para incluirlos.
      const success = await signUp(formData);
      
      if (!success) {
        throw new Error('No se pudo registrar el usuario. Verifica los datos o intenta nuevamente.');
      }
      
      // Registro exitoso, navegamos a la pantalla principal
      navigation.navigate('Map');
    } catch (error: unknown) {
      console.error('Error al registrarse:', error);

      let errorMessage: string = 'Ocurrió un error inesperado';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }

    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const openTermsModal = () => {
    setTermsModalVisible(true);
  };

  const closeTermsModal = () => {
    setTermsModalVisible(false);
  };

  const acceptTerms = () => {
    handleChange('acceptTerms', true);
    setTermsAlreadyRead(true);
    closeTermsModal();
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
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              autoCapitalize="words"
              error={errors.firstName}
              icon="user"
            />
            <TextInput
              label="Apellidos"
              placeholder="Apellidos"
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              autoCapitalize="words"
              error={errors.lastName}
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
              label="URL avatar"
              placeholder="URL avatar"
              value={formData.picture}
              onChangeText={(text) => handleChange('picture', text)}
              autoCapitalize="words"
              error={errors.picture}
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

            {/* Botón para términos y condiciones en lugar de checkbox */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Para registrarte, debes leer y aceptar{' '}
              </Text>
              <TouchableOpacity onPress={openTermsModal}>
                <Text style={styles.termsLink}>
                  los términos y condiciones
                </Text>
              </TouchableOpacity>
            </View>
            {errors.acceptTerms ? (
              <Text style={styles.errorText}>{errors.acceptTerms}</Text>
            ) : null}

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

      {/* Modal de términos y condiciones */}
      <TermsAndConditions 
        isVisible={termsModalVisible}
        onClose={closeTermsModal}
        onAccept={acceptTerms}
        alreadyRead={termsAlreadyRead}
      />
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
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  termsText: {
    color: '#64748b',
  },
  termsLink: {
    color: '#14b8a6',
    fontWeight: '500',
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 12,
    marginTop: 2,
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