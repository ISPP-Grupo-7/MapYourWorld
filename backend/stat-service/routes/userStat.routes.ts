import { Router } from 'express';
import * as UserStatController from '../controllers/userStat.controller';

const router: Router = Router();

router.get('/', UserStatController.getAllUserStats);
router.get('/:id', UserStatController.getUserStatById);
router.post('/', UserStatController.createUserStat);
router.put('/:id', UserStatController.updateUserStat);
router.delete('/:id', UserStatController.deleteUserStat);

router.get('/user/:userId', UserStatController.getUserStatByUserId);
router.put('/user/:userId', UserStatController.updateUserStatByUserId);

export default router;