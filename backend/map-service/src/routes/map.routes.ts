import { Router } from 'express';
import { createMap, getMapById, updateMap, deleteMap, createMapColaborative, getUsersOnMapById, createOrGetCollaborativeMap, inviteUserToMap, getCollaborativeMapsForUser, getPrincipalMapForUser } from '../controllers/map.controller';

const router: Router = Router();

router.post('/create', createMap);

router.post('/createColaborative', createMapColaborative);

router.post('/createOrGetCollaborative', createOrGetCollaborativeMap);

router.post('/invite', inviteUserToMap);

router.get('/principalMap/user/:userId', getPrincipalMapForUser);

// Ruta para obtener los mapas colaborativos de un usuario
router.get('/collaborative/user/:userId', getCollaborativeMapsForUser);

router.get('/:MapId', getMapById);

router.put('/update/:mapId', updateMap );

router.get('/users/:mapId', getUsersOnMapById );

router.delete('/delete/:mapId', deleteMap );


export default router;
