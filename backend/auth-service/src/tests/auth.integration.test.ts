// First import all external dependencies
import request from 'supertest';
import { Server } from 'http';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';

// Create mock variables BEFORE using them in any mocks
const mockUserRepo = mock<Repository<any>>();
const mockProfileRepo = mock<Repository<any>>();
const mockMapRepo = mock<any>();

// Mock modules before app import
jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn((entity) => {
      if (entity.name === 'User') return mockUserRepo;
      if (entity.name === 'UserProfile') return mockProfileRepo;
      return mock<Repository<any>>();
    })
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined)
}));

// Mock map service
jest.mock('../../../map-service/src/services/map.service', () => ({
  createMap: jest.fn().mockResolvedValue({ id: 'mock-map-id' })
}));

jest.mock('../../../map-service/src/services/district.service', () => ({
  createDistricts: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../map-service/src/repositories/map.repository', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockMapRepo)
  };
});

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockImplementation((plain, hash) => Promise.resolve(plain === 'Password1!'))
}));

// Now import the auth service that was causing the circular reference
import { logout } from '../../../auth-service/src/services/auth.service';
import AuthRepository  from '../../../auth-service/src/repositories/auth.repository'; 
import { UserProfile } from '../../../user-service/src/models/userProfile.model';

// Import app after all mocks are set up
import app from '../index';
import { Role, User } from '../models/user.model';

let server: Server;

beforeAll(async () => {
  try {
    // Configure MockMapRepository behavior
    mockMapRepo.getMapById = jest.fn().mockResolvedValue({ id: 'mock-map-id' });

    // Start server for tests
    server = app.listen(3001);
    console.log('Servidor en ejecución en puerto 3001 para tests');
  } catch (error) {
    console.error('Error al inicializar para pruebas:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('Servidor cerrado');
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('Error en la limpieza:', error);
    throw error;
  }
});

const mockProfile = {
  id: 'mocked-profile-id',
  username: 'usu1',
  firstName: 'Usuario',
  lastName: 'Prueba'
};

// Create user mock
const mockUser = {
  id: 'mocked-user-id',
  email: 'usuario.prueba@example.com',
  password: 'Pa5sWorD!!1',
  is_active: true,
  role: Role.USER,
  token_data: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhcGktdGVzdC1jbGllbnQiLCJ',
  profile: mockProfile
};

describe('Auth Service - Pruebas de Endpoints', () => {
  let testUserToken: string;
  let testUserId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
    mockUserRepo.findOneBy = jest.fn().mockResolvedValue(null);
    // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
    mockUserRepo.findOne = jest.fn().mockResolvedValue(null);
    // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
    mockUserRepo.create = jest.fn().mockImplementation((data) => data);
    // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
    mockUserRepo.save = jest.fn().mockImplementation((data) => Promise.resolve({
      ...data,
      id: 'mocked-user-id'
    }));
    
    // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
    mockProfileRepo.create = jest.fn().mockImplementation((data) => data);
    // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
    mockProfileRepo.save = jest.fn().mockImplementation((data) => Promise.resolve({
      ...data,
      id: 'mocked-profile-id'
    }));
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un usuario nuevo y retornar token y datos mínimos', async () => {
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOneBy.mockResolvedValueOnce(null); // El email no está en uso
      
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockProfileRepo.create.mockReturnValueOnce(mockProfile);
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockProfileRepo.save.mockResolvedValueOnce(mockProfile);
      
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.create.mockReturnValueOnce(mockUser);
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.save.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: mockUser.email,  
          password: mockUser.password,
          username: mockUser.profile.username,
          firstName: mockUser.profile.firstName,
          lastName: mockUser.profile.lastName,
          acceptTerms: true
        });

      // Validar la respuesta
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe(mockUser.email);

      // Guardamos valores para otras pruebas
      testUserToken = response.body.token;
      testUserId = response.body.user.id;
    });

    it('debe retornar error por email inválido al no darse email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: '',
          password: 'Password1!'
        });
      
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debe retornar error por email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'no-es-un-email.com',
          password: 'Password1!'
        });
      
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debe retornar error por email inválido al mezclar mayusculas', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'teSt@mail.com',
          password: 'Password1!'
        });
      
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debe retornar error por password inválido al no tener caracteres especiales', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@mail.com',
          password: 'Password1'
        });
            
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debe retornar error por password inválido al no tener mayusculas ni caracteres especiales', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@mail.com',
          password: 'password1'
        });
          
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debe retornar error por password inválido al no tener longitud minima 8', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@mail.com',
          password: 'p'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debe retornar error por password inválido al exceder la longitud maxima', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@mail.com',
          password: '0123456789ABCDEF0123456789ABCDEF01234567uuuuuuuuuuuuuuuuuuuuiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii89ABCDEF01!3456789AbCDEF0123456789AffffffffffBCDEF0123456789ABCDEF0123456789ABCDEF012345678jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk___________________________________________9ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
        });
      
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('debe retornar error por no pasar password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@mail.com',
          password: ''
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('no debe registrar por intentar hacerse template injection', async () => {
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOneBy.mockResolvedValueOnce(null); 
      
      const mockProfile = {
        id: 'mocked-profile-id',
        username: 'usuario_prueba',
        firstName: 'Usuario',
        lastName: 'Prueba'
      };
      
      // Crear mock de usuario
      const mockUser = {
        id: 'mocked-user-id',
        email: 'usuario_prueba@example.com',
        password: 'hashed-password',
        is_active: true,
        role: Role.USER,
        profile: mockProfile
      };
    
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockProfileRepo.create.mockReturnValueOnce(mockProfile);
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockProfileRepo.save.mockResolvedValueOnce(mockProfile);
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.create.mockReturnValueOnce(mockUser);
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.save.mockResolvedValueOnce(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'usuario_prueba@example.com',
          password: 'Password1!',
          username: '{{7*7}}',
          firstName: 'Usuario',
          lastName: 'Prueba',
          acceptTerms: true
        });


      // Validar la respuesta
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.username).not.toBe(49);
      expect(response.body.user.email).toBe('usuario_prueba@example.com');

      // Guardamos valores para otras pruebas
      testUserToken = response.body.token;
      testUserId = response.body.user.id;
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe iniciar sesión correctamente con credenciales válidas', async () => {
      // Crear un usuario mock que se usará tanto para login como para verificación
      const mockUser = {
        id: 'mocked-user-id',
        email: 'usuario_prueba@example.com',
        password: 'hashed-password',
        is_active: true,
        role: Role.USER,
        token_data: '',
        profile: {
          id: 'mocked-profile-id',
          username: 'usuario_prueba'
        }
      };
      
      // Mock para el login
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);
      
      // Realizar la petición de login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usuario_prueba@example.com',
          password: 'Password1!'
        });
      
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();
      
      // Importante: hacer mock del repositorio de usuario otra vez para el endpoint de verificación
      // Esto debe coincidir con el método que tu endpoint de verify usa para buscar al usuario
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOne.mockResolvedValueOnce(mockUser);
      // Si tu endpoint usa findOneBy u otro método, también se debe mockear
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOneBy.mockResolvedValueOnce(mockUser);
      
      // Realizar la petición al endpoint de verificación
      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({
          token: loginResponse.body.token
        });
        
      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
    });
    it('debe retornar error por credenciales inválidas, sql injection', async () => {
      const mockUser = {
        id: 'mocked-user-id',
        email: " '' OR '1'='1' ",
        password: 'hashed-password',
        is_active: true,
        role: Role.USER,
        token_data: '',
        profile: {
          id: 'mocked-profile-id',
          username: 'usuario_prueba'
        }
      };
      
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOne.mockResolvedValueOnce(null);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: " '' OR '1'='1' ",
          password: 'Password1!'
        });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
      
  });

  describe('Tests de integración - logout', () => {
    const userId = 'user-123';
    let mockUser: any;
  
    beforeEach(() => {
      jest.clearAllMocks();
      // Definimos un usuario mock con token_data asignado
      mockUser = {
        id: userId,
        token_data: 'valid-token'
      };
    });
  
    it('debería lanzar error si el usuario no se encuentra', async () => {
      // Usamos spyOn para sobreescribir findById y simular que no se encuentra al usuario
      jest.spyOn(AuthRepository.prototype, 'findById').mockResolvedValueOnce(null);
  
      await expect(logout(userId, 'valid-token')).rejects.toThrow('Usuario no encontrado');
      expect(AuthRepository.prototype.findById).toHaveBeenCalledWith(userId);
    });
  
    it('debería invalidar el token y retornar true si se especifica un token que coincide', async () => {
      jest.spyOn(AuthRepository.prototype, 'findById').mockResolvedValueOnce(mockUser);
      const saveSpy = jest.spyOn(AuthRepository.prototype, 'save').mockResolvedValueOnce({ ...mockUser, token_data: '' });
  
      const result = await logout(userId, 'valid-token');
  
      expect(AuthRepository.prototype.findById).toHaveBeenCalledWith(userId);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ token_data: '' }));
      expect(result).toBe(true);
    });
  
    it('debería invalidar todas las sesiones y retornar true si no se especifica token', async () => {
      jest.spyOn(AuthRepository.prototype, 'findById').mockResolvedValueOnce(mockUser);
      const saveSpy = jest.spyOn(AuthRepository.prototype, 'save').mockResolvedValueOnce({ ...mockUser, token_data: '' });
  
      const result = await logout(userId);
  
      expect(AuthRepository.prototype.findById).toHaveBeenCalledWith(userId);
      expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ token_data: '' }));
      expect(result).toBe(true);
    });
  
    it('debería retornar false si se especifica un token que no coincide', async () => {
      jest.spyOn(AuthRepository.prototype, 'findById').mockResolvedValueOnce(mockUser);
  
      const result = await logout(userId, 'wrong-token');
  
      expect(AuthRepository.prototype.findById).toHaveBeenCalledWith(userId);
      // No se debe llamar a 'save' ya que el token no coincide
      expect(result).toBe(false);
    });
  });
});