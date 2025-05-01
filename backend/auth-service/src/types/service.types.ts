/**
 * Tipos específicos para el servicio de autenticación
 */

import { UserData } from '../../../types/auth/auth.types';

// Parámetros para la creación de tokens
export interface TokenPayload {
  user: UserData;
}