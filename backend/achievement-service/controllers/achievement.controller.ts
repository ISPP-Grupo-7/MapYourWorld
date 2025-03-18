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
    res.status(201).json(newAchievement);
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
 * GET /achievements/name/:name
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
