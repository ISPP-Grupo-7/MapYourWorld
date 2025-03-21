/**
 * Servicio de autenticación
 * Implementa la lógica de negocio para registro, login y verificación de usuarios
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Role, User } from '../models/user.model';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { generateToken, verifyToken } from '../../../../shared/config/jwt.config';
import { AuthRepository } from '../repositories/auth.repository';
import { UserProfileRepository } from '../../../user-service/src/repositories/userProfile.repository';
import { UserProfile } from '../../../user-service/src/models/userProfile.model';
import { createMap } from '../../../map-service/src/services/map.service';
import { createDistricts } from '../../../map-service/src/services/district.service';
import MapRepository from '../../../map-service/src/repositories/map.repository';

const repo = new AuthRepository();
const profileRepo = new UserProfileRepository()
const mapRepo = new MapRepository();


export const getUserById = async (userId: string): Promise<User | null> => {
  return await repo.findById(userId);
};

/**
 * Registra un nuevo usuario en el sistema
 * @param userData Datos del usuario a registrar
 */
export const registerUser = async (userData: any): Promise<User> => {
  try {
    // 1. Validar datos de entrada
    if (!userData.email || !userData.password || !userData.username || !userData.firstName || !userData.lastName) {
      throw new Error('Faltan campos requeridos');
    }

    // 2. Verificar que el email no existe en la base de datos
    const existingUser = await repo.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('El usuario ya existe con este email');
    }

    // 3. Crear el perfil de usuario
    const newProfile = new UserProfile();
    newProfile.username = userData.username;
    newProfile.firstName = userData.firstName;
    newProfile.lastName = userData.lastName;
    newProfile.picture = userData.picture || '';
    const savedProfile = await profileRepo.create(newProfile);

    // 4. Crear el usuario con el perfil asociado
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = new User();
    newUser.email = userData.email;
    newUser.role = userData.role || Role.USER;
    newUser.password = hashedPassword;
    newUser.is_active = true; // Activamos la cuenta automáticamente (podría cambiarse si se requiere verificación)
    newUser.profile = savedProfile;


    
    // Guardar el usuario en la base de datos
    let savedUser = await repo.save(newUser);

    const token = generateToken({
      userId: newUser.id.toString(),
      email: newUser.email
    });
    
    savedUser.token_data = token;
    savedUser = await repo.save(savedUser);
    
    // 5. Crear mapa y distritos para el usuario
    try {
      const newMap = await createMap(savedUser.id);
      if (newMap) {
        const savedMap = await mapRepo.getMapById(newMap.id);
        await createDistricts(savedMap.id);
      }
    } catch (mapError) {
      console.error('Error al crear mapa o distritos:', mapError);
      // No fallamos el registro si el mapa no se puede crear
    }

    return savedUser;
  } catch (error) {
    console.error('Error en registerUser:', error);
    if (error instanceof Error) {
      throw error; // Retransmitir errores conocidos
    }
    throw new Error('Error al registrar el usuario');
  }
};

/**
 * Autentica a un usuario con email y contraseña
 * @param email Email del usuario
 * @param password Contraseña del usuario
 */
export const loginUser = async (email: string, password: string): Promise<{ user: User, token: string }> => {
  try {
    // 1. Buscar usuario por email
    const user = await repo.findWithPassword(email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Credenciales incorrectas');
    }

    // 3. Verificar que la cuenta esté activa
    if (!user.is_active) {
      throw new Error('La cuenta no está activada');
    }

    // 4. Generar token JWT
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email
    });
    
    // 5. Guardar el token en el campo token_data
    user.token_data = token;
    await repo.save(user);
    
    // 6. Devolver usuario y token (sin contraseña)
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword as User, token };
  } catch (error) {
    console.error('Error en loginUser:', error);
    if (error instanceof Error) {
      throw error; // Retransmitir errores conocidos
    }
    throw new Error('Error al iniciar sesión');
  }
};

/**
 * Verifica un token JWT
 * @param token Token JWT a verificar
 */
export const verifyUserToken = async (token: string): Promise<{
  userId: string;
  email: string;
  role: Role;
}> => {
  try {
    // 1. Verificar firma y expiración del token
    const decoded = verifyToken(token);
    if (!decoded) {
      throw new Error('Token inválido o expirado');
    }
    
    // 2. Obtener información actualizada del usuario
    const user = await repo.findById(decoded.userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // 3. Verificar que el token está en token_data
    if (user.token_data !== token) {
      throw new Error('Sesión inválida. Por favor, inicie sesión nuevamente');
    }
    
    return {
      userId: user.id.toString(),
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('Error en verifyUserToken:', error);
    if (error instanceof Error) {
      throw error; // Retransmitir errores conocidos
    }
    throw new Error('Error al verificar token');
  }
};

/**
 * Cambia la contraseña de un usuario
 * @param userId ID del usuario
 * @param currentPassword Contraseña actual
 * @param newPassword Nueva contraseña
 */
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  try {
    // 1. Buscar usuario por ID
    const user = await repo.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // 2. Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }
    
    // 3. Validar nueva contraseña
    if (newPassword.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new Error('La nueva contraseña debe contener al menos una mayúscula y un número');
    }
    
    // 4. Actualizar contraseña y guardar
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await repo.updatePassword(user.id, hashedPassword);
    
    // 5. Invalidar todas las sesiones existentes por seguridad
    user.token_data = "";
    await repo.save(user);
    
    return true;
  } catch (error) {
    console.error('Error en changePassword:', error);
    if (error instanceof Error) {
      throw error; // Retransmitir errores conocidos
    }
    throw new Error('Error al cambiar la contraseña');
  }
};

/**
 * Inicia el proceso de recuperación de contraseña
 * @param email Email del usuario
 */
export const requestPasswordReset = async (email: string): Promise<boolean> => {
  try {
    // 1. Buscar usuario por email
    const user = await repo.findByEmail(email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    // 2. Generar token único y temporal
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 3. Almacenar el token en token_data
    const tokenData = {
      resetPassword: {
        token: resetToken,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString() // 1 hora de validez
      }
    };
    
    user.token_data = JSON.stringify(tokenData);
    await repo.save(user);
    
    // 4. Enviar email con instrucciones
    await sendPasswordResetEmail(user.email, user.profile?.username || '', resetToken);
    
    return true;
  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    if (error instanceof Error) {
      throw error; // Retransmitir errores conocidos
    }
    throw new Error('Error al procesar la solicitud de recuperación de contraseña');
  }
};

/**
 * Restablece la contraseña usando un token
 * @param token Token de recuperación
 * @param newPassword Nueva contraseña
 * @returns true si el restablecimiento fue exitoso
 */
export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  try {
    if (!token || !newPassword) {
      throw new Error('Token y nueva contraseña son requeridos');
    }
    
    // 1. Validar la nueva contraseña
    if (newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      throw new Error('La contraseña debe contener al menos una mayúscula y un número');
    }
    
    // 2. Buscar usuario por token
    const users = await repo.findAll();
    let targetUser: User | null = null;
    
    for (const user of users) {
      if (!user.token_data) continue;
      
      try {
        const tokenData = JSON.parse(user.token_data);
        if (
          tokenData.resetPassword &&
          tokenData.resetPassword.token === token &&
          new Date(tokenData.resetPassword.expiresAt) > new Date()
        ) {
          targetUser = user;
          break;
        }
      } catch (e) {
        // Ignora errores de formato JSON
        continue;
      }
    }
    
    if (!targetUser) {
      throw new Error('Token inválido o expirado');
    }
    
    // 3. Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await repo.updatePassword(targetUser.id, hashedPassword);
    
    // 4. Limpiar token
    targetUser.token_data = '';
    await repo.save(targetUser);
    
    return true;
  } catch (error) {
    console.error('Error en resetPassword:', error);
    if (error instanceof Error) {
      throw error; // Retransmitir errores conocidos
    }
    throw new Error('Error al restablecer la contraseña');
  }
};

/**
 * Cierra la sesión de un usuario
 * @param userId ID del usuario
 * @param token Token específico a invalidar (opcional)
 */
export const logout = async (userId: string, token?: string): Promise<boolean> => {
  try {
    const user = await repo.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    if (token && user.token_data === token) {
      // Si se especifica un token y coincide con el almacenado, lo eliminamos
      user.token_data = '';
      await repo.save(user);
    } else if (!token) {
      // Si no se especifica token, invalidamos todas las sesiones
      user.token_data = '';
      await repo.save(user);
    } else {
      // Si el token no coincide, no hacemos nada
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error en logout:', error);
    if (error instanceof Error) {
      throw error; // Retransmitir errores conocidos
    }
    throw new Error('Error al cerrar sesión');
  }
};