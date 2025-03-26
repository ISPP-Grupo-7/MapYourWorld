import { Request, Response, NextFunction} from 'express';
import * as AchievementService from '../services/achievement.service';

/**
 * Crea un nuevo logro
 * POST /achievements
 */
export const createAchievement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievementData = req.body;
    const newAchievement = await AchievementService.createAchievement(achievementData);
    res.status(201).json({ success: true, ...newAchievement });
  } catch (error) {
    next(error);
  }
};


/**
 * Obtiene todos los logros
 * GET /achievements
 */
export const getAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievements = await AchievementService.getAchievements();
    res.json(achievements);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un logro por nombre
 * GET /achievements/:achievementName
 */
export const getAchievementByName = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const achievement = await AchievementService.getAchievementByName(name);
    if (!achievement) {
      res.status(404).json({ message: 'Logro no encontrado' });
      return;
    }
    res.json(achievement);
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un logro por id
 * GET /achievements/:id
 */
export const getAchievementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const achievement = await AchievementService.getAchievementById(id);
    if (!achievement) {
      res.status(404).json({ message: 'Logro no encontrado' });
      return;
    }
    res.json(achievement);
  } catch (error) {
    next(error);
  }
}
