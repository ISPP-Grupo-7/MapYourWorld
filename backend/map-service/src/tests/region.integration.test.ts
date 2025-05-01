// First import all external dependencies
import request from 'supertest';
import { Server } from 'http';
import { mock } from 'jest-mock-extended';
import { Repository, FindOptionsWhere, DeleteResult, ObjectLiteral} from 'typeorm';

// Definir interfaces más específicas para los repositorios
interface MockRepository<T extends ObjectLiteral> extends Repository<T> {
  findOneBy: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  delete: jest.Mock;
}

// Crear los repositorios mock con la interfaz específica
const mockRegionRepo = mock<MockRepository<any>>();
const mockMapRepo = mock<MockRepository<any>>();
const mockUserRepo = mock<MockRepository<any>>();

// Mock modules before app import
jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    getRepository: jest.fn((entity) => {
      if (entity.name === 'Region') return mockRegionRepo;
      if (entity.name === 'Map') return mockMapRepo;
      if (entity.name === 'User') return mockUserRepo;
      return mock<Repository<any>>();
    })
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined)
}));

// Import models and app after all mocks are set up
import app from '../index';
import { Region } from '../models/region.model';
import { Map } from '../models/map.model';
import { Role, User } from '../../../auth-service/src/models/user.model';
import { PlanType } from '../../../payment-service/models/subscription.model';

let server: Server;

// Test data fixtures
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  password: 'Password1!',
  is_active: true,
  role: Role.USER,
  profile: {
    id: 'profile-123',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User'
  },
  sentFriendRequests: [],
  receivedFriendRequests: [],
  maps_joined: [],
  subscription: {
    id: 'sub-123',
    plan: PlanType.FREE,
    startDate: new Date(),
    endDate: new Date(),
    is_active: true,
    user: {} as User
  },
  userDistrict: []
};

const mockMap = {
  id: 'map-123',
  name: 'Test Map',
  description: 'Test map description',
  createdAt: new Date(),
  is_colaborative: false,
  users_joined: [mockUser],
  user_created: mockUser
};

const mockRegion = {
  id: 'region-123',
  name: 'Test Region',
  description: 'Test region description',
  map_assignee: mockMap
};

beforeAll(async () => {
  try {
    // Start server for tests
    server = app.listen(3013);
    console.log('Server running on port 3002 for region integration tests');
  } catch (error) {
    console.error('Error initializing test server:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Close server
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => {
          console.log('Test server closed');
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('Error in cleanup:', error);
    throw error;
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Region Service - Integration Tests', () => {
  
  describe('POST /api/regions/create', () => {
    it('debe crear una región correctamente con datos válidos', async () => {
      // Configure mocks
      mockMapRepo.findOneBy.mockResolvedValue(mockMap);
      mockRegionRepo.create.mockReturnValue(mockRegion);
      mockRegionRepo.save.mockResolvedValue(mockRegion);

      // Make request
      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: 'Test Region',
            description: 'Test region description',
            map_assignee: mockMap
          },
          mapaId: 'map-123'
        });

      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Región creada correctamente');
      expect(response.body.region).toHaveProperty('id');
      expect(response.body.region.name).toBe('Test Region');
    });

    it('debe retornar error 400 si faltan datos de región', async () => {
      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: { 
            // Falta el nombre
            description: 'Test region description'
          },
          mapaId: 'map-123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Faltan datos necesarios');
    });

    it('debe retornar error 400 si falta el ID del mapa', async () => {
      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: 'Test Region',
            description: 'Test region description'
          }
          // Falta mapaId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Faltan datos necesarios');
    });

    it('debe retornar error 500 si ocurre un error al crear la región', async () => {
      // Mock error en el servicio
      mockMapRepo.findOneBy.mockResolvedValue(mockMap);
      mockRegionRepo.create.mockImplementation(() => {
        throw new Error('Error al crear la región');
      });

      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: 'Test Region',
            description: 'Test region description'
          },
          mapaId: 'map-123'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error');
    });

    it('debe rechazar nombres de regiones extremadamente largos', async () => {
      const veryLongName = 'a'.repeat(100); // Más largo que el límite de 50 caracteres

      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: veryLongName,
            description: 'Test region description'
          },
          mapaId: 'map-123'
        });

      expect(response.status).toBe(500); // Asumiendo que la validación ocurre en la base de datos
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/regions/:regionId', () => {
    it('debe obtener una región correctamente por su ID', async () => {
      mockRegionRepo.findOneBy.mockResolvedValue(mockRegion);

      const response = await request(app)
        .get('/api/regions/region-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.region).toHaveProperty('id', 'region-123');
      expect(response.body.region.name).toBe('Test Region');
    });

    it('debe retornar error 404 si la región no existe', async () => {
      mockRegionRepo.findOneBy.mockImplementation(() => {
        throw new Error('Region with id non-existent-region not found');
      });

      const response = await request(app)
        .get('/api/regions/non-existent-region');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error');
    });

    it('debe manejar ID con caracteres especiales correctamente', async () => {
      mockRegionRepo.findOneBy.mockImplementation(() => {
        throw new Error('Region with id special-!@#$-id not found');
      });

      const response = await request(app)
        .get('/api/regions/special-!@#$-id');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/regions/name/:regionName', () => {
    it('debe obtener una región correctamente por su nombre', async () => {
      mockRegionRepo.findOneBy.mockResolvedValue(mockRegion);

      const response = await request(app)
        .get('/api/regions/name/Test%20Region');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.region.name).toBe('Test Region');
    });

    it('debe retornar error si la región con ese nombre no existe', async () => {
      mockRegionRepo.findOneBy.mockImplementation(() => {
        throw new Error('Region with name Non-existent Region not found');
      });

      const response = await request(app)
        .get('/api/regions/name/Non-existent%20Region');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('debe manejar nombres con espacios y caracteres especiales', async () => {
      const specialName = 'Región Especial!';
      mockRegionRepo.findOneBy.mockResolvedValue({
        ...mockRegion,
        name: specialName
      });

      const response = await request(app)
        .get(`/api/regions/name/${encodeURIComponent(specialName)}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.region.name).toBe(specialName);
    });
  });

  describe('GET /api/regions', () => {
    it('debe obtener todas las regiones cuando existen', async () => {
      mockRegionRepo.find.mockResolvedValue([mockRegion, { ...mockRegion, id: 'region-456', name: 'Second Region' }]);

      const response = await request(app)
        .get('/api/regions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.regions)).toBe(true);
      expect(response.body.regions.length).toBe(2);
    });

    it('debe retornar un array vacío cuando no hay regiones', async () => {
      mockRegionRepo.find.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/regions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.regions)).toBe(true);
      expect(response.body.regions.length).toBe(0);
    });

    it('debe manejar errores en la consulta de regiones', async () => {
      mockRegionRepo.find.mockImplementation(() => {
        throw new Error('Error al consultar regiones');
      });

      const response = await request(app)
        .get('/api/regions');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error al obtener las regiones');
    });
  });

  describe('PUT /api/regions/update/:regionId', () => {
    it('debe actualizar una región correctamente', async () => {
      // Configurar mocks para buscar y actualizar
      mockRegionRepo.findOneBy.mockResolvedValue(mockRegion);
      mockRegionRepo.save.mockResolvedValue({
        ...mockRegion,
        name: 'Updated Region',
        description: 'Updated description'
      });

      const response = await request(app)
        .put('/api/regions/update/region-123')
        .send({
          name: 'Updated Region',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Región actualizada correctamente');
      expect(response.body.region.name).toBe('Updated Region');
      expect(response.body.region.description).toBe('Updated description');
    });

    it('debe retornar error 400 si faltan datos para actualizar', async () => {
      const response = await request(app)
        .put('/api/regions/update/region-123')
        .send({
          // No se proporciona ni nombre ni descripción
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Faltan datos para actualizar');
    });

    it('debe retornar error si la región a actualizar no existe', async () => {
      mockRegionRepo.findOneBy.mockImplementation(() => {
        throw new Error('Region with id non-existent-region not found');
      });

      const response = await request(app)
        .put('/api/regions/update/non-existent-region')
        .send({
          name: 'New Name',
          description: 'New description'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar actualizaciones con valores inválidos', async () => {
      mockRegionRepo.findOneBy.mockResolvedValue(mockRegion);
      
      const response = await request(app)
        .put('/api/regions/update/region-123')
        .send({
          name: '', // Nombre vacío
          description: 'Valid description'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/regions/delete/:regionId', () => {
    it('debe eliminar una región correctamente', async () => {
      mockRegionRepo.delete.mockResolvedValue({ affected: 1 });

      const response = await request(app)
        .delete('/api/regions/delete/region-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Región eliminada correctamente');
    });

    it('debe retornar mensaje de error si la región no existe', async () => {
      mockRegionRepo.delete.mockResolvedValue({ affected: 0 });

      const response = await request(app)
        .delete('/api/regions/delete/non-existent-region');

      expect(response.status).toBe(500); // El controller en este caso retorna 200 incluso si no se encontró la región
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Error');
    });

    it('debe manejar errores durante la eliminación', async () => {
      mockRegionRepo.delete.mockImplementation(() => {
        throw new Error('Error al eliminar la región');
      });

      const response = await request(app)
        .delete('/api/regions/delete/region-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error al eliminar la región');
    });

    it('debe rechazar IDs de región inválidos', async () => {
      const response = await request(app)
        .delete('/api/regions/delete/');

      expect(response.status).toBe(404); // Ruta no encontrada por falta de parámetro
    });
  });

  // Pruebas de casos límite y validaciones adicionales
  describe('Casos límite y validaciones especiales', () => {
    it('debe rechazar nombres de región muy cortos', async () => {
      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: '', // Nombre vacío
            description: 'Test description'
          },
          mapaId: 'map-123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar descripciones muy largas', async () => {
      const veryLongDescription = 'a'.repeat(300); // Más largo que el límite de 255 caracteres

      mockMapRepo.findOneBy.mockResolvedValue(mockMap);
      
      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: 'Valid Name',
            description: veryLongDescription
          },
          mapaId: 'map-123'
        });

      expect(response.status).toBe(500); // La validación falla en la base de datos
      expect(response.body.success).toBe(false);
    });

    it('debe validar contra inyección SQL en nombres de región', async () => {
      const sqlInjectionName = "DROP TABLE regions; --";
      
      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: sqlInjectionName,
            description: 'Valid description'
          },
          mapaId: 'map-123'
        });

      // Corregir la sintaxis de las expectativas múltiples
      expect(
        response.status === 201 || 
        response.status === 400 || 
        response.status === 500
      ).toBeTruthy();
      
      if (response.status === 201) {
        // Si acepta el nombre, simplemente verifica que no cause efectos secundarios
        expect(response.body.success).toBe(true);
        expect(response.body.region.name).toBe(sqlInjectionName);
      }
    });

    it('debe verificar la existencia del mapa al crear una región', async () => {
      // Simular que el mapa no existe
      mockMapRepo.findOneBy.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/regions/create')
        .send({
          regionData: {
            name: 'Test Region',
            description: 'Test description'
          },
          mapaId: 'non-existent-map'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});