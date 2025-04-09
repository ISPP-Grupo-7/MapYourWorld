/**
 * Controladores para el servicio de autenticación
 */

import { Request, Response } from 'express';
import { Role } from '../models/user.model';
import { validationResult } from 'express-validator';
import { generateToken } from '../../../../shared/config/jwt.config';
import * as authService from '../services/auth.service';
import { sendPasswordChangeNotification } from '../services/email.service';
import { AuthenticatedRequest } from '../types';

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

    const { email, password, username, firstName, lastName, picture, acceptTerms} = req.body;
    if (!acceptTerms) {
      res.status(400).json({ error: "Debes aceptar los términos y condiciones" });
      return;
    }
    const user = await authService.registerUser({
      email,
      password,
      username, firstName, lastName, picture,
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
  
    let statusCode = 500;
    let message = 'Error al registrar usuario';
  
    if (error instanceof Error) {
      message = error.message; //  Captura el mensaje exacto del service
  
      // Si el error es de validación o usuario ya existe, devolvemos un 400
      if (message === 'Faltan campos requeridos' || message === 'El usuario ya existe con este email') {
        statusCode = 400;
      }
    }
  
    res.status(statusCode).json({ 
      success: false, 
      message //  Enviamos el mensaje exacto al frontend
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

    
  }catch (error) {
    console.error('Error en login:', error);
  
    // Si el error es lanzado desde el servicio, lo devolvemos con código 400
    if (error instanceof Error) {
      res.status(400).json({
        success: false,
        message: error.message, // Ahora el frontend verá el mensaje correcto
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error desconocido en el servidor',
      });
    }
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

    // Usar el servicio para verificar el token con token_data
    const userData = await authService.verifyUserToken(token);

    // Responder con éxito
    res.status(200).json({
      success: true,
      message: 'Token válido',
      user: userData
    });

  } catch (error) {
    console.error('Error en verificación:', error);

    // Manejamos errores específicos con códigos de estado apropiados
    if (error instanceof Error) {
      if (error.message === 'Token inválido o expirado') {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
      else if (error.message === 'Usuario no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      else if (error.message === 'Sesión inválida. Por favor, inicie sesión nuevamente') {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
    }
    // Error genérico
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

    const { userId, currentPass, newPass } = req.body;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'Id de Usuario no indicado'
      });
      return;
    }
    const user = await authService.getUserById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
      return;
    }

    const currentPassword = user.password;

    // Cambiar contraseña 
    await authService.changePassword(user.id, currentPassword, newPass);

    try {
      await sendPasswordChangeNotification(user.email, user.profile.username || '');
    } catch (emailError) {
      console.error('Error al enviar notificación de cambio de contraseña:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Contraseña cambiada correctamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);

    // Manejamos errores específicos
    if (error instanceof Error) {
      if (error.message === 'Credenciales incorrectas') {
        res.status(401).json({
          success: false,
          message: error.message
        });
        return;
      }
      else if (error.message === 'Usuario no encontrado') {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
    }

    // Error genérico
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
    // Por seguridad, no revelamos el error específico
    res.status(400).json({
      success: true,
      message: 'Se produjo un error al solicitar el reseteo de contraseña'
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

/**
 * Cierra la sesión de un usuario
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    let userId = null;
    let token = null;

    // Intentar obtener datos de usuario autenticado (si existe)
    const authReq = req as AuthenticatedRequest;
    if (authReq.user?.userId) {
      userId = authReq.user.userId;
      token = authReq.token;
    }

    // Si no hay usuario autenticado, intentar obtener userId y token del cuerpo
    if (!userId) {
      userId = req.body.userId;
      token = req.body.token;
    }

    // Verificar que tenemos al menos el ID del usuario
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'Se requiere el ID de usuario'
      });
      return;
    }

    // Llamar al servicio para cerrar sesión
    const result = await authService.logout(userId, token);

    if (result) {
      res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No se pudo cerrar la sesión'
      });
    }
  } catch (error) {
    console.error('Error en logout:', error);

    // Error genérico
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await authService.getUserById(userId);
    if (user) {
      res.status(200).json({
        success: true,
        message: 'Usuario encontrado',
        user
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario por ID',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

export const getProfileByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;

    const userProfile = await authService.getUserProfileById(userId);

    if (userProfile) {
      res.status(200).json({
        success: true,
        message: 'Perfil de usuario encontrado',
        profile: userProfile
      });
    }
    else {
      res.status(404).json({
        success: false,
        message: 'Perfil de usuario no encontrado'
      });
    }
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario por ID',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};