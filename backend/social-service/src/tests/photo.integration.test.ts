import request from 'supertest';
import { Server } from 'http';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { Photo } from '../models/photo.model';
import { Category, PointOfInterest } from '../../../map-service/src/models/poi.model';
import { Role, User } from '../../../auth-service/src/models/user.model';
import { PlanType } from '../../../payment-service/models/subscription.model';

const mockPhotoRepo = mock<Repository<Photo>>();
const mockPoiRepo = mock<Repository<PointOfInterest>>();

jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn((entity) => {
      if (entity.name === 'Photo') return mockPhotoRepo;
      if (entity.name === 'PointOfInterest') return mockPoiRepo;
      return mock<Repository<any>>();
    })
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined)
}));

import app from '../index';
import { Geometry, Point } from 'geojson';
import { Region } from '@backend/map-service/src/models/region.model';
import { UserDistrict } from '@backend/map-service/src/models/user-district.model';

let server: Server;
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token';

const mockPoi: PointOfInterest = {
  id: 'poi-test-123',
  name: 'Monumento Histórico',
  description: 'Un punto de interés para pruebas de integración',
  location: {
    type: "Point" as const,
    coordinates: [-5.9962, 37.3825]
  } as Point,
  category: Category.MONUMENTOS,
  images: 'https://example.com/image.jpg',
  createdAt: new Date('2023-06-15T10:00:00Z'),
  user: {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedpassword123',
    is_active: true,
    role: Role.USER,
    sentFriendRequests: [],
    receivedFriendRequests: [],
    maps_joined: [],
    profile: {
      id: 'profile-123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User'
    },

    subscription: {
      id: 'sub-123',
      plan: PlanType.FREE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      is_active: true,
      user: {} as User
    },
    userDistrict: [],
  },
  district: {
    id: 'district-123',
    name: 'Distrito Centro',
    description: 'Distrito histórico central',
    isUnlocked: true,
    boundaries: {
      type: "Polygon" as const,
      coordinates: [
        [
          [-5.9975, 37.3845],
          [-5.9955, 37.3845],
          [-5.9955, 37.3825],
          [-5.9975, 37.3825],
          [-5.9975, 37.3845]
        ]
      ]
    } as Geometry,
    region_assignee: {} as Region,
    userDistrict: {} as UserDistrict[],
  }
};

const mockPhoto = {
  id: 'photo-1',
  image: 'http://example.com/photo.jpg',
  caption: 'Foto de prueba',
  poi: mockPoi,
  uploadDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

beforeAll(async () => {
  server = app.listen(3004, () => {
    console.log('Servidor de integración de Photo corriendo en el puerto 3004');
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  jest.restoreAllMocks();
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

describe('Photo Service - Tests de integración', () => {

  describe('GET /api/photos', () => {
    it('debe retornar la lista de fotos', async () => {
      // Configuramos el mock para simular que se encuentran fotos
      mockPhotoRepo.find.mockResolvedValue([mockPhoto]);

      const response = await request(app)
        .get('/api/photos')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/photos/:poiId', () => {
    it('debe subir una nueva foto asociada a un POI', async () => {
      // Configuramos los mocks para encontrar el POI y guardar la foto
      mockPoiRepo.findOne.mockResolvedValue(mockPoi);
      mockPhotoRepo.create.mockReturnValue(mockPhoto);
      mockPhotoRepo.save.mockResolvedValue(mockPhoto);

      const newPhotoData = {
        image: 'http://example.com/nueva-foto.jpg',
        caption: 'Nueva foto'
      };

      const response = await request(app)
        .post(`/api/photos/${mockPoi.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ photoData: newPhotoData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.caption).toBe(mockPhoto.caption);
    });

    it('debe retornar error si no se encuentra el POI', async () => {
      // Simulamos que el POI no existe
      mockPoiRepo.findOne.mockResolvedValue(null);

      const newPhotoData = {
        image: 'http://example.com/nueva-foto.jpg',
        caption: 'Nueva foto'
      };

      const response = await request(app)
        .post('/api/photos/non-existent-poi')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ photoData: newPhotoData });

      // Según la lógica del controlador, se lanza error y retorna 500
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/photos/:photoId', () => {
    it('debe obtener una foto por ID', async () => {
      mockPhotoRepo.findOneBy.mockResolvedValue(mockPhoto);

      const response = await request(app)
        .get(`/api/photos/${mockPhoto.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockPhoto.id);
    });

    it('debe retornar error si la foto no existe', async () => {
      mockPhotoRepo.findOneBy.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/photos/non-existent-photo')
        .set('Authorization', `Bearer ${testToken}`);

      // Según el controlador, se retorna status 400 con data null
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });
  });

  describe('PUT /api/photos/:photoId', () => {
    it('debe actualizar una foto correctamente', async () => {
      const updatedPhoto = { ...mockPhoto, caption: 'Foto Actualizada', updatedAt: new Date() };
      mockPhotoRepo.findOneBy.mockResolvedValue(mockPhoto);
      mockPhotoRepo.save.mockResolvedValue(updatedPhoto);

      const updateData = {
        image: 'http://example.com/updated-photo.jpg',
        caption: 'Foto Actualizada'
      };

      const response = await request(app)
        .put(`/api/photos/${mockPhoto.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ photoData: updateData });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.caption).toBe('Foto Actualizada');
    });

    it('debe retornar error si no se proporcionan datos para actualizar', async () => {
      const response = await request(app)
        .put(`/api/photos/${mockPhoto.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/photos/:photoId', () => {
    it('debe eliminar una foto correctamente', async () => {
      mockPhotoRepo.delete.mockResolvedValue({ raw: {}, affected: 1 });

      const response = await request(app)
        .delete(`/api/photos/${mockPhoto.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar error si la foto no se encuentra al eliminar', async () => {
      mockPhotoRepo.delete.mockResolvedValue({ raw: {}, affected: 0 });

      const response = await request(app)
        .delete('/api/photos/non-existent-photo')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/photos/poi/:poiId', () => {
    it('debe obtener las fotos asociadas a un POI', async () => {
      mockPhotoRepo.find.mockResolvedValue([mockPhoto]);

      const response = await request(app)
        .get(`/api/photos/poi/${mockPoi.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].id).toBe(mockPhoto.id);
    });

    it('debe retornar una lista vacía si no hay fotos para el POI', async () => {
      mockPhotoRepo.find.mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/photos/poi/${mockPoi.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

});
