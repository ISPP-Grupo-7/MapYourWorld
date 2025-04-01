import { Router } from 'express';
import { createPOI, getPOIById, updatePOI, deletePOI, getAllPOIs, getPOIsByMapId, createPOIInAllMaps, getUniquePointsOfInterestBusiness } from '../controllers/poi.controller';

const router: Router = Router();

// Crear un nuevo POI
router.post('/', createPOI);
router.post('/admin/create/ads', createPOIInAllMaps);
// Crear POI sin token

// Rutas específicas primero
router.get('/all', getAllPOIs);
router.get('/map/:mapId', getPOIsByMapId);
router.get('/business/points', getUniquePointsOfInterestBusiness);


// Rutas con parámetros de ID al final
router.get('/:poiId', getPOIById);
router.put('/:poiId', updatePOI);
router.delete('/:poiId', deletePOI);

export default router;