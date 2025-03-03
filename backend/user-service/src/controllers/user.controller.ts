import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

/**
 * Controlador para gestionar la suscripción premium del usuario.
 * Se espera que en el body se envíen: planType y paymentData.
 */
export const subscribeToPremiumController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { planType, paymentData } = req.body;

    // Llamada al service para suscribir al usuario a premium
    const result = await userService.subscribeToPremium(userId, planType, paymentData);
    return res.status(200).json({ success: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador para actualizar las preferencias del usuario.
 * Se espera que en el body se envíen las configuraciones a actualizar.
 */
export const updateUserSettingsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const settings = req.body;

    const result = await userService.updateUserSettings(userId, settings);
    return res.status(200).json({ success: result });
  } catch (error) {
    next(error);
  }
};
