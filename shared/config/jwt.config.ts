/**
 * Configuración para JWT (JSON Web Tokens)
 * Este archivo centraliza la configuración para la generación y verificación de tokens
 */

import jwt, { Secret, JwtPayload, SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Obtener secreto desde variables de entorno o usar valor por defecto
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your_development_jwt_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

// Interfaces para tipado
export interface UserData {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  plan?: string;
  isPremium?: boolean;
}

// Interfaz para los datos decodificados del token
export interface DecodedToken {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  // Campos estándar de JWT
  iat?: number; // Issued At (cuándo fue emitido)
  exp?: number; // Expiration Time (cuándo expira)
  sub?: string; // Subject (el sujeto del token, generalmente userId)
}

// Extender la interfaz Request para incluir el usuario
declare module 'express' {
  interface Request {
    user?: UserData;
    token?: string;
  }
}

/**
 * Genera un token JWT para un usuario
 * @param userData - Datos del usuario a incluir en el token
 * @returns Token JWT
 */
export const generateToken = (userData: UserData): string => {
  const payload = {
    userId: userData.userId,
    email: userData.email
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRATION
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verifica un token JWT
 * @param token - Token JWT a verificar
 * @returns Datos decodificados del token o null si es inválido
 */
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
};

/**
 * Middleware para Express que verifica tokens JWT en las solicitudes
 * @param allowUnauthenticated - Si es true, permite solicitudes sin token
 */
export const authMiddleware = (allowUnauthenticated = false) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader && allowUnauthenticated) {
      next();
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false, 
        message: 'No se proporcionó token de autenticación válido' 
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ 
        success: false, 
        message: 'Token inválido o expirado' 
      });
      return;
    }

    // Agregar datos del usuario al objeto de solicitud
    req.user = decoded;
    next();
  };
};

/**
 * Middleware para verificar si un usuario tiene plan premium
 */
export const premiumMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ 
      success: false, 
      message: 'Usuario no autenticado' 
    });
    return;
  }

  if (req.user.plan !== 'premium') {
    res.status(403).json({ 
      success: false, 
      message: 'Esta funcionalidad requiere una suscripción premium' 
    });
    return;
  }

  next();
};

// Opciones de configuración para tokens
export const jwtConfig = {
  // Clave secreta para firmar tokens (debe configurarse desde variables de entorno en producción)
  secretKey: process.env.JWT_SECRET_KEY || 'mapyourworld_secret_key_development_only',
  
  // Tiempo de expiración del token de acceso (24 horas por defecto)
  accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '24h',
  
  // Tiempo de expiración del token de actualización (30 días por defecto)
  refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '30d',
  
  // Algoritmo de firma
  algorithm: 'HS256',
  
  // Emisor del token (aplicación)
  issuer: 'mapyourworld-api',
  
  // Audiencia del token (frontend)
  audience: 'mapyourworld-client'
};

// Claves de eventos relacionados con autenticación
export const authEvents = {
  userRegistered: 'auth.user.registered',
  userLoggedIn: 'auth.user.login',
  userLoggedOut: 'auth.user.logout',
  passwordReset: 'auth.password.reset',
  passwordChanged: 'auth.password.changed',
  tokenRefreshed: 'auth.token.refreshed'
};

// Cabecera HTTP estándar para el token de autenticación
export const AUTH_HEADER = 'Authorization';

// Prefijo para el token en la cabecera Authorization
export const TOKEN_PREFIX = 'Bearer ';

/**
 * Extrae el token de la cabecera de autorización
 * @param authHeader Valor de la cabecera Authorization
 * @returns Token sin el prefijo o null si no es válido
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith(TOKEN_PREFIX)) {
    return null;
  }
  
  return authHeader.substring(TOKEN_PREFIX.length);
};

// Nombres de cookies para tokens
export const COOKIE_NAMES = {
  accessToken: 'mapyourworld_access_token',
  refreshToken: 'mapyourworld_refresh_token'
};

// Configuración de cookies para tokens
export const cookieConfig = {
  httpOnly: true,      // No accesible desde JavaScript en el cliente
  secure: process.env.NODE_ENV === 'production',  // Solo HTTPS en producción
  sameSite: 'strict' as const,  // Protección contra CSRF
  maxAge: 30 * 24 * 60 * 60  // 30 días en segundos
}; 