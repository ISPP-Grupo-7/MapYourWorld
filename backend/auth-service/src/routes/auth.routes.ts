/**
 * Rutas para el servicio de autenticación
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, verify, forgotPassword, resetPassword, changePassword } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '@backend/auth-service/src/types';
import { requireAdmin, isAuthenticated } from '../middleware/auth.middleware';
import adminRoutes from './admin.routes';

const router: Router = Router();

// Ruta para registrar un usuario
router.post(
  '/register',
  [
    // Validaciones
    body('email')
      .isEmail()
      .withMessage('Introduce un email válido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/\d/)
      .withMessage('La contraseña debe contener al menos un número')
      .matches(/[a-z]/)
      .withMessage('La contraseña debe contener al menos una letra minúscula')
      .matches(/[A-Z]/)
      .withMessage('La contraseña debe contener al menos una letra mayúscula')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('La contraseña debe contener al menos un carácter especial'),
  ],
  register
);

// Ruta para iniciar sesión
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Introduce un email válido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  login
);

// Ruta para verificar token
router.post('/verify', verify);

// Rutas para cambio y recuperación de contraseña
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Introduce un email válido').normalizeEmail(),
  ],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('El token es obligatorio'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/\d/)
      .withMessage('La contraseña debe contener al menos un número')
      .matches(/[a-z]/)
      .withMessage('La contraseña debe contener al menos una letra minúscula')
      .matches(/[A-Z]/)
      .withMessage('La contraseña debe contener al menos una letra mayúscula')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('La contraseña debe contener al menos un carácter especial'),
  ],
  resetPassword
);

// Ruta para cambiar contraseña (usuario autenticado)
router.post(
  '/change-password',
  authMiddleware(),
  [
    body('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/\d/)
      .withMessage('La contraseña debe contener al menos un número')
      .matches(/[a-z]/)
      .withMessage('La contraseña debe contener al menos una letra minúscula')
      .matches(/[A-Z]/)
      .withMessage('La contraseña debe contener al menos una letra mayúscula')
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage('La contraseña debe contener al menos un carácter especial'),
  ],
  changePassword
);

// Ruta para obtener el perfil del usuario autenticado
router.get('/profile', authMiddleware(), (req: AuthenticatedRequest, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

// Rutas para permisos de administrador
router.use('/admin', isAuthenticated, requireAdmin, adminRoutes);
export default router; 