import { Router } from 'express';
import { getDistrictById, getAllDistricts, updateDistrict, unlockDistrict, getUserUnlockedDistricts, getDistrictsByMapId, getUserDistrictsWithColors } from '../controllers/district.controller';

const router: Router = Router();

router.get('/:districtId', getDistrictById);

router.get('/', getAllDistricts);

router.put('/update/:districtId', updateDistrict );

router.put('/unlock/:districtId/:userId/:regionId', unlockDistrict);

router.get('/user/unlock/:userId', getUserUnlockedDistricts);

router.get('/map/:mapId', getDistrictsByMapId);

router.get('/user-districts/:userId', getUserDistrictsWithColors);


export default router;
