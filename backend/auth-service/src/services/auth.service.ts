/**
 * Servicio de autenticación
 * Implementa la lógica de negocio para registro, login y verificación de usuarios
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Role, User } from '@backend/auth-service/src/models/user.model';
import { sendVerificationEmail,sendPasswordResetEmail } from '@backend/auth-service/src/services/email.service';
import { generateToken,verifyToken} from '@shared/config/jwt.config';
import { AuthRepository } from '@backend/auth-service/src/repositories/auth.repository';

const repo = new AuthRepository();

/**
 * Registra un nuevo usuario en el sistema
 * @param userData Datos del usuario a registrar
 */
export const registerUser = async (userData: any): Promise<User> => {
  // 1. Validar datos de entrada
  if (!userData.email || !userData.password) {
    throw new Error('Faltan campos requeridos');
  }

  // 2. Verificar que el email no existe en la base de datos
  const existingUser = await repo.findByEmail(userData.email);
  if (existingUser) {
    throw new Error('El usuario ya existe con este email');
  }

  // 3. Crear el usuario en la base de datos
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Creamos el usuario con las propiedades adecuadas según el modelo
  const newUser = new User();
  newUser.email = userData.email;
  newUser.role = Role.USER;
  newUser.password = hashedPassword;
    
  await repo.save(newUser);
  const verificationToken = crypto.randomBytes(32).toString('hex'); 
  await sendVerificationEmail(newUser.email, userData.profile?.username || '', verificationToken);

  return newUser;
};

/**
 * Autentica a un usuario con email y contraseña
 * @param email Email del usuario
 * @param password Contraseña del usuario
 */
export const loginUser = async (email: string, password: string): Promise<{user: User, token: string}> => {
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

  // 3. Generar token JWT
  const token = generateToken({
    userId: user.id.toString(),
    email: user.email
  });

  // 6. Devolver usuario y token, quitando la contraseña en la respuesta para seguridad
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as User, token };
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
  // 1. Verificar firma y expiración del token
  const decoded = verifyToken(token);
  if(!decoded) {
    throw new Error('Token inválido o expirado');
  } 
  // 2. Obtener información actualizada del usuario
  const user = await repo.findById(decoded.userId);
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return {
    userId: user.id.toString(),
    email: user.email,
    role: user.role
  };
};

/**
 * Cambia la contraseña de un usuario
 * @param userId ID del usuario
 * @param currentPassword Contraseña actual
 * @param newPassword Nueva contraseña
 */
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<boolean> => {
  // 1. Buscar usuario por ID
  const user = await repo.findById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  // 2. Verificar contraseña actual
  const correctPassword= await bcrypt.compare(currentPassword, user.password);
  if (!correctPassword) {
    throw new Error('Credenciales incorrectas');
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
  return true;
};

/**
 * Inicia el proceso de recuperación de contraseña
 * @param email Email del usuario
 */
export const requestPasswordReset = async (email: string): Promise<boolean> => {
  // 1. Buscar usuario por email
  const user = await repo.findByEmail(email);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  // 2. Generar token único y temporal
  const token = crypto.randomBytes(32).toString('hex');
  user.password = await bcrypt.hash(token + user.id.toString(), 10);
  await repo.save(user);
  
  // 4. Enviar email con instrucciones
  // Pasamos el usuario
  await sendPasswordResetEmail(user.email, user.profile?.username || '', token);
  
  return true;
}; 

/**
 * Restablece la contraseña usando un token
 * @param token Token de recuperación
 * @param newPassword Nueva contraseña
 * @returns true si el restablecimiento fue exitoso
 */
export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  if (!token || !newPassword) {
    throw new Error('Token y nueva contraseña son requeridos');
  }

  // Validar la nueva contraseña
  if (newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
  }
  if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new Error('La nueva contraseña debe contener al menos una mayúscula y un número');
  }
  
  // Buscar usuario por token (buscar entre todos los usuarios para encontrar el que coincide)
  const users = await repo.findAll(); 
  
  // La verificación depende de cómo almacenaste el token en requestPasswordReset
  let matchedUser: User | null = null;
  
  for (const user of users) {
    // Intentar verificar si este usuario corresponde al token
    try {
      const tokenMatch = await bcrypt.compare(token + user.id.toString(), user.password);
      if (tokenMatch) {
        matchedUser = user;
        break;
      }
    } catch (error) {
      continue;
    }
  }
  
  if (!matchedUser) {
    throw new Error('Token inválido o expirado');
  }
  // Actualizar la contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await repo.updatePassword(matchedUser.id, hashedPassword);
 
  return true;
};