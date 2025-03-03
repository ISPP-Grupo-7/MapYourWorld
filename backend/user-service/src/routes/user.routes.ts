import express from 'express';
import { subscribeToPremiumController, updateUserSettingsController } from '../controllers/user.controller';

const router = express.Router();

// Ruta para suscribirse a premium
// Endpoint: POST /api/users/:userId/subscribe
router.post('/:userId/subscribe', subscribeToPremiumController);

// Ruta para actualizar las preferencias del usuario
// Endpoint: PATCH /api/users/:userId/settings
router.patch('/:userId/settings', updateUserSettingsController);

export default router;
