/**
 * Middleware de autenticación para el servicio de auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@backend/auth-service/src/types';
import { Auth } from '@types';
import { Role } from '../models/user.model';
import * as authService from '../services/auth.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware para verificar que el usuario está autenticado
 */
export const authMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Obtener el token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No hay token de autenticación',
        data: null
      });
      return;
    }

    // Extraer el token
    const token = authHeader.split(' ')[1];

    try {
      // Verificar el token
      const decoded = jwt.verify(token, JWT_SECRET) as { user: Auth.UserData };

      // Añadir el usuario al request
      (req as AuthenticatedRequest).user = decoded.user;
      (req as AuthenticatedRequest).token = token;

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado',
        data: null
      });
      return;
    }
  };
};

/**
 * Middleware para verificar roles de usuario
 */
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificar que haya un usuario en el request (depende del middleware de autenticación)
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
        data: null
      });
    }

    // Verificar que el usuario tenga el rol requerido
    if (roles.includes(authReq.user.role)) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
        data: null
      });
    }
  };
};

/**
 * Verifica si un usuario tiene rol de administrador
 * @param userId ID del usuario a verificar
 * @returns true si el usuario es administrador, false en caso contrario
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  const user = await authService.getUserById(userId);
  return user?.role === Role.ADMIN;
};

/**
 * Proteger tutas que requieren permisos de administrador
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autorizado'
      });
    }
    const isAdminUser = await isAdmin(userId);
    if (!isAdminUser) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado, not eres administrador'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
/**
 * Verificar si el usuario está autenticado 
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autorizado'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};