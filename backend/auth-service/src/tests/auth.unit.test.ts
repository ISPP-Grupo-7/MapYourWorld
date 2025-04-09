// Mockear el módulo 'crypto' para simular randomBytes de forma determinista
jest.mock('crypto', () => {
  const actualCrypto = jest.requireActual('crypto');
  return {
    ...actualCrypto,
    randomBytes: jest.fn((size: number) => Buffer.from('randombytes')),
  };
});

import { 
  getUserById, 
  registerUser, 
  loginUser, 
  verifyUserToken, 
  changePassword, 
  requestPasswordReset, 
  resetPassword, 
  logout 
} from '../services/auth.service';
import AuthRepository  from '../repositories/auth.repository';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

// Añadir mock para UserProfileRepository
jest.mock('../../../user-service/src/repositories/userProfile.repository', () => {
  const mockProfileRepo = {
    create: jest.fn().mockImplementation(data => ({ ...data, id: 'profile1' })),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    update: jest.fn(),
    search: jest.fn()
  };
  
  return {
    UserProfileRepository: jest.fn().mockImplementation(() => mockProfileRepo)
  };
});

// También necesitas mockear el servicio de mapas ya que se utiliza en registerUser
jest.mock('../../../map-service/src/services/map.service', () => ({
  createMap: jest.fn().mockResolvedValue({ id: 'map1' })
}));

jest.mock('../../../map-service/src/services/district.service', () => ({
  createDistricts: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../map-service/src/repositories/map.repository', () => {
  const mockMapRepo = {
    getMapById: jest.fn().mockResolvedValue({ id: 'map1' })
  };
  
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockMapRepo)
  };
});

// Add this with your other jest.mock calls at the top of the file
jest.mock('../../../payment-service/repositories/subscription.repository', () => {
  const mockSubscriptionRepo = {
    create: jest.fn().mockResolvedValue(true),
    findActiveByUserId: jest.fn(),
    update: jest.fn()
  };

  return {
    __esModule: true, // Asegura que las importaciones por default funcionen
    default: jest.fn().mockImplementation(() => mockSubscriptionRepo),
    _mockSubscriptionRepo: mockSubscriptionRepo // Opcional, por si necesitas acceder directamente al mock
  };
});


// Also mock the POI service that's used in registerUser
jest.mock('../../../map-service/src/services/poi.service', () => ({
  createPOIsOnLagMaps: jest.fn().mockResolvedValue(true)
}));

// Simulamos el AuthRepository




jest.mock('../repositories/auth.repository', () => {
  const mockRepo = {
    findByEmail: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findWithPassword: jest.fn(),
    findAll: jest.fn(),
    updatePassword: jest.fn(),
    create: jest.fn()
  };

  return {
    __esModule: true, // <<--- clave para las importaciones por default
    default: jest.fn().mockImplementation(() => mockRepo),
    _mockRepo: mockRepo // opcional, por si lo necesitas en los tests
  };
});

// Simulamos el servicio de email
jest.mock('../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Simulamos la configuración JWT
jest.mock('../../../../shared/security/jwt', () => ({
  generateToken: jest.fn(() => 'testToken'),
  verifyToken: jest.fn(() => ({ 
    valid: true, 
    payload: { sub: 'user1', email: 'test@example.com' } 
  }))
}));

// Simulamos bcrypt para que el hash se genere de forma determinista
jest.mock('bcryptjs', () => ({
  hash: jest.fn((pwd, rounds) => Promise.resolve('hashed_' + pwd)),
  compare: jest.fn((pwd, hash) => Promise.resolve(hash === 'hashed_' + pwd || pwd.startsWith('resetToken')))
}));

describe('Auth Service', () => {
  let repoInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Se obtiene la instancia del repositorio simulado
    const AuthRepositoryMock = AuthRepository as jest.Mock;
    // Crear una nueva instancia del mock antes de cada test
    new AuthRepositoryMock();
    repoInstance = AuthRepositoryMock.mock.results[0].value;
  });

  describe('getUserById', () => {
    it('debe retornar un usuario para un id válido', async () => {
      const dummyUser = { id: 'user1', email: 'test@example.com' };
      repoInstance.findById.mockResolvedValue(dummyUser);

      const result = await getUserById('user1');
      expect(result).toEqual(dummyUser);
      expect(repoInstance.findById).toHaveBeenCalledWith('user1');
    });
  });

  describe('registerUser', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password1!',
        role: 'USER',
        username: 'newuser', 
        firstName: 'New',
        lastName: 'User',
        picture: '',
      };
  
      // Configurar mocks
      repoInstance.findByEmail.mockResolvedValue(null);
      repoInstance.save.mockImplementation(async (user:any) => {
        user.id = 'user1';
        return user;
      });
  
      const newUser = await registerUser(userData);
      
      // Verificar resultados
      expect(newUser.email).toEqual(userData.email);
      expect(newUser.role).toEqual(userData.role);
      expect(newUser.password).toEqual('hashed_' + userData.password);
      expect(newUser.is_active).toBe(true); 
      expect(repoInstance.save).toHaveBeenCalled();
      
    });
  });
  describe('loginUser', () => {
    it('debe autenticar al usuario y retornar el token', async () => {
      const email = 'test@example.com';
      const password = 'Password1!';
      const dummyUser = {
        id: 'user1',
        email,
        password: 'hashed_' + password,
        is_active: true,
        token_data: '',
        profile: { username: 'testuser' }
      };
      repoInstance.findWithPassword.mockResolvedValue(dummyUser);
      repoInstance.save.mockResolvedValue(dummyUser);

      const result = await loginUser(email, password);
      expect(result.user.email).toEqual(email);
      expect(result.user).not.toHaveProperty('password');
      expect(repoInstance.findWithPassword).toHaveBeenCalledWith(email);
      expect(repoInstance.save).toHaveBeenCalled();
    });
  });

  describe('verifyUserToken', () => {
    it('debe verificar exitosamente un token válido', async () => {
      const token = 'validToken';
      const dummyUser = {
        id: 'user1',
        email: 'test@example.com',
        role: 'USER',
        token_data: token,
      };
      repoInstance.findById.mockResolvedValue(dummyUser);
      // La función verifyToken simulada retorna { userId: 'user1', email: 'test@example.com' }
      const result = await verifyUserToken(token);
      expect(result).toEqual({
        userId: 'user1',
        email: 'test@example.com',
        role: 'USER'
      });
      expect(repoInstance.findById).toHaveBeenCalledWith('user1');
    });
  });

  describe('changePassword', () => {
    it('debe cambiar la contraseña exitosamente', async () => {
      const userId = 'user1';
      const currentPassword = 'Password1!';
      const newPassword = 'NewPassword1!';
      const dummyUser = {
        id: userId,
        password: 'hashed_' + currentPassword,
        token_data: 'sometoken'
      };
      repoInstance.findById.mockResolvedValue(dummyUser);
      repoInstance.updatePassword.mockResolvedValue(true);
      repoInstance.save.mockResolvedValue(dummyUser);

      const result = await changePassword(userId, currentPassword, newPassword);
      expect(result).toBe(true);
      expect(repoInstance.updatePassword).toHaveBeenCalledWith(userId, 'hashed_' + newPassword);
      expect(repoInstance.save).toHaveBeenCalled();
      expect(dummyUser.token_data).toEqual("");
    });
  });

  describe('requestPasswordReset', () => {
    it('debe iniciar el proceso de recuperación de contraseña exitosamente', async () => {
      const email = 'test@example.com';
      const dummyUser = {
        id: 'user1',
        email,
        profile: { username: 'testuser' },
        token_data: ''
      };
      repoInstance.findByEmail.mockResolvedValue(dummyUser);
      repoInstance.save.mockResolvedValue(dummyUser);

      const result = await requestPasswordReset(email);
      expect(result).toBe(true);
      expect(repoInstance.save).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        email,
        dummyUser.profile.username,
        expect.any(String)
      );
    });
  });

  describe('resetPassword', () => {
    it('debe restablecer la contraseña exitosamente', async () => {
      const resetToken = 'resetToken';
      const newPassword = 'NewPassword1!';
      
      const dummyUser = {
        id: 'user1',
        password: 'hashed_password',  
        token_data: JSON.stringify({
          resetPassword: {
            token: resetToken,
            createdAt: new Date(Date.now() - 3600000).toISOString(), 
            expiresAt: new Date(Date.now() + 3600000).toISOString() 
          }
        })
      };
      
      repoInstance.findAll.mockResolvedValue([dummyUser]);
      repoInstance.updatePassword.mockResolvedValue(true);
      repoInstance.save.mockResolvedValue({...dummyUser, token_data: ''});
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockImplementationOnce(() => Promise.resolve(true));
      
      const result = await resetPassword(resetToken, newPassword);
      expect(result).toBe(true);
      expect(repoInstance.updatePassword).toHaveBeenCalledWith(dummyUser.id, 'hashed_' + newPassword);
      expect(repoInstance.save).toHaveBeenCalled();
      
      // Verificar que token_data sea eliminado
      expect(dummyUser.token_data).not.toContain('resetPassword');
    });
    
    it('debe fallar si el token no es válido', async () => {
      const invalidToken = 'invalidToken';
      const newPassword = 'NewPassword1!';
      
      const dummyUser = {
        id: 'user1',
        password: 'some_password_hash',
        token_data: JSON.stringify({
          resetPassword: {
            token: 'correctToken', 
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          }
        })
      };
      
      repoInstance.findAll.mockResolvedValue([dummyUser]);
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockImplementationOnce(() => Promise.resolve(false));
      
      await expect(resetPassword(invalidToken, newPassword)).rejects.toThrow();
      
      expect(repoInstance.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('debe cerrar la sesión del usuario exitosamente', async () => {
      const userId = 'user1';
      const token = 'testToken';
      const dummyUser = {
        id: userId,
        token_data: token,
      };
      repoInstance.findById.mockResolvedValue(dummyUser);
      repoInstance.save.mockResolvedValue(dummyUser);

      const result = await logout(userId, token);
      expect(result).toBe(true);
      expect(repoInstance.save).toHaveBeenCalled();
      expect(dummyUser.token_data).toEqual("");
    });
  });
});