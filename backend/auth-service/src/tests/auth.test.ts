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
import { AuthRepository } from '../repositories/auth.repository';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

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
    AuthRepository: jest.fn().mockImplementation(() => mockRepo)
  };
});

// Simulamos el servicio de email
jest.mock('../services/email.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Simulamos la configuración JWT
jest.mock('../../../../shared/config/jwt.config', () => ({
  generateToken: jest.fn(() => 'testToken'),
  verifyToken: jest.fn(() => ({ userId: 'user1', email: 'test@example.com' }))
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
        profile: { id: 'profile1', username: 'newuser', firstName: 'New', lastName: 'User' }
      };

      repoInstance.findByEmail.mockResolvedValue(null);
      repoInstance.save.mockImplementation(async (user: any) => {
        // Simulamos que se asigna un id al guardar
        user.id = 'user1';
        return user;
      });

      const newUser = await registerUser(userData);
      expect(newUser.email).toEqual(userData.email);
      expect(newUser.role).toEqual(userData.role);
      expect(newUser.password).toEqual('hashed_' + userData.password);
      expect(newUser.is_active).toBe(false);
      // Verificamos que token_data contenga la información de verificación
      const tokenData = JSON.parse(newUser.token_data as string);
      expect(tokenData.verificationType).toBe('email');
      expect(tokenData.token).toBeDefined();
      expect(tokenData.expiresAt).toBeDefined();

      expect(repoInstance.save).toHaveBeenCalled();
      expect(sendVerificationEmail).toHaveBeenCalledWith(
        userData.email,
        userData.profile.username,
        tokenData.token
      );
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
      expect(result.token).toEqual('testToken');
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
      const token = 'resetToken';
      const newPassword = 'NewPassword1!';
      // Creamos un usuario dummy que haga match con el token
      const dummyUser = {
        id: 'user1',
        // Se espera que bcrypt.compare(token + user.id, user.password) retorne true,
        // por lo que establecemos la contraseña como 'hashed_' + (token + id)
        password: 'hashed_' + (token + 'user1'),
        token_data: '{"resetPassword":{"token":"' + token + '","createdAt":"2023-01-01T00:00:00.000Z","expiresAt":"2023-12-31T23:59:59.999Z"}}'
      };
      repoInstance.findAll.mockResolvedValue([dummyUser]);
      repoInstance.updatePassword.mockResolvedValue(true);
      repoInstance.save.mockResolvedValue(dummyUser);

      const result = await resetPassword(token, newPassword);
      expect(result).toBe(true);
      expect(repoInstance.updatePassword).toHaveBeenCalledWith(dummyUser.id, 'hashed_' + newPassword);
      expect(repoInstance.save).toHaveBeenCalled();
      expect(dummyUser.token_data).toEqual("");
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