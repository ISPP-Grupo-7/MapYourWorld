import { Role, User } from '../../../auth-service/src/models/user.model';
import { AppDataSource } from '../../../database/appDataSource';

// Simulamos el repositorio de amigos
jest.mock('../repositories/friend.repository', () => {
  const mockRepo = {
    createFriend: jest.fn(),
    findExistingFriendship: jest.fn(),
    findAllByIdAndStatus: jest.fn(),
    getFriendById: jest.fn(),
    findAllUsersByName: jest.fn(),
    updateFriendStatus: jest.fn()
  };
  
  return jest.fn(() => mockRepo);
});

// Simulamos AppDataSource
jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    getRepository: jest.fn()
  }
}));

// Importamos los servicios después de los mocks
import { 
  
  listFriends, 
  findFriendById, 
  listSearchUser, 
  updateFriendStatus 
} from '../../../social-service/src/services/friend.service';
import { Friend, FriendStatus } from '../../../social-service/src/models/friend.model';
import FriendRepository from '../../../social-service/src/repositories/friend.repository';

describe('Friend Service', () => {
  let repoInstance: any;
  let mockUserRepository: any;
  
  // Usuario de prueba para reutilizar
  const requester = { id: 'user1', username: 'User 1' } as unknown as User;
  const recipient = { id: 'user2', username: 'User 2' } as unknown as User;
  // Datos de ejemplo completos del modelo User
  const sampleUsers: User[] = [
    {
      id: 'user1',
      email: 'user1@example.com',
      password: 'hashedPassword1',
      role: Role.USER,
      is_active: true,
      token_data: "",
      // Se requiere un objeto profile. Se usa "as any" si aún no se implementa completamente.
      profile: {} as any,
      sentFriendRequests: [],
      receivedFriendRequests: [],
      maps_joined: [],
      subscription: {} as any,
      userDistrict: []
    },
    {
      id: 'user2',
      email: 'user2@example.com',
      password: 'hashedPassword2',
      role: Role.USER,
      is_active: true,
      token_data: "",
      profile: {} as any,
      sentFriendRequests: [],
      receivedFriendRequests: [],
      maps_joined: [],
      subscription: {} as any,
      userDistrict: []
    }
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configuración de mocks para cada prueba
    mockUserRepository = {
      findOne: jest.fn()
    };
    
    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockUserRepository);
    
    // Se obtiene la instancia del repositorio simulado
    const FriendRepositoryMock = FriendRepository as jest.Mock;
    // Crear una nueva instancia del mock antes de cada test
    new FriendRepositoryMock();
    repoInstance = FriendRepositoryMock.mock.results[0].value;
  });


  describe('listFriends', () => {
    it('debe retornar la lista de amigos con el estado especificado', async () => {
      // Arrange
      const userId = 'user1';
      const status = FriendStatus.ACCEPTED;
      const mockFriends = [
        { id: 'friend1', requester, recipient, status, createdAt: new Date() },
        { id: 'friend2', requester: recipient, recipient: requester, status, createdAt: new Date() }
      ];
      
      repoInstance.findAllByIdAndStatus.mockResolvedValue(mockFriends);
      
      // Act
      const result = await listFriends(status, userId);
      
      // Assert
      expect(repoInstance.findAllByIdAndStatus).toHaveBeenCalledWith(userId, status);
      expect(result).toEqual(mockFriends);
    });
  });

  describe('findFriendById', () => {
    it('debe retornar una solicitud de amistad por su ID', async () => {
      // Arrange
      const friendId = 'friend1';
      const mockFriend = { 
        id: friendId, 
        requester, 
        recipient, 
        status: FriendStatus.ACCEPTED,
        createdAt: new Date()
      };
      
      repoInstance.getFriendById.mockResolvedValue(mockFriend);
      
      // Act
      const result = await findFriendById(friendId);
      
      // Assert
      expect(repoInstance.getFriendById).toHaveBeenCalledWith(friendId);
      expect(result).toEqual(mockFriend);
    });

    it('debe lanzar un error si la solicitud de amistad no existe', async () => {
      // Arrange
      const friendId = 'nonexistent';
      repoInstance.getFriendById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(findFriendById(friendId))
        .rejects.toThrow(`Solicitud de amistad con ID ${friendId} no encontrada`);
    });
  });

  describe('listSearchUser', () => {
    it('debe retornar usuarios que coincidan con el criterio de búsqueda', async () => {
      // Arrange
      const searchName = 'john';

      const completeMockUsers: User[] = [
        {
          id: 'user1',
          email: 'john@example.com',
          password: 'hashedPassword1',
          role: Role.USER,
          is_active: true,
          token_data: "",
          profile: {} as any,
          sentFriendRequests: [],
          receivedFriendRequests: [],
          maps_joined: [],
          subscription: {} as any,
          userDistrict: []
        },
        {
          id: 'user2',
          email: 'johnny@example.com',
          password: 'hashedPassword2',
          role: Role.USER,
          is_active: true,
          token_data: "",
          profile: {} as any,
          sentFriendRequests: [],
          receivedFriendRequests: [],
          maps_joined: [],
          subscription: {} as any,
          userDistrict: []
        }
      ];
      repoInstance.findAllUsersByName.mockResolvedValue(completeMockUsers);      
      
      // Act
      const result = await listSearchUser(searchName);
      
      // Assert
      expect(repoInstance.findAllUsersByName).toHaveBeenCalledWith(searchName);
      expect(result).toEqual(completeMockUsers);
    });
  });

  describe('updateFriendStatus', () => {
    it('debe actualizar el estado de amistad a ACCEPTED exitosamente', async () => {
      // Arrange
      const friendId = 'friend1';
      const status = FriendStatus.ACCEPTED;
      const updatedFriend = { 
        id: friendId, 
        requester,
        recipient,
        status: FriendStatus.ACCEPTED,
        createdAt: new Date()
      } as Friend;
      
      repoInstance.updateFriendStatus.mockResolvedValue(updatedFriend);
      
      // Act
      const result = await updateFriendStatus(friendId, status);
      
      // Assert
      expect(repoInstance.updateFriendStatus).toHaveBeenCalledWith(friendId, status);
      expect(result).toEqual({ 
        success: true, 
        message: 'Solicitud de amistad aceptada correctamente' 
      });
    });

    it('debe actualizar el estado de amistad a BLOCKED exitosamente', async () => {
      // Arrange
      const friendId = 'friend1';
      const status = FriendStatus.BLOCKED;
      const updatedFriend = { 
        id: friendId, 
        requester,
        recipient,
        status: FriendStatus.BLOCKED,
        createdAt: new Date()
      } as Friend;
      
      repoInstance.updateFriendStatus.mockResolvedValue(updatedFriend);
      
      // Act
      const result = await updateFriendStatus(friendId, status);
      
      // Assert
      expect(repoInstance.updateFriendStatus).toHaveBeenCalledWith(friendId, status);
      expect(result).toEqual({ 
        success: true, 
        message: 'Solicitud de amistad bloqueada correctamente' 
      });
    });

    it('debe lanzar un error si no se actualiza correctamente el estado', async () => {
      // Arrange
      const friendId = 'friend1';
      const status = FriendStatus.ACCEPTED;
      const updatedFriend = { 
        id: friendId, 
        requester,
        recipient,
        status: FriendStatus.PENDING, // Estado diferente al solicitado
        createdAt: new Date()
      } as Friend;
      
      repoInstance.updateFriendStatus.mockResolvedValue(updatedFriend);
      
      // Act & Assert
      await expect(updateFriendStatus(friendId, status))
        .rejects.toThrow('Error al actualizar el estado de la solicitud de amistad');
    });
  });
});