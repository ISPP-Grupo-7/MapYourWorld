import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePicture,
  searchProfiles,
  createProfile,
} from '../controllers/profile.controller';

const router: Router = Router();

/**
 * Obtiene un perfil por su ID
 * GET /api/profiles/:profileId
 */
router.get('/:profileId', getProfile);

/**
 * Actualiza los campos de un perfil
 * PUT /api/profiles/:profileId
 */
router.put('/:profileId', updateProfile);

/**
 * Actualiza la imagen de perfil
 * PUT /api/profiles/:profileId/picture
 */
router.put('/:profileId/picture', updatePicture);

/**
 * Busca perfiles por username, nombre o apellido
 * GET /api/profiles?query=texto
 */
router.get('/', searchProfiles);

/**
 * Crea un nuevo perfil
 * POST /api/profiles
 */
router.post('/', createProfile);

export default router;
