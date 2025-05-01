import { Router } from 'express';
import * as UserStatController from '../controllers/userStat.controller';

const userStatRouter: Router = Router();

userStatRouter.get('/:userId', UserStatController.getAllStatsByUser);

export default userStatRouter;