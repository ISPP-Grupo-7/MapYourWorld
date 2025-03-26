import { Router } from 'express';
import * as userAchievementController from '../controllers/userAchievement.controller';

const router: Router = Router();


/**
 * Crea un nuevo usuario-logro (desbloquea un logro para un usuario)
 * POST /user-achievements/:userId/:achievementId
 */
router.post('/:userId/:achievementId', userAchievementController.createUserAchievement);

/**
 * Obtiene todos los logros (Achievement) obtenidos por un usuario.
 * GET /user-achievements/user/:userId
 */
router.get('/achievements/:userId', userAchievementController.getAchievementsByUser);

/**
 * Obtiene todos los usuarios que han desbloqueado un logro específico.
 * GET /user-achievements/achievement/:achievementId
 */
router.get('/users/:achievementId', userAchievementController.getUsersByAchievement);


export default router;
