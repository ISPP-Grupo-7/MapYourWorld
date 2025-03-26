import { Router } from 'express';
import { joinMap } from '../controllers/collab.map.controller';

const router: Router = Router();

router.put('/join/:mapId/:userId', joinMap);



export default router;
