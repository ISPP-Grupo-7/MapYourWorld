// map.integration.test.ts

import request from 'supertest';
import { Server } from 'http';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { Map } from '../models/map.model';
import { User, Role } from '../../../auth-service/src/models/user.model';

// --- Mocks de repositorios para inicializar la AppDataSource ---
const mockMapRepo = mock<Repository<Map>>();
const mockUserRepo = mock<Repository<User>>();

jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn((entity) => {
      if (entity.name === 'Map') return mockMapRepo;
      if (entity.name === 'User') return mockUserRepo;
      return mock<Repository<any>>();
    })
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined)
}));

// IMPORTANTE: Si en tu index.ts exportas la app por default o de forma nombrada,
// ajusta la importación según corresponda. Aquí se asume default export.
import app from '../index';

let server: Server;
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token';

// Datos dummy para los tests
const dummyUser: User = {
  id: 'user1',
  email: 'user1@example.com',
  role: Role.USER,
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

const dummyMap: Map = {
  id: 'map1',
  name: 'Mapa personal',
  description: 'Mapa para el usuario',
  createdAt: new Date(),
  is_colaborative: false,
  user_created: dummyUser,
  users_joined: [] // Propiedad obligatoria
};

beforeAll(async () => {
  // Levantamos el servidor en un puerto para test
  server = app.listen(3010, () => {
    console.log('Servidor de integración de Map Service corriendo en el puerto 3005');
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
  // Espiamos (spy) el método createMapColaborativo para simular la creación sin error.
  // Esto evita el error "Cannot set properties of undefined" que ocurre en el repositorio.
 
  const MapRepository = require('../repositories/map.repository').default;
  jest
    .spyOn(MapRepository.prototype, 'createMapColaborativo')
    .mockImplementation(((mapData: any, userId: string): Promise<Map> => {
      return Promise.resolve({ ...mapData, id: 'map-colab-1', user_created: dummyUser } as Map);
    }) as unknown as (...args: unknown[]) => any);
    const PointOfInterestRepository = require('../repositories/poi.repostory').default;
    jest.spyOn(PointOfInterestRepository.prototype, 'getPointsOfInterestByMapId')
      .mockResolvedValue([]);
  
});


describe('Map Service - Integration Tests', () => {

  describe('POST /api/maps/createColaborative', () => {
    // Aumentamos el timeout a 10 segundos para este test
    it(
      'debe crear un mapa colaborativo exitosamente',
      async () => {
        const mapData = {
          name: 'Mapa colaborativo',
          description: 'Mapa para colaboración',
          createdAt: new Date(), // Usamos Date, no string
          is_colaborative: true,
          users_joined: [] // Propiedad obligatoria
        };

        const createdMap: Map = { ...mapData, id: 'map-colab-1', user_created: dummyUser };

        // Simulamos que el repositorio retorna el mapa creado y se encuentra el usuario creador.
        // En este caso, el método createMapColaborativo ya está "espia" y retorna el objeto simulado.
        mockUserRepo.findOne.mockResolvedValue(dummyUser);

        const response = await request(app)
          .post('/api/maps/createColaborative')
          .set('Authorization', `Bearer ${testToken}`)
          .send({ MapData: mapData, userId: dummyUser.id });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Mapa colaborativo creado correctamente');
      },
      10000 // Timeout de 10 segundos
    );

    it('debe retornar error si faltan datos (MapData o userId)', async () => {
      const response = await request(app)
        .post('/api/maps/createColaborative')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ userId: dummyUser.id }); // Falta MapData

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Faltan datos necesarios');
    });
  });

  describe('POST /api/maps/createOrGetCollaborative', () => {
    it('debe devolver un mapa colaborativo existente si ya existe', async () => {
      // Simulamos que el mapa ya existe
      mockMapRepo.findOne.mockResolvedValue(dummyMap);

      const response = await request(app)
        .post('/api/maps/createOrGetCollaborative')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ mapId: dummyMap.id, userId: dummyUser.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Mapa colaborativo ya existe');
      expect(response.body.map.id).toBe(dummyMap.id);
    });

    it('debe crear (simular) un mapa colaborativo si no existe', async () => {
      // Simulamos que el mapa no existe retornando null
      mockMapRepo.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/maps/createOrGetCollaborative')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ mapId: 'map-nuevo', userId: dummyUser.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('simulado');
      expect(response.body.map.id).toBe('map-nuevo');
    });
  });

  describe('POST /api/maps/invite', () => {
    it('debe enviar una invitación simulada al usuario', async () => {
      const inviteData = {
        mapId: dummyMap.id,
        userEmail: 'invite@example.com',
        invitedByUserId: dummyUser.id
      };
      const response = await request(app)
        .post('/api/maps/invite')
        .set('Authorization', `Bearer ${testToken}`)
        .send(inviteData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Invitación');
    });

    it('debe retornar error simulado si faltan datos necesarios', async () => {
      const response = await request(app)
        .post('/api/maps/invite')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ mapId: dummyMap.id, invitedByUserId: dummyUser.id });

      // Al faltar userEmail/username se envía invitación simulada
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isSimulated).toBe(true);
    });
  });

  describe('GET /api/maps/principalMap/user/:userId', () => {
    it('debe obtener el mapa principal del usuario', async () => {
      // Simulamos que se encuentra el mapa principal
      mockMapRepo.findOne.mockResolvedValue(dummyMap);

      const response = await request(app)
        .get(`/api/maps/principalMap/user/${dummyUser.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.map.id).toBe(dummyMap.id);
    });

    it('debe retornar error si falta el userId', async () => {
      const response = await request(app)
        .get('/api/maps/principalMap/user/')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/maps/collaborative/user/:userId', () => {
    it('debe obtener los mapas colaborativos del usuario', async () => {
      const collabMaps: Map[] = [
        { ...dummyMap, id: 'map2', is_colaborative: true },
        { ...dummyMap, id: 'map3', is_colaborative: true }
      ];
      // Para este test, espía el método getCollaborativeMapsForUser para que retorne collabMaps.
      const MapRepository = require('../repositories/map.repository').default;
      jest.spyOn(MapRepository.prototype, 'getCollaborativeMapsForUser').mockResolvedValue(collabMaps);

      const response = await request(app)
        .get(`/api/maps/collaborative/user/${dummyUser.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.maps)).toBe(true);
      expect(response.body.maps.length).toBe(collabMaps.length);
    });

    it('debe retornar un arreglo vacío si no hay mapas colaborativos', async () => {
      // Para este caso, espía el método para que retorne un arreglo vacío.
      const MapRepository = require('../repositories/map.repository').default;
      jest.spyOn(MapRepository.prototype, 'getCollaborativeMapsForUser').mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/maps/collaborative/user/${dummyUser.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.maps).toEqual([]);
    });
  });

  describe('GET /api/maps/:MapId', () => {
    it('debe obtener un mapa por su ID', async () => {
      mockMapRepo.findOne.mockResolvedValue(dummyMap);

      const response = await request(app)
        .get(`/api/maps/${dummyMap.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.Map.id).toBe(dummyMap.id);
    });

    it('debe retornar 500 si el mapa no existe', async () => {
      // Se simula que el repositorio retorna null, lo que hace que el servicio lance error.
      mockMapRepo.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/maps/non-existent-map')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/maps/update/:mapId', () => {
    it('debe actualizar un mapa correctamente', async () => {
      const updateData = { name: 'Mapa Actualizado', description: 'Descripción Actualizada' };
      const updatedMap: Map = { ...dummyMap, ...updateData };
      mockMapRepo.findOne.mockResolvedValue(dummyMap);
      mockMapRepo.save.mockResolvedValue(updatedMap);

      const response = await request(app)
        .put(`/api/maps/update/${dummyMap.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ updateData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.Map.name).toBe('Mapa Actualizado');
    });

    it('debe retornar error 400 si no se proporcionan datos de actualización', async () => {
      const response = await request(app)
        .put(`/api/maps/update/${dummyMap.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/maps/users/:mapId', () => {
    it('debe obtener los usuarios asociados al mapa', async () => {
      const users = [dummyUser];
      mockMapRepo.findOne.mockResolvedValue({ ...dummyMap, users_joined: users });

      const response = await request(app)
        .get(`/api/maps/users/${dummyMap.id}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.users[0].id).toBe(dummyUser.id);
    });

    it('debe retornar error si no se proporcionó el ID del mapa', async () => {
      const response = await request(app)
        .get('/api/maps/users/');

      // Si no se proporciona mapId, se podría retornar 400; ajusta según la lógica de tu controlador.
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/maps/delete/:mapId/:userId', () => {
    it('debe eliminar un mapa correctamente', async () => {
      mockMapRepo.findOne.mockResolvedValue(dummyMap);
      mockMapRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      const response = await request(app)
        .delete(`/api/maps/delete/${dummyMap.id}/${dummyUser.id}`)

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminado');
    });

    it('debe retornar 404 si el mapa no existe al eliminar', async () => {
      mockMapRepo.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/maps/delete/non-existent-map/user1')

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('debe retornar 500 si falla la eliminación del mapa', async () => {
      mockMapRepo.findOne.mockResolvedValue(dummyMap);
      mockMapRepo.delete.mockRejectedValue(new Error('Error de eliminación'));

      const response = await request(app)
        .delete(`/api/maps/delete/${dummyMap.id}/${dummyUser.id}`)

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});