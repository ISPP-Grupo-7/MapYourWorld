import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '../constants/config';

// Definición de tipos
interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (formData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    picture?: string;
    password: string;
  }) => Promise<boolean>;
  signOut: () => Promise<void>;
  testModeSignIn: () => Promise<void>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Hook personalizado para usar el contexto
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
}

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar el usuario almacenado en AsyncStorage al iniciar la app
  useEffect(() => {
    async function loadStoredData(): Promise<void> {
      try {
        setIsLoading(true);
        
        const storedUser = await AsyncStorage.getItem('@MapYourWorld:user');
        const storedToken = await AsyncStorage.getItem('@MapYourWorld:token');

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          console.log('Usuario cargado desde almacenamiento:', JSON.parse(storedUser));
        } else {
          console.log('No hay usuario almacenado en AsyncStorage');
        }
      } catch (error) {
        console.error('Error al cargar datos de usuario:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredData();
  }, []);

 // Iniciar sesión
  async function signIn(email: string, password: string): Promise<boolean> {
    try {
      setIsLoading(true);
      
      console.log('Intentando iniciar sesión con:', { email });
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Enviar un objeto con email y password
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      
      // Guardar los datos en AsyncStorage
      await AsyncStorage.setItem('@MapYourWorld:user', JSON.stringify(data.user));
      await AsyncStorage.setItem('@MapYourWorld:token', data.token);
      await AsyncStorage.setItem('userId', data.user.id);
      
      // Actualizar el estado con el usuario autenticado
      setUser(data.user);
      console.log('Usuario autenticado:', data.user);
      
      return true;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      window.alert(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }


  // Registrar usuario
  async function signUp(formData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    picture?: string;
    password: string;
  }): Promise<boolean> {
    try {
      setIsLoading(true);
      
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Puedes manejar aquí distintos errores de validación si tu API los envía
        throw new Error(data.message || 'Error al registrar el usuario');
      }
      
      // Guardar los datos en AsyncStorage
      await AsyncStorage.setItem('@MapYourWorld:user', JSON.stringify(data.user));
      await AsyncStorage.setItem('@MapYourWorld:token', data.token);
      await AsyncStorage.setItem('userId', data.user.id);
      
      // Actualizar el estado
      setUser(data.user);
      console.log('Usuario registrado y autenticado:', data.user);
      
      return true;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      window.alert(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  // Cerrar sesión
  async function signOut(): Promise<void> {
    try {
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem('@MapYourWorld:user');
      await AsyncStorage.removeItem('@MapYourWorld:token');
      await AsyncStorage.removeItem('userId');
      
      // Actualizar el estado
      setUser(null);
      console.log('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  
  // Función para entrar en modo de prueba
  async function testModeSignIn(): Promise<void> {
    try {
      setIsLoading(true);
      
      // Crear un usuario de prueba
      const testUser = {
        id: 'user-456',
        username: 'Usuario de Prueba',
        email: 'test@example.com',
        role: 'USER'
      };
      
      // Guardar en AsyncStorage
      await AsyncStorage.setItem('@MapYourWorld:user', JSON.stringify(testUser));
      await AsyncStorage.setItem('@MapYourWorld:token', 'test-token-123');
      await AsyncStorage.setItem('userId', testUser.id);
      
      // Actualizar el estado
      setUser(testUser);
      
      console.log('Modo de prueba activado con usuario:', testUser);
      Alert.alert(
        'Modo de Prueba Activado', 
        'Estás usando la aplicación en modo de prueba con un usuario de demostración.'
      );
    } catch (error) {
      console.error('Error al activar modo de prueba:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Valores que expone el contexto
  const contextValue: AuthContextData = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    testModeSignIn
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 