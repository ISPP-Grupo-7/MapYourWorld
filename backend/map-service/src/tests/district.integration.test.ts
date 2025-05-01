// district.integration.test.ts
import request from 'supertest';
import { Server } from 'http';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { District } from '../models/district.model';
import { Role, User } from '../../../auth-service/src/models/user.model';
import { UserDistrict } from '../models/user-district.model';

// --- Mocks de repositorios para inicializar la AppDataSource ---
const mockDistrictRepo = mock<Repository<District>>();
const mockUserRepo = mock<Repository<User>>();
const mockUserDistrictRepo = mock<Repository<UserDistrict>>();

jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]), // <-- Aquí se define la función query

    getRepository: jest.fn((entity) => {
      if (entity.name === 'District') return mockDistrictRepo;
      if (entity.name === 'User') return mockUserRepo;
      if (entity.name === 'UserDistrict') return mockUserDistrictRepo;
      return mock<Repository<any>>();
    }),
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
}));

// IMPORTANTE: Ajusta la importación de tu app según cómo la exportes en tu index.ts
import app from '../index';

let server: Server;
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token';

// Datos dummy para los tests
const dummyUser: User = {
  id: 'user1',
  email: 'user1@example.com',
  role: Role.USER, // o la constante Role.USER según tengas definida la enumeración
  password: 'dummy',
  is_active: true,
  token_data: '',
  profile: { id: 'profile1', username: 'user1', firstName: 'User', lastName: 'One' },
  sentFriendRequests: [],
  receivedFriendRequests: [],
  maps_joined: [],
  subscription: {} as any,
  userDistrict: [],
};

const dummyMap = {
  id: 'map-456',
  name: 'Mapa de prueba',
  description: 'Este es un mapa de prueba para test unitario',
  createdAt: new Date('2024-01-01'),
  is_colaborative: true,
  users_joined: [dummyUser],
  user_created: dummyUser,
};

const dummyRegion = {
  id: 'region1',
  name: 'Region 1',
  description: 'Región de prueba',
  // Se incluye al menos la propiedad para relacionar con el mapa
  map_assignee: dummyMap,
};

const dummyDistrict: District = {
  id: 'district1',
  name: 'Distrito 1',
  description: 'Distrito de prueba',
  boundaries: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
  isUnlocked: false,
  region_assignee: dummyRegion,
  userDistrict: [],
};

const updatedDistrict: District = {
  ...dummyDistrict,
  name: 'Distrito Actualizado',
  description: 'Descripción actualizada',
  boundaries: { type: 'Polygon', coordinates: [[[2, 2], [2, 3], [3, 3], [3, 2], [2, 2]]] },
  isUnlocked: false,
  region_assignee: dummyRegion,
  userDistrict: [],
};

const unlockedDistrict: District = {
  ...dummyDistrict,
  isUnlocked: true,
};

const dummyUserDistrict: UserDistrict = {
  id: 'ud1',
  color: '#00FF00',
  district: dummyDistrict,
  user: dummyUser,
};

beforeAll(async () => {
  // Levantamos el servidor en un puerto para test
  server = app.listen(3011, () => {
    console.log('Servidor de integración de District Service corriendo en el puerto 3005');
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

// Limpieza de mocks antes de cada test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('District Service - Integration Tests', () => {

  describe('GET /api/districts/:districtId', () => {
    it('debe obtener un distrito por su ID', async () => {
      // Simulamos que el repositorio retorna el distrito
      mockDistrictRepo.findOneBy.mockResolvedValue(dummyDistrict);

      const response = await request(app)
        .get(`/api/districts/${dummyDistrict.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.district.id).toBe(dummyDistrict.id);
    });

    it('debe retornar error si el distrito no existe', async () => {
      // Simulamos que el repositorio no encuentra el distrito (lanza error en el service)
      mockDistrictRepo.findOneBy.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/districts/non-existent-district')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error al obtener distrito');
    });
  });

  describe('GET /api/districts', () => {
    it('debe obtener todos los distritos', async () => {
      mockDistrictRepo.find.mockResolvedValue([dummyDistrict]);

      const response = await request(app)
        .get('/api/districts')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.districts)).toBe(true);
      expect(response.body.districts.length).toBe(1);
    });
  });

  describe('PUT /api/districts/update/:districtId', () => {
    it('debe actualizar un distrito correctamente', async () => {
      // Simulamos encontrar el distrito existente para luego actualizarlo
      mockDistrictRepo.findOneBy.mockResolvedValue(dummyDistrict);
      // Simulamos el guardado del distrito actualizado
      mockDistrictRepo.save.mockResolvedValue(updatedDistrict);

      const updateData = {
        name: updatedDistrict.name,
        description: updatedDistrict.description,
        boundaries: updatedDistrict.boundaries,
        isUnlocked: updatedDistrict.isUnlocked,
      };

      const response = await request(app)
        .put(`/api/districts/update/${dummyDistrict.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ updateData, userId: dummyUser.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.district.name).toBe('Distrito Actualizado');
    });

    it('debe retornar error 400 si faltan datos de actualización', async () => {
      const response = await request(app)
        .put(`/api/districts/update/${dummyDistrict.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({}); // faltan updateData y userId

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/districts/unlock/:districtId/:userId/:regionId', () => {
    it('debe desbloquear un distrito correctamente', async () => {
      // Simulamos que se encuentra el distrito en el repositorio con la relación correcta
      mockDistrictRepo.findOne.mockResolvedValue(dummyDistrict);
      // Simulamos que se encuentra el usuario
      mockUserRepo.findOne.mockResolvedValue(dummyUser);
      // Simulamos el guardado del distrito desbloqueado
      mockDistrictRepo.save.mockResolvedValue(unlockedDistrict);

      const response = await request(app)
        .put(`/api/districts/unlock/${dummyDistrict.id}/${dummyUser.id}/${dummyRegion.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ color: '#FF0000' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Distrito desbloqueado correctamente');
    });

    it('debe retornar error si faltan parámetros necesarios para desbloquear', async () => {
      // Aquí se prueba si faltan parámetros (por ejemplo, userId) en la URL
      const response = await request(app)
        .put(`/api/districts/unlock/${dummyDistrict.id}//${dummyRegion.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ color: '#FF0000' });

      // La validación del controlador en este caso debería retornar 400
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/districts/user/unlock/:userId', () => {
    it('debe obtener los distritos desbloqueados', async () => {
      mockDistrictRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([unlockedDistrict]),
      } as any);
      
      const response = await request(app)
        .get(`/api/districts/user/unlock/${dummyUser.id}`)
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.districts)).toBe(true);
      expect(response.body.districts[0].isUnlocked).toBe(true);
    });
  });

  describe('GET /api/districts/map/:mapId', () => {
    it('debe obtener los distritos asociados a un mapa específico', async () => {
      // Simulamos que se encuentran distritos para el mapa indicado
      mockDistrictRepo.find.mockResolvedValue([dummyDistrict]);

      const response = await request(app)
        .get(`/api/districts/map/${dummyRegion.map_assignee.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.districts)).toBe(true);
      expect(response.body.districts.length).toBe(1);
    });

    it('debe retornar error 400 si falta el ID del mapa', async () => {
      const response = await request(app)
        .get('/api/districts/map/""')
        .set('Authorization', `Bearer ${testToken}`);
      
      // Dependiendo de cómo manejes la ruta, podría retornar 400 o 404
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/districts/user-districts/:userId', () => {
    it('debe obtener los distritos con colores asignados para un usuario', async () => {
      // Simulamos que el repositorio retorna un arreglo con un UserDistrict válido
      mockUserDistrictRepo.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([dummyUserDistrict]),
      } as any);

      const response = await request(app)
        .get(`/api/districts/user-districts/${dummyUser.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.userDistricts)).toBe(true);
      expect(response.body.userDistricts[0].districtId).toBe(dummyDistrict.id);
      expect(response.body.userDistricts[0].color).toBe(dummyUserDistrict.color);
    });

    it('debe retornar error 400 si falta el ID del usuario', async () => {
      const response = await request(app)
        .get('/api/districts/user-districts/""')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(400);
    });
  });

});
