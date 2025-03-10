/**
 * Rutas para las funcionalidades sociales
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as socialController from '../controllers/social.controller';
import {addComment} from '../controllers/social.controller';

const router: Router = Router();

// Ruta para añadir un comentario
router.post(
  '/comments',
  [
    body('userId').notEmpty().withMessage('ID de usuario requerido'),
    body('content').notEmpty().withMessage('Contenido requerido'),
    body('targetType').isIn(['photo', 'poi']).withMessage('Tipo de objetivo inválido'),
    body('targetId').notEmpty().withMessage('ID de objetivo requerido')
  ],
  addComment
);


// Ruta para añadir un like
router.post(
  '/likes',
  [
    body('userId').notEmpty().withMessage('ID de usuario requerido'),
    body('targetType').isIn(['photo', 'comment']).withMessage('Tipo de objetivo inválido'),
    body('targetId').notEmpty().withMessage('ID de objetivo requerido')
  ],
  socialController.addLike
);

// Ruta para eliminar un like
router.delete(
  '/likes',
  [
    body('userId').notEmpty().withMessage('ID de usuario requerido'),
    body('targetType').isIn(['photo', 'comment']).withMessage('Tipo de objetivo inválido'),
    body('targetId').notEmpty().withMessage('ID de objetivo requerido')
  ],
  socialController.removeLike
);

// Ruta para seguir a un usuario
router.post(
  '/follow',
  [
    body('followerId').notEmpty().withMessage('ID de seguidor requerido'),
    body('followingId').notEmpty().withMessage('ID de usuario a seguir requerido')
  ],
  socialController.followUser
);

// Ruta para dejar de seguir a un usuario
router.delete(
  '/follow',
  [
    body('followerId').notEmpty().withMessage('ID de seguidor requerido'),
    body('followingId').notEmpty().withMessage('ID de usuario a dejar de seguir requerido')
  ],
  socialController.unfollowUser
);

// Ruta para obtener los seguidores de un usuario
router.get(
  '/followers/:userId',
  [
    param('userId').notEmpty().withMessage('ID de usuario requerido')
  ],
  socialController.getFollowers
);

export default router; 