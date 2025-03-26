import { Request, Response, NextFunction} from 'express';
import * as UserAchievementService from '../services/userAchievement.service';
import * as AuthService from '../../auth-service/src/services/auth.service';
import * as AchievementService from '../services/achievement.service'; 

/**
 * Crea un nuevo usuario-logro (desbloquea un logro para un usuario)
 * POST /user-achievements/:userId/:achievementId
 */
export const createUserAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {userId, achievementId} = req.params;
    const user = await AuthService.getUserById(userId);
    const achivement = await AchievementService.getAchievementById(achievementId);
    if(!user){
      throw new Error("Usuario no encontrado");
    }
    if(!achivement){
      throw new Error("Logro no encontrado");
    }
    const newAchievement = await UserAchievementService.createUserAchievement(user, achivement);
    res.status(201).json(newAchievement);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los logros desbloqueados por un usuario.
 * GET /user-achievements/user/:userId
 */
export const getAchievementsByUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const userAchievements = await UserAchievementService.getAchievementsByUser(userId);
    res.json(userAchievements);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene todos los usuarios que han desbloqueado un logro específico.
 * GET /user-achievements/achievement/:achievementId
 */
export const getUsersByAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { achievementId } = req.params;
    const userAchievements = await UserAchievementService.getUsersByAchievement(achievementId);
    res.json(userAchievements);
  } catch (error) {
    next(error);
  }
};