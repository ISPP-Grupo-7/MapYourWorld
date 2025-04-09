// Mocks de repositorios de amigos, autenticación y mapas
const mockedFindExistingFriendship = jest.fn();
const mockedCreateFriend = jest.fn();
const mockedUpdateFriendStatus = jest.fn();
const mockedFindAllByIdAndStatus = jest.fn();
const mockedGetFriendById = jest.fn();
const mockedFindAllUsersByName = jest.fn();
const mockedGetFriends = jest.fn();
const mockedGetPendingRequestsForRecipient = jest.fn();

const mockedAuthFindById = jest.fn();
const mockedMapGetOnlyMapById = jest.fn();
const mockedMapGetUsersOnMapById = jest.fn();

// Mockear el repositorio de friends
jest.mock('../repositories/friend.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    findExistingFriendship: mockedFindExistingFriendship,
    createFriend: mockedCreateFriend,
    updateFriendStatus: mockedUpdateFriendStatus,
    findAllByIdAndStatus: mockedFindAllByIdAndStatus,
    getFriendById: mockedGetFriendById,
    findAllUsersByName: mockedFindAllUsersByName,
    getFriends: mockedGetFriends,
    getPendingRequestsForRecipient: mockedGetPendingRequestsForRecipient,
  })),
}));

// Mockear repositorio de Auth
jest.mock('../../../auth-service/src/repositories/auth.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    findById: mockedAuthFindById,
  })),
}));

// Mockear repositorio de Map
jest.mock('../../../map-service/src/repositories/map.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getOnlyMapById: mockedMapGetOnlyMapById,
    getUsersOnMapById: mockedMapGetUsersOnMapById,
  })),
}));

import { Role, User } from '../../../auth-service/src/models/user.model';
import { Friend, FriendStatus, RequestType } from '../models/friend.model';
import {
  sendRequestFriend,
  listFriends,
  findFriendById,
  listSearchUser,
  updateFriendStatus,
  getFriends,
  getPendingRequestsForRecipient,
} from '../services/friend.service';

// Creamos un helper para generar datos válidos de amistad
const createValidFriendData = (overrides: Partial<Omit<Friend, 'id'>> = {}): Omit<Friend, 'id'> => ({
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

describe('Friend Service', () => {
  // Configuración de datos dummy y fecha fija, similar a district tests
  const dummyUser: User = {
    id: 'user1-uuid',
    email: 'user1@example.com',
    role: Role.USER,
    password: 'secret',
    is_active: true,
    token_data: undefined,
    profile: {} as any,
    sentFriendRequests: [],
    receivedFriendRequests: [],
    maps_joined: [],
    subscription: {} as any,
    userDistrict: [],
  };

  const dummyFriendData: Omit<Friend, 'id'> = {
    requester: { id: 'user1-uuid' } as User,
    recipient: { id: 'user2-uuid' } as User,
    status: FriendStatus.PENDING,
    requestType: RequestType.FRIEND,
    map: {
      id: 'map1-uuid',
      name: 'Test Map',
      description: 'Mapa para test',
      createdAt: new Date(),
      is_colaborative: false,
      users_joined: [],
      user_created: { id: 'user1-uuid' } as User,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFriend', () => {
    it('debe crear una nueva solicitud de amistad exitosamente', async () => {
      // Configuramos mocks:
      mockedAuthFindById.mockResolvedValueOnce(dummyFriendData.requester);
      mockedAuthFindById.mockResolvedValueOnce(dummyFriendData.recipient);
      mockedFindExistingFriendship.mockResolvedValue(null);
      const expectedFriend: Friend = { id: 'friend1-uuid', ...dummyFriendData };
      mockedCreateFriend.mockResolvedValue(expectedFriend);

      const res = await sendRequestFriend(dummyFriendData.requester.id, dummyFriendData.recipient.id);
      expect(mockedCreateFriend).toHaveBeenCalled();
      expect(res).toEqual(expectedFriend);
    });

    it('debe lanzar error si el receptor y el solicitante son iguales', async () => {
      await expect(sendRequestFriend('user1-uuid', 'user1-uuid'))
        .rejects.toThrow("El receptor y el solicitante deben ser distintos.");
    });
  });

  describe('listFriends', () => {
    it('debe devolver una lista de solicitudes de amistad para un usuario y estado dado', async () => {
      const dummyFriends: Friend[] = [
        { id: 'friend1-uuid', ...dummyFriendData },
        { id: 'friend2-uuid', ...dummyFriendData, recipient: { id: 'user3-uuid' } as User },
      ];
      mockedFindAllByIdAndStatus.mockResolvedValue(dummyFriends);

      const result = await listFriends(FriendStatus.PENDING, 'user1-uuid');
      expect(mockedFindAllByIdAndStatus).toHaveBeenCalledWith('user1-uuid', FriendStatus.PENDING);
      expect(result).toEqual(dummyFriends);
    });
  });

  describe('findFriendById', () => {
    it('debe retornar la solicitud de amistad si se encuentra', async () => {
      const expectedFriend: Friend = { id: 'friend1-uuid', ...dummyFriendData };
      mockedGetFriendById.mockResolvedValue(expectedFriend);

      const result = await findFriendById('friend1-uuid');
      expect(mockedGetFriendById).toHaveBeenCalledWith('friend1-uuid');
      expect(result).toEqual(expectedFriend);
    });

    it('debe lanzar error si no se encuentra la solicitud de amistad', async () => {
      mockedGetFriendById.mockResolvedValue(null);
      await expect(findFriendById('friend1-uuid')).rejects.toThrow('Solicitud de amistad con ID friend1-uuid no encontrada');
    });
  });

  describe('listSearchUser', () => {
    it('debe retornar una lista de usuarios que coincidan con el criterio de búsqueda', async () => {
      const dummyUsers: User[] = [{ id: 'user1-uuid' } as User, { id: 'user2-uuid' } as User];
      mockedFindAllUsersByName.mockResolvedValue(dummyUsers);

      const result = await listSearchUser('usuario');
      expect(mockedFindAllUsersByName).toHaveBeenCalledWith('usuario');
      expect(result).toEqual(dummyUsers);
    });
  });

  describe('updateFriendStatus', () => {
    it('debe actualizar el estado de la solicitud de amistad a ACCEPTED y retornar mensaje de éxito', async () => {
      const updatedFriend = { id: 'friend1-uuid', status: FriendStatus.ACCEPTED };
      mockedUpdateFriendStatus.mockResolvedValue(updatedFriend);

      const result = await updateFriendStatus('friend1-uuid', FriendStatus.ACCEPTED);
      expect(mockedUpdateFriendStatus).toHaveBeenCalledWith('friend1-uuid', FriendStatus.ACCEPTED);
      expect(result).toEqual({
        success: true,
        message: 'Solicitud de amistad aceptada correctamente',
      });
    });
  });

  describe('getFriends', () => {
    it('debe retornar una lista de amigos dado un ID de usuario', async () => {
      const friendUser: User = { id: 'user1-uuid', email: 'user1@example.com', password: 'secret', role: Role.USER, is_active: true, token_data: "", profile: {} as any, sentFriendRequests: [], receivedFriendRequests: [], maps_joined: [], subscription: {} as any, userDistrict: [] };
      mockedGetFriends.mockResolvedValue([friendUser]);

      const result = await getFriends('user1-uuid');
      expect(mockedGetFriends).toHaveBeenCalledWith('user1-uuid');
      expect(result).toEqual([friendUser]);
    });
  });

  describe('getPendingRequestsForRecipient', () => {
    it('debe devolver una lista de peticiones pendientes para un usuario receptor', async () => {
      const pendingRequest: Friend = { id: 'friend1-uuid', ...dummyFriendData };
      mockedGetPendingRequestsForRecipient.mockResolvedValue([pendingRequest]);

      const result = await getPendingRequestsForRecipient('user2-uuid');
      expect(mockedGetPendingRequestsForRecipient).toHaveBeenCalledWith('user2-uuid');
      expect(result).toEqual([pendingRequest]);
    });
  });
});