/**
 * Re-exportación de tipos para el servicio de autenticación
 */

import { Request } from 'express';
import { Auth } from '@types';

/** Solicitud autenticada con datos de usuario */
export interface AuthenticatedRequest extends Request {
  user?: Auth.UserData;
  token?: string;
}