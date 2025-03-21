import request from 'supertest';
import { Server } from 'http';
import { UserProfile } from '../../../user-service/src/models/userProfile.model';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';

// Mocks para repositorios y servicios externos
// @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
const mockUserRepo = mock<Repository<any>>();
// @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
const mockProfileRepo = mock<Repository<any>>();
const mockMapRepo = mock<any>();

// Mock de los módulos antes de importar app
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

// Mock para el servicio de mapas
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

// Mock para bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockImplementation((plain, hash) => Promise.resolve(plain === 'Password1!'))
}));

// Ahora importamos app después de configurar los mocks
import app from '../index';
import { Role, User } from '../models/user.model';

let server: Server;

beforeAll(async () => {
  try {
    // Configurar comportamiento del mock de MapRepository
    mockMapRepo.getMapById = jest.fn().mockResolvedValue({ id: 'mock-map-id' });

    // Iniciar el servidor para las pruebas
    server = app.listen(3001);
    console.log('Servidor en ejecución en puerto 3001 para tests');
  } catch (error) {
    console.error('Error al inicializar para pruebas:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Cerrar el servidor
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

describe('Auth Service - Pruebas de Endpoints', () => {
  // Variables globales para almacenar datos del usuario de prueba
  let testUserToken: string;
  let testUserId: string;

  beforeEach(() => {
    // Reiniciar mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Configurar comportamiento base de los mocks
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
      // Configurar el mock para simular la creación de usuario
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOneBy.mockResolvedValueOnce(null); // El email no está en uso
      
      // Crear mock de perfil
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
      
      // Configurar respuestas de los mocks
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockProfileRepo.create.mockReturnValueOnce(mockProfile);
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockProfileRepo.save.mockResolvedValueOnce(mockProfile);
      
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.create.mockReturnValueOnce(mockUser);
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.save.mockResolvedValueOnce(mockUser);

      // Ejecutar el test
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'usuario_prueba@example.com',
          password: 'Password1!',
          username: 'usuario_prueba',
          firstName: 'Usuario',
          lastName: 'Prueba'
        });

      // Para depuración
      console.log('Respuesta de registro:', response.body);

      // Validar la respuesta
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.email).toBe('usuario_prueba@example.com');

      // Guardamos valores para otras pruebas
      testUserToken = response.body.token;
      testUserId = response.body.user.id;
    });

    it('debe retornar error por email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'no-es-un-email',
          password: 'Password1!'
        });
      
      console.log('Respuesta de email inválido:', response.body);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe iniciar sesión correctamente con credenciales válidas', async () => {
      // Configurar el mock para el login
      // @ts-ignore - Ignoramos los errores de tipo para los mocks en pruebas
      mockUserRepo.findOne.mockResolvedValueOnce({
        id: 'mocked-user-id',
        email: 'usuario_prueba@example.com',
        password: 'hashed-password', // el mock de bcrypt ignorará esto
        is_active: true,
        role: Role.USER,
        token_data: '',
        profile: {
          id: 'mocked-profile-id',
          username: 'usuario_prueba'
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'usuario_prueba@example.com',
          password: 'Password1!'
        });
      
      console.log('Respuesta de login:', response.body);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });
  });
});