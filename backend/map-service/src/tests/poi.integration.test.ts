import request from 'supertest';
import { Server } from 'http';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { PointOfInterest, Category } from '../models/poi.model';
import { User } from '../../../auth-service/src/models/user.model';
import app from '../index';

var mockPoiRepository = mock<Repository<PointOfInterest>>();
let server: Server;

jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn((entity) => {
      if (entity.name === 'PointOfInterest') return mockPoiRepository;
      return mock<Repository<any>>();
    })
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined)
}));

// create mock data
const poiData = (overrides: Partial<Omit<PointOfInterest, 'id'>> = {}): Omit<PointOfInterest, 'id'> => ({
    name: 'POI de prueba',
    description: 'Descripción del POI de prueba',
    images: 'http://example.com/image.jpg',
    location: { type: 'Point', coordinates: [-58.3816, -34.6037] },
    category: Category.ESTACIONES,
    district: { id: 'district1' } as any,
    user: { id: 'user1' } as User,
    createdAt: new Date(),
    isBusiness: false,
    ...overrides,
});

// Mock del repositorio de POIs
jest.mock('../repositories/poi.repostory', () => {
    const mockRepo = {
        createPoi: jest.fn(),
        getPoiByNameAndLocation: jest.fn(),
        getPoiById: jest.fn(),
        getAllPois: jest.fn(),
        updatePoi: jest.fn(),
        deletePOI: jest.fn(),
        getPointsOfInterestByMapId: jest.fn(),
    };
    
    const MockPoiRepository = jest.fn().mockImplementation(function() {
        return mockRepo;
    });
    
    return {
        __esModule: true,
        default: MockPoiRepository
    };
});
// Interceptamos la verificación del token para que retorne siempre nuestro usuario mockeado
jest.mock('../../../auth-service/src/services/auth.service', () => ({
    verifyUserToken: jest.fn().mockResolvedValue({ userId: 'user1' })
  }));



  

beforeAll(async () => {
    server = app.listen(3012, () => {
      console.log('Servidor de integración de POI corriendo en el puerto 3012');
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
  
afterAll(async () => {
    jest.restoreAllMocks();
    if (server) {
      await new Promise((resolve) => server.close(() => resolve(undefined)));
    }
});

describe('POI Integration Tests', () => {
  let poiRepo: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked repository instance
    const PoiRepositoryMock = require('../repositories/poi.repostory').default;
    new PoiRepositoryMock();
    poiRepo = PoiRepositoryMock.mock.results[0].value;
  });

  describe('POST /api/poi - createPoiController', () => {
    it('should create a new POI', async () => {
      // Mock data
      const newPoi = { 
        name: 'Nuevo POI',
        description: 'Descripción del nuevo POI',
        images: 'http://example.com/image.jpg',
        location: { type: 'Point', coordinates: [-58.3816, -34.6037] },
        category: Category.ESTACIONES,
        district: { id: 'district1' } as any,
        user: { id: 'user1' } as User,
        createdAt: new Date(),
        isBusiness: false,
      };
      
      // Mock service response
      const serviceModule = require('../services/poi.service');
      // Observa que en la llamada al spy se omite createdAt ya que ese campo se agrega internamente
      const createPoiSpy = jest.spyOn(serviceModule, 'createPOI').mockResolvedValue(newPoi);

      const res = await request(app)
        .post('/api/poi')
        .set('Authorization', 'Bearer some-token')
        .send({
          name: newPoi.name,
          description: newPoi.description,
          images: newPoi.images,
          location: newPoi.location,
          category: newPoi.category,
          district: newPoi.district,
          user: newPoi.user,
          isBusiness: newPoi.isBusiness,
          // no enviamos createdAt ya que el controlador no lo espera del request
        });

      expect(res.status).toBe(201);
      expect(createPoiSpy).toHaveBeenCalledWith({
        name: newPoi.name,
        description: newPoi.description,
        images: newPoi.images,
        location: newPoi.location,
        category: newPoi.category,
        district: newPoi.district,
        user: newPoi.user,
        isBusiness: newPoi.isBusiness,
      }, 'user1');
    });

    it('should return 400 when missing parameters', async () => {      
      const poiData = {
        name: '',
        description: '',
        images: 'http://example.com/image.jpg',
        location: { type: 'Point', coordinates: [-58.3816, -34.6037] },
        category: Category.ESTACIONES,
        district: { id: 'district1' } as any,
        user: { id: 'user1' } as User,
        createdAt: new Date(),
        isBusiness: false,
      }; 
      const res = await request(app)
        .post('/api/poi')
        .set('Authorization', 'Bearer some-token')
        .send({
          poiData
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Faltan parámetros requeridos');
    });
  });

  describe('GET /api/poi/all - getAllPoisController', () => {
    it('should return all POIs', async () => {
      const pois = [
        { id: 'poi1', ...poiData() },
      ];
      
      const serviceModule = require('../services/poi.service');
      const getAllPoisSpy = jest.spyOn(serviceModule, 'getAllPOIs').mockResolvedValue(pois);

      const res = await request(app)
        .get('/api/poi/all');

      expect(res.status).toBe(200);
      expect(getAllPoisSpy).toHaveBeenCalled();
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.pois)).toBeTruthy();
      expect(res.body.pois.length).toBe(1);
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/poi.service');
      const getAllPoisSpy = jest.spyOn(serviceModule, 'getAllPOIs').mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .get('/api/poi/all');

        expect(res.status).toBe(500);
        expect(typeof res.body).toBe('object');
        
    });
  });

  describe('GET /api/poi/:id - getPoiByIdController', () => {
    it('should return POI by id', async () => {
      const poi = { 
        id: 'poi1', 
        ...poiData() 
      };
      
      const serviceModule = require('../services/poi.service');
      const getPoiByIdSpy = jest.spyOn(serviceModule, 'getPOIById').mockResolvedValue(poi);

      const res = await request(app)
        .get('/api/poi/poi1');

      expect(res.status).toBe(200);
      expect(getPoiByIdSpy).toHaveBeenCalledWith('poi1');
    });

    it('should return 404 when POI id is missing', async () => {
      const res = await request(app)
        .get('/api/poi/');

      expect(res.status).toBe(404);
      expect(res.body).not.toHaveProperty('message');
    });

    it('should return 404 when POI is not found', async () => {
      const serviceModule = require('../services/poi.service');
      const getPoiByIdSpy = jest.spyOn(serviceModule, 'getPOIById').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/poi/:poiNotFound');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('no encontrado');
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/poi.service');
      const getPoiByIdSpy = jest.spyOn(serviceModule, 'getPOIById').mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .get('/api/poi/poi1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Error al obtener');
    });
  });

  describe('GET /api/poi/map/:mapId - getPointsOfInterestByMapIdController', () => {
    it('should return POIs by map id', async () => {
      const pois = [
        { id: 'poi1', ...poiData() },
      ];
      
      const serviceModule = require('../services/poi.service');
      const getPointsSpy = jest.spyOn(serviceModule, 'getPointsOfInterestByMapId').mockResolvedValue(pois);

      const res = await request(app)
        .get('/api/poi/map/map1');

      expect(res.status).toBe(200);
      expect(getPointsSpy).toHaveBeenCalledWith('map1');
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.pois)).toBeTruthy();
      expect(res.body.pois.length).toBe(1);
    });

    it('should return 400 when missing mapId', async () => {
      const res = await request(app)
        .get('/api/poi/map/%20');

      expect(res.status).toBe(400);
    });
  });

});