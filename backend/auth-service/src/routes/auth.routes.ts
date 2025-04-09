/**
 * Rutas para el servicio de autenticación
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, forgotPassword, resetPassword, verify, changePassword, logout, getUserById, getProfileByUserId } from '../controllers/auth.controller';

const router: Router = Router();

// Ruta para registrar un usuario
router.post(
  '/register',
  [
    // Validaciones
    body('email')
      .isEmail()
      .withMessage('Introduce un email válido')
      .custom(value => {
        if (/[A-Z]/.test(value)) {
          throw new Error('El email no puede contener letras mayúsculas');
        }
        return true;
      })
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/\d/)
      .isLength({ max: 255 })
      .withMessage('La contraseña debe tener como máximo 255 caracteres')
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
router.post(
  '/verify',
  [
    body('token').notEmpty().withMessage('El token es obligatorio')
  ],
  verify
);


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
router.get('/profile/:userId', getProfileByUserId);

// Ruta para cerrar sesión (sin requerir middleware de autenticación)
router.post(
  '/logout',
  [
    body('token').optional().isString().withMessage('El token debe ser una cadena válida'),
    body('userId').optional().isString().withMessage('El ID de usuario debe ser una cadena válida')
  ],
  logout
);

router.get('/:userId', getUserById);

// Rutas para permisos de administrador

export default router;
