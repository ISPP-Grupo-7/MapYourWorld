import { Router } from 'express';
import { joinMap } from '../controllers/collab.map.controller';

const router: Router = Router();

router.put('/join', joinMap);



export default router;
