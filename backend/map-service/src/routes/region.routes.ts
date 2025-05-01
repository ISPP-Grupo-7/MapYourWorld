import { Router } from 'express';
import {
  createRegion,
  getRegionById,
  getRegionByName,
  getAllRegions,
  updateRegion,
  deleteRegion
} from '../controllers/region.controller';

const router: Router = Router();

router.post('/create', createRegion);

router.get('/:regionId', getRegionById);

router.get('/name/:regionName', getRegionByName);

router.get('/', getAllRegions);

router.put('/update/:regionId', updateRegion);

router.delete('/delete/:regionId', deleteRegion);


export default router;