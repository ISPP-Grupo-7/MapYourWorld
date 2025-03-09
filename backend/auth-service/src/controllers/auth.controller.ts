/**
 * Controladores para el servicio de autenticación
 */

import { Request, Response } from 'express';
import { User, Role } from '@backend/auth-service/src/models/user.model';
import { validationResult } from 'express-validator';
import { publishEvent } from '@shared/libs/rabbitmq';
import { generateToken, verifyToken, DecodedToken } from '@shared/config/jwt.config';
import * as authService from '@backend/auth-service/src/services/auth.service';

/**
 * Registra un nuevo usuario
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const user = await authService.registerUser({
      email,
      password,
      role: Role.USER
    });

    // Generar token JWT
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email
    });

    // Responder con éxito
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Inicia sesión con un usuario existente
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const { user, token } = await authService.loginUser(email, password);

    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Verifica un token JWT y devuelve los datos del usuario
 */
export const verify = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
      return;
    }

    // Verificar token
    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ 
        success: false, 
        message: 'Token inválido o expirado' 
      });
      return;
    }

    // Buscar usuario por ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Token válido',
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al verificar token',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}; 

/**
 * Cambia la contraseña de un usuario autenticado
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;
    
    if (!userId) {
      res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(userId, currentPassword, newPassword);

    try {
      await sendPasswordChangeNotification(authReq.user.email, authReq.user.username || '');
    } catch (emailError) {
      console.error('Error al enviar notificación de cambio de contraseña:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Contraseña cambiada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar contraseña',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Inicia el proceso de recuperación de contraseña
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email } = req.body;
    
    // Llamar al servicio para solicitar el reseteo de contraseña
    await authService.requestPasswordReset(email);

    // Respondemos con éxito siempre para no revelar si el email existe
    res.status(200).json({
      success: true,
      message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña'
    });
  } catch (error) {
    console.error('Error al solicitar reseteo de contraseña:', error);
    // Por seguridad, no revelamos el error específico al cliente
    res.status(200).json({
      success: true,
      message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña'
    });
  }
};

/**
 * Restablece la contraseña usando un token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    
    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida correctamente'
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al restablecer contraseña',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};