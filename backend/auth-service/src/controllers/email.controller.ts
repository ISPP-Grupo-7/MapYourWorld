import { Request, Response } from 'express';
import crypto from 'crypto';
import { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangeNotification, testEmailConnection } from '../services/email.service';

/**
 * Enviar correo
 */
export const sendMail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { from, to, subject, html, text, attachments } = req.body;
        if (!from || !to || !subject || !html) {
            res.status(400).json({
            success: false,
            message: 'Los campos from, to, subject y html son requeridos'
            });
            return;
        }
        const mailOptions = { to, subject, html, text, from, attachments };
        const result = await sendEmail(mailOptions);
  
        if (result.success) {
            res.status(200).json({
            success: true,
            message: 'Correo enviado correctamente'
            });
        } else {
            res.status(500).json({
            success: false,
            message: 'Error al enviar correo',
            error: result.error?.message
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al enviar correo',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
  };

/**
 * Enviar correo de verificación de cuenta.
 */
export const sendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username } = req.body;
    if (!email || !username) {
      res.status(400).json({
        success: false,
        message: 'Email y nombre de usuario son requeridos'
      });
      return;
    }

    // Generar token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const result = await sendVerificationEmail(email, username, verificationToken);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Correo de verificación enviado correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar correo de verificación',
        error: result.error?.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar correo de verificación',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Enviar correo para restabler la contraseña.
 */
export const passwordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username } = req.body;
    if (!email || !username) {
      res.status(400).json({
        success: false,
        message: 'Email y nombre de usuario son requeridos'
      });
      return;
    }

    // Generar token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const result = await sendPasswordResetEmail(email, username, resetToken);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Correo de restablecimiento de contraseña enviado correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar correo de restablecimiento de contraseña',
        error: result.error?.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar correo de restablecimiento de contraseña',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Notificar el cambio de contraseña.
 */
export const passwordChangeNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username } = req.body;
    if (!email || !username) {
      res.status(400).json({
        success: false,
        message: 'Email y nombre de usuario son requeridos'
      });
      return;
    }

    const result = await sendPasswordChangeNotification(email, username);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Notificación de cambio de contraseña enviada correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al enviar notificación de cambio de contraseña',
        error: result.error?.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificación de cambio de contraseña',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Probar la conexión con el servidor SMTP.
 */
export const testConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const connectionStatus = await testEmailConnection();
    if (connectionStatus) {
      res.status(200).json({
        success: true,
        message: 'Conexión con el servidor de correo verificada'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error al verificar la conexión con el servidor de correo'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar la conexión con el servidor de correo',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};