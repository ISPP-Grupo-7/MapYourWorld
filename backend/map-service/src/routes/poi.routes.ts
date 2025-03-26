import { Router } from 'express';
import * as POIController from '../controllers/poi.controller';

const router: Router = Router();

// Crear un nuevo POI
router.post('/', POIController.createPOI);
router.post('/admin/create/ads', POIController.createPOIInAllMaps);
// Crear POI sin token

// Rutas específicas primero
router.get('/all', POIController.getAllPOIs);
router.get('/map/:mapId', POIController.getPOIsByMapId);
router.get('/business/points', POIController.getUniquePointsOfInterestBusiness);


// Rutas con parámetros de ID al final
router.get('/:id', POIController.getPOIById);
router.put('/:id', POIController.updatePOI);
router.delete('/:id', POIController.deletePOI);

export default router;