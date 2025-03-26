/**
 * Servicio de envío de correos electrónicos
 * Este servicio se encarga de enviar correos para verificación, recuperación de contraseña, etc.
 */

// NOTA: Para que este servicio funcione, es necesario instalar:
// npm install nodemailer
// npm install --save-dev @types/nodemailer
// import * as nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.config';
import { text } from 'stream/consumers';

// Define tipos manualmente para no depender de @types/nodemailer
interface Transport {
  sendMail: (options: any) => Promise<{messageId: string}>;
  verify: () => Promise<boolean>;
}

/**
 * Opciones para el envío de correo
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Resultado del envío de correo
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

/**
 * Crea un transportador de correo basado en la configuración
 * @returns Transportador configurado
 */
export const createTransporter = (): any => {
  // TODO: Implementar la creación del transportador
  // 1. Usar nodemailer.createTransport con la configuración de email
  // 2. Configurar opciones SSL/TLS según el entorno
  // NOTA: Requiere instalar el paquete nodemailer:
  // npm install nodemailer
  // npm install --save-dev @types/nodemailer
  const nodemailer = require('nodemailer');
  
  // Create the transporter with the email configuration
  const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD 
    },
    
    ...(emailConfig.secure ? {} : {
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' 
      }
    })
  });
  
  return transporter;
};

/**
 * Envía un correo electrónico
 * @param options Opciones para el envío de correo
 * @returns Resultado del envío
 */
export const sendEmail = async (options: EmailOptions): Promise<EmailResult> => {
  // TODO: Implementar el envío de correo
  // 1. Crear transportador
  // 2. Enviar correo con las opciones proporcionadas
  // 3. Manejar errores y devolver resultado
  try {
    // Validar campos obligatorios
    if (!options.to || !options.subject || !options.html) {
      throw new Error('Faltan campos obligatorios: to, subject y html son requeridos');
    }
    const transporter = createTransporter();
    const mailOptions = {
      from: options.from || emailConfig.from,
      ...options
    };
    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Error al enviar email:', error);
    let errorMessage = 'Error desconocido al enviar el email';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: error as Error
    };
  }
};

/**
 * Envía un correo de verificación de cuenta
 * @param email Correo del destinatario
 * @param username Nombre de usuario
 * @param verificationToken Token de verificación
 * @returns Resultado del envío
 */
export const sendVerificationEmail = async (
  email: string,
  username: string,
  verificationToken: string
): Promise<EmailResult> => {
  // TODO: Implementar el envío de correo de verificación
  // 1. Generar la URL de verificación con el token
  // 2. Crear el contenido HTML y texto plano con el enlace
  // 3. Enviar correo con sendEmail
  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  const verificationUrl = `${baseUrl}/verify?token=${verificationToken}`;
  const htmlContent = `
    <p>Hola ${username},</p>
    <p>Gracias por registrarte en MapYourWorld. Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:</p>
    <p><a href="${verificationUrl}">Verificar cuenta</a></p>
  `;
  const textContent = `
    ¡Bienvenido a MapYourWorld!
    
    Hola ${username},
    
    Gracias por registrarte en MapYourWorld. Para completar tu registro y verificar tu cuenta, por favor visita el siguiente enlace:
    
    ${verificationUrl}
    
    Este enlace expirará en 24 horas.
    
    Si no has creado una cuenta en MapYourWorld, puedes ignorar este correo.
  `;
  const mailOptions = {
    to: email,
    subject: 'Verifica tu cuenta en MapYourWorld',
    html: htmlContent,
    text: textContent
  };
  return await sendEmail(mailOptions);
};

/**
 * Envía un correo para restablecer la contraseña
 * @param email Correo del destinatario
 * @param username Nombre de usuario
 * @param resetToken Token para restablecer contraseña
 * @returns Resultado del envío
 */
export const sendPasswordResetEmail = async (
  email: string,
  username: string,
  resetToken: string
): Promise<EmailResult> => {
  // TODO: Implementar el envío de correo de restablecimiento
  // 1. Generar la URL de restablecimiento con el token
  // 2. Crear el contenido HTML y texto plano
  // 3. Enviar correo con sendEmail
  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  const resetUrl = `${baseUrl}/verify?token=${resetToken}`;
  const htmlContent = `
    <p>Hola ${username},</p>
    <p>Has solicitado restablecer tu contraseña en MapYourWorld.</p>
    <p>Haz clic en el siguiente enlace para restablecerla:</p>
    <p><a href="${resetUrl}">Restablecer contraseña</a></p>
    <p>Si no has solicitado este cambio, ignora este correo.</p>
  `;
  const textContent = `Hola ${username},\n\nHas solicitado restablecer tu contraseña en MapYourWorld.\n\nVisita el siguiente enlace para restablecerla:\n${resetUrl}\n\nSi no has solicitado este cambio, ignora este correo.`;
  const mailOptions: EmailOptions = {
    to: email,
    subject: 'Restablece tu contraseña en MapYourWorld',
    html: htmlContent,
    text: textContent
  };
  return await sendEmail(mailOptions);
};

/**
 * Envía una notificación de cambio de contraseña
 * @param email Correo del destinatario
 * @param username Nombre de usuario
 * @returns Resultado del envío
 */
export const sendPasswordChangeNotification = async (
  email: string,
  username: string
): Promise<EmailResult> => {
  // TODO: Implementar el envío de notificación
  // 1. Crear contenido informando del cambio de contraseña
  // 2. Incluir información de contacto en caso de actividad no autorizada
  // 3. Enviar correo con sendEmail
  const htmlContent = `
    <p>Hola ${username},</p>
    <p>Te informamos que tu contraseña ha sido cambiada exitosamente en MapYourWorld.</p>
    <p>Si no realizaste este cambio, por favor contacta de inmediato a nuestro equipo de soporte en support@mapyourworld.com.</p>
  `;
  const textContent = `Hola ${username},\n\nTe informamos que tu contraseña ha sido cambiada exitosamente en MapYourWorld.\n\nSi no realizaste este cambio, por favor contacta de inmediato a nuestro equipo de soporte en support@mapyourworld.com.\n`;
  
  const mailOptions: EmailOptions = {
    to: email,
    subject: 'Cambio de contraseña en MapYourWorld',
    html: htmlContent,
    text: textContent
  };

  return await sendEmail(mailOptions);
};

/**
 * Prueba la conexión con el servidor de correo
 * @returns true si la conexión es exitosa
 */
export const testEmailConnection = async (): Promise<boolean> => {
  // TODO: Implementar la prueba de conexión
  // 1. Intentar verificar conexión con el servidor SMTP
  // 2. Manejar cualquier error y devolver resultado
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Error al probar la conexión del servidor SMTP:', error);
    return false;
  }
}; 