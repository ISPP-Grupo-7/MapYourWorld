import { Router } from 'express';
import * as achievementController from '../controllers/achievement.controller';

const router: Router = Router();


/**
 * Crea un nuevo logro.
 * POST /achievements
 */
router.post('/achievements', achievementController.createAchievement);

/**
 * Obtiene todos los logros.
 * GET /achievements
 */
router.get('/achievements', achievementController.getAchievements);

/**
 * Obtiene un logro según su nombre.
 * GET /achievements/name/:name
 */
router.get('/achievements/name/:name', achievementController.getAchievementByName);

/**
 * Obtiene un logro según su id.
 * GET /achievements/:id
 */
router.get('/achievements/:id', achievementController.getAchievementById);


export default router;
