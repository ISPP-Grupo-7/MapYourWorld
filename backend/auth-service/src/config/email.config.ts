/**
 * Configuración del servicio de email
 * Define los ajustes de conexión SMTP y otros parámetros
 */

import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  templates: {
    verification: string;
    resetPassword: string;
    passwordChanged: string;
    welcome: string;
  };
}

// Configuración por defecto para el servicio de email
export const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASSWORD || 'password'
  },
  from: process.env.EMAIL_FROM || 'MapYourWorld <noreply@mapyourworld.com>',
  templates: {
    verification: 'verification',
    resetPassword: 'reset-password',
    passwordChanged: 'password-changed',
    welcome: 'welcome'
  }
}; 