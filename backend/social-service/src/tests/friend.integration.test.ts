import request from 'supertest';
import { Server } from 'http';
import { mock } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { Friend, FriendStatus, RequestType } from '../models/friend.model';
import { User } from '../../../auth-service/src/models/user.model';
import app from '../index';

var mockFriendRepository = mock<Repository<Friend>>();
let server: Server;

jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    isInitialized: true,
    initialize: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn((entity) => {
      if (entity.name === 'Friend') return mockFriendRepository;
      return mock<Repository<any>>();
    })
  },
  initializeDatabase: jest.fn().mockResolvedValue(undefined)
}));

// create mock data
const friendData = (overrides: Partial<Omit<Friend, 'id'>> = {}): Omit<Friend, 'id'> => ({
    requester: { id: 'user1' } as User,
    recipient: { id: 'user2' } as User,
    status: FriendStatus.PENDING,
    requestType: RequestType.FRIEND,
    map: {
      id: 'map1',
      name: 'Default Map',
      description: 'Mapa para test',
      createdAt: new Date(),
      is_colaborative: false,
      users_joined: [],
      user_created: { id: 'user1' } as User,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
});

// Mock del repositorio de amigos
jest.mock('../repositories/friend.repository', () => {
    const mockRepo = {
        findExistingFriendship: jest.fn(),
        createFriend: jest.fn(),
        updateFriendStatus: jest.fn(),
        findAllByIdAndStatus: jest.fn(),
        getFriendById: jest.fn(),
        findAllUsersByName: jest.fn(),
        getFriends: jest.fn(),
        getPendingRequestsForRecipient: jest.fn(),
    };
    
    const MockFriendRepository = jest.fn().mockImplementation(function() {
        return mockRepo;
    });
    
    return {
        __esModule: true,
        default: MockFriendRepository
    };
});

beforeAll(async () => {
    server = app.listen(3005, () => {
      console.log('Servidor de integración de Friend corriendo en el puerto 3005');
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
  
afterAll(async () => {
    jest.restoreAllMocks();
    if (server) {
      await new Promise((resolve) => server.close(() => resolve(undefined)));
    }
});

describe('Friend Integration Tests', () => {
  let friendRepo: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked repository instance
    const FriendRepositoryMock = require('../repositories/friend.repository').default;
    new FriendRepositoryMock();
    friendRepo = FriendRepositoryMock.mock.results[0].value;
  });

  describe('POST /create - createFriendController', () => {
    it('should create a new friend request', async () => {
      // Mock data
      const newFriend = { 
        id: 'friend1', 
        ...friendData(),
        requester: { id: 'user1' } as User,
        recipient: { id: 'user2' } as User
      };
      
      // Mock service response
      const serviceModule = require('../services/friend.service');
      const sendRequestFriendSpy = jest.spyOn(serviceModule, 'sendRequestFriend').mockResolvedValue(newFriend);

      const res = await request(app)
        .post('/api/friends/create')
        .send({
          requesterId: 'user1',
          receiverId: 'user2'
        });

      expect(res.status).toBe(201);
      expect(sendRequestFriendSpy).toHaveBeenCalledWith('user1', 'user2', undefined);
    });

    it('should return 400 when missing parameters', async () => {      
      const res = await request(app)
        .post('/api/friends/create')
        .send({
          requesterId: '',
          receiverId: ''
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Faltan parámetros requeridos.');
    });
  });

  describe('GET /search/:nameData - listSearchUserController', () => {
    it('should return users based on search criteria', async () => {
      const users = [
        { id: 'user1', profile: { username: 'johnDoe' } },
        { id: 'user2', profile: { username: 'johnSmith' } }
      ];
      
      const serviceModule = require('../services/friend.service');
      const listSearchUserSpy = jest.spyOn(serviceModule, 'listSearchUser')
        .mockResolvedValue(users);

      const res = await request(app)
        .get('/api/friends/search/john');

      expect(res.status).toBe(200);
      expect(listSearchUserSpy).toHaveBeenCalledWith('john');
      expect(res.body).toEqual(users);
    });

    it('should return 400 when nameData is missing', async () => {
      const res = await request(app)
        .get('/api/friends/search/');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('Error al obtener solicitud de amistad por ID:');
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/friend.service');
      const listSearchUserSpy = jest.spyOn(serviceModule, 'listSearchUser')
        .mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .get('/api/friends/search/john');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Error al buscar usuarios:');
    });
  });

  describe('GET /:friendId - findFriendByIdController', () => {
    it('should return friend by id', async () => {
      const friend = { 
        id: 'friend1', 
        ...friendData() 
      };
      
      const serviceModule = require('../services/friend.service');
      const findFriendByIdSpy = jest.spyOn(serviceModule, 'findFriendById')
        .mockResolvedValue(friend);

      const res = await request(app)
        .get('/api/friends/friend1');

      expect(res.status).toBe(200);
      expect(findFriendByIdSpy).toHaveBeenCalledWith('friend1');
    });

    it('should return 404 when friendId is missing', async () => {
      const res = await request(app)
        .get('/api/friends/');

      expect(res.status).toBe(404);
      expect(res.body).not.toHaveProperty('message');
    });

    it('should return 404 when friend is not found', async () => {
      const serviceModule = require('../services/friend.service');
      const findFriendByIdSpy = jest.spyOn(serviceModule, 'findFriendById')
        .mockResolvedValue(null);

      const res = await request(app)
        .get('/api/friends/:friend33');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('no encontrado');
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/friend.service');
      const findFriendByIdSpy = jest.spyOn(serviceModule, 'findFriendById')
        .mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .get('/api/friends/friend1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Error al obtener solicitud de amistad por ID:');
    });
  });

  describe('PUT /update/:friendId/:status - updateFriendStatusController', () => {
    it('should update friend status', async () => {
      const updateResult = { 
        success: true, 
        message: 'Solicitud de amistad aceptada correctamente' 
      };
      
      const serviceModule = require('../services/friend.service');
      const updateFriendStatusSpy = jest.spyOn(serviceModule, 'updateFriendStatus')
        .mockResolvedValue(updateResult);

      const res = await request(app).put('/api/friends/update/friend1/ACCEPTED');

      expect(res.status).toBe(200);
      expect(updateFriendStatusSpy).toHaveBeenCalledWith('friend1', FriendStatus.ACCEPTED);
      expect(res.body).toEqual(updateResult);
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/friend.service');
      const updateFriendStatusSpy = jest.spyOn(serviceModule, 'updateFriendStatus')
        .mockRejectedValue(new Error('Service error'));

      const res = await request(app)
        .put('/api/friends/update/friend1/ACCEPTED');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Error al actualizar el estado de la amistad:');
    });
  });

  describe('GET /list/:status/:userId - listFriendsController', () => {
    it('should return friends by status and userId', async () => {
      const friends = [
        { id: 'friend1', ...friendData() },
        { id: 'friend2', ...friendData() }
      ];
      
      const serviceModule = require('../services/friend.service');
      const listFriendsSpy = jest.spyOn(serviceModule, 'listFriends').mockResolvedValue(friends);

      const res = await request(app).get('/api/friends/list/PENDING/user1');

      expect(res.status).toBe(200);
      expect(listFriendsSpy).toHaveBeenCalledWith(FriendStatus.PENDING, 'user1');
    });

    it('should return 400 when parameters are missing', async () => {
      const res = await request(app).get('/api/friends/list/PENDING/');

      expect(res.status).toBe(404);
      expect(res.body).not.toHaveProperty('message');
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/friend.service');
      const listFriendsSpy = jest.spyOn(serviceModule, 'listFriends').mockRejectedValue(new Error('Service error'));

      const res = await request(app).get('/api/friends/list/PENDING/user1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Error al listar solicitudes de amistad:');
    });
  });

  describe('GET /friends/:userId - getFriendsController', () => {
    it('should return friends by userId', async () => {
      const friends = [
        { id: 'user2', profile: { username: 'user2' } },
        { id: 'user3', profile: { username: 'user3' } }
      ];
      
      const serviceModule = require('../services/friend.service');
      const getFriendsSpy = jest.spyOn(serviceModule, 'getFriends').mockResolvedValue(friends);

      const res = await request(app).get('/api/friends/friends/user1');

      expect(res.status).toBe(200);
      expect(getFriendsSpy).toHaveBeenCalledWith('user1');
      expect(res.body).toEqual(friends);
    });

    it('should return 500 when adding friendId parameter as it is not expected', async () => {
      const res = await request(app).get('/api/friends/friends/');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toBe('Error al obtener solicitud de amistad por ID:');
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/friend.service');
      const getFriendsSpy = jest.spyOn(serviceModule, 'getFriends').mockRejectedValue(new Error('Service error'));

      const res = await request(app).get('/api/friends/friends/user1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Error al obtener lista de amigos:');
    });
  });

  describe('GET /request/:userId - getPendingRequestsForRecipientController', () => {
    it('should return pending requests for userId', async () => {
      const pendingRequests = [
        { id: 'friend1', ...friendData() },
        { id: 'friend2', ...friendData() }
      ];
      
      const serviceModule = require('../services/friend.service');
      const getPendingRequestsSpy = jest.spyOn(serviceModule, 'getPendingRequestsForRecipient').mockResolvedValue(pendingRequests);

      const res = await request(app).get('/api/friends/request/user1');

      expect(res.status).toBe(200);
      expect(getPendingRequestsSpy).toHaveBeenCalledWith('user1');
    });

    it('should return 500 when service throws an error', async () => {
      const serviceModule = require('../services/friend.service');
      const getPendingRequestsSpy = jest.spyOn(serviceModule, 'getPendingRequestsForRecipient').mockRejectedValue(new Error('Service error'));

      const res = await request(app).get('/api/friends/request/user1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Error al obtener solicitudes pendientes para el destinatario:');
    });
  });
});