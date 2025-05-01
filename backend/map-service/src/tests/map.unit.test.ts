// map.service.spec.ts

// --- Mocks de dependencias ---

// Mocks para MapRepository
const createMapColaborativoMock = jest.fn();
const createMapMock = jest.fn();
const getMapByIdMock = jest.fn();
const getUsersOnMapByIdMock = jest.fn();
const updateMapMock = jest.fn();
const deleteMapMock = jest.fn();
const getPrincipalMapForUserMock = jest.fn();
const getCollaborativeMapsForUserMock = jest.fn();

jest.mock('../repositories/map.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createMap: createMapMock,
    getMapById: getMapByIdMock,
    createMapColaborativo: createMapColaborativoMock,
    getUsersOnMapById: getUsersOnMapByIdMock,
    updateMap: updateMapMock,
    deleteMap: deleteMapMock,
    getPrincipalMapForUser: getPrincipalMapForUserMock,
    getCollaborativeMapsForUser: getCollaborativeMapsForUserMock,
  })),
  _createMapColaborativoMock: createMapColaborativoMock,
}));

// Mocks para AuthRepository
const findByIdMock = jest.fn();
jest.mock('../../../auth-service/src/repositories/auth.repository', () => {
  return {
    __esModule: true, // Esto es importante para que funcione bien con `import default`
    default: jest.fn().mockImplementation(() => ({
      findById: findByIdMock,
    })),
    _findByIdMock: findByIdMock,
  };
});

// Mocks para UserDistrictRepository
const createUserDistrictMock = jest.fn();
jest.mock('../repositories/user-district.repository', () => {
  return {
    __esModule: true, // importa para que Jest sepa que hay una exportación default
    default: jest.fn().mockImplementation(() => ({
      createUserDistrict: createUserDistrictMock,
      // aquí puedes añadir más métodos si los necesitas
    })),
  };
});

// Mock para district.service
jest.mock('../../../map-service/src/services/district.service', () => ({
  createDistricts: jest.fn().mockResolvedValue(true),
}));




import { Map } from '../models/map.model';
import { Role, User } from '../../../auth-service/src/models/user.model';
import { UserDistrict } from '../models/user-district.model';


// --- Fin de mocks ---

describe('map.service', () => {
  let service: any;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    service = require('../services/map.service');
  });

  describe('createMap', () => {
    it('debe crear un mapa exitosamente cuando el usuario existe', async () => {
      // Datos dummy del usuario
      const dummyUser: User = {
        id: 'user1',
        email: 'user1@example.com',
        role: Role.USER,
        password: 'dummy',
        is_active: true,
        token_data: '',
        profile: {
          id: 'profile1',
          username: 'user1',
          firstName: 'User',
          lastName: 'One',
        },
        sentFriendRequests: [],
        receivedFriendRequests: [],
        maps_joined: [],
        subscription: {} as any,
        userDistrict: [],
      };
      findByIdMock.mockResolvedValue(dummyUser);

      // Datos dummy del mapa a crear
      const dummyMap: Map = {
        id: 'map1',
        name: 'Mapa personal',
        description: 'Mapa para el usuario',
        createdAt: new Date(),
        is_colaborative: false,
        user_created: dummyUser,
        users_joined: [],
      };
      createMapMock.mockResolvedValue(dummyMap);

      const result = await service.createMap('user1');

      expect(findByIdMock).toHaveBeenCalledWith('user1');
      expect(createMapMock).toHaveBeenCalled();
      expect(result).toEqual(dummyMap);
    });

    it('debe lanzar error si el usuario no se encuentra', async () => {
      findByIdMock.mockResolvedValue(null);

      await expect(service.createMap('inexistente')).rejects.toThrow(
        'User with id inexistente not found'
      );
    });
  });

  describe('createColaborativeMap', () => {
    it('debe crear un mapa colaborativo exitosamente', async () => {
      const mapData: Omit<Map, 'id'> = {
        name: 'Mapa colaborativo',
        description: 'Mapa para colaboración',
        createdAt: new Date(),
        is_colaborative: true,
        // Para el test se puede simular que estas propiedades no son relevantes
        users_joined: [],
        user_created: {
          id: 'dummy-user',
          email: 'dummy@example.com',
          role: Role.USER,
          password: 'dummy',
          is_active: true,
          token_data: '',
          profile: {
            id: 'profile1',
            username: 'dummyUser',
            firstName: 'Dummy',
            lastName: 'User',
          },
          sentFriendRequests: [],
          receivedFriendRequests: [],
          maps_joined: [],
          subscription: {} as any,
          userDistrict: [],
        } as User,
      };

      const dummyMap: Map = { id: 'mapColab1', ...mapData };
      createMapColaborativoMock.mockResolvedValue(dummyMap);

      const dummyUser: User = {
        id: 'user1',
        email: 'creator@example.com',
        role: Role.USER,
        password: 'hashed_dummy',
        is_active: true,
        token_data: '',
        profile: {
          id: 'profile1',
          username: 'creatorUser',
          firstName: 'Creator',
          lastName: 'User',
        },
        sentFriendRequests: [],
        receivedFriendRequests: [],
        maps_joined: [],
        subscription: {} as any,
        userDistrict: [],
      };
      findByIdMock.mockResolvedValue(dummyUser);

      const dummyUserDistrict: UserDistrict = {
        id: 'ud1',
        color: 'pepe',
        user: dummyUser,
      } as UserDistrict;
      createUserDistrictMock.mockResolvedValue(dummyUserDistrict);

      const result = await service.createColaborativeMap(mapData, 'user1');

      expect(createMapColaborativoMock).toHaveBeenCalledWith(mapData, 'user1');
      const { createDistricts } = require('../../../map-service/src/services/district.service');
      expect(createDistricts).toHaveBeenCalledWith(dummyMap.id);
      expect(findByIdMock).toHaveBeenCalledWith('user1');
      expect(createUserDistrictMock).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'pepe', user: dummyUser })
      );
      expect(result).toEqual(dummyMap);
    });

    it('debe lanzar error si no se encuentra el usuario creador', async () => {
      const mapData: Omit<Map, 'id'> = {
        name: 'Mapa colaborativo',
        description: 'Mapa para colaboración',
        createdAt: new Date(),
        is_colaborative: true,
        users_joined: [],
        user_created: {} as User,
      };
      const dummyMap: Map = { id: 'mapColab1', ...mapData };

      createMapColaborativoMock.mockResolvedValue(dummyMap);
      findByIdMock.mockResolvedValue(null);

      await expect(service.createColaborativeMap(mapData, 'user_inexistente')).rejects.toThrow(
        'No se encuentra un usuario con el id user_inexistente'
      );
    });
  });

  describe('getMapById', () => {
    it('debe retornar el mapa cuando se encuentra', async () => {
      const dummyMap: Map = {
        id: 'map1',
        name: 'Mapa de prueba',
        description: 'Descripción de prueba',
        createdAt: new Date(),
        is_colaborative: false,
        user_created: {} as User,
        users_joined: [],
      };
      getMapByIdMock.mockResolvedValue(dummyMap);

      const result = await service.getMapById('map1');

      expect(getMapByIdMock).toHaveBeenCalledWith('map1');
      expect(result).toEqual(dummyMap);
    });

    it('debe lanzar error cuando el mapa no se encuentra', async () => {
      getMapByIdMock.mockResolvedValue(null);

      await expect(service.getMapById('inexistente')).rejects.toThrow(
        'mapa con ID inexistente no encontrado'
      );
    });
  });

  describe('getMapUsersById', () => {
    it('debe retornar los usuarios asociados al mapa', async () => {
      const dummyUsers: User[] = [
        {
          id: 'user1',
          email: 'user1@example.com',
          role: Role.USER,
          password: 'dummy',
          is_active: true,
          token_data: '',
          profile: {
            id: 'profile1',
            username: 'user1',
            firstName: 'User',
            lastName: 'One',
          },
          sentFriendRequests: [],
          receivedFriendRequests: [],
          maps_joined: [],
          subscription: {} as any,
          userDistrict: [],
        },
      ];
      getUsersOnMapByIdMock.mockResolvedValue(dummyUsers);

      const result = await service.getMapUsersById('map1');

      expect(getUsersOnMapByIdMock).toHaveBeenCalledWith('map1');
      expect(result).toEqual(dummyUsers);
    });

    it('debe lanzar error si no hay usuarios asociados', async () => {
      getUsersOnMapByIdMock.mockResolvedValue(null);

      await expect(service.getMapUsersById('map-inexistente')).rejects.toThrow(
        'mapa con ID map-inexistente sin usuarios asociados'
      );
    });
  });

  describe('updateMap', () => {
    it('debe actualizar el mapa cuando se proveen datos válidos', async () => {
      const updateData = {
        name: 'Nuevo nombre',
        description: 'Nueva descripción',
        // Se pueden incluir otras propiedades
      };
      const dummyMap: Map = {
        id: 'map1',
        name: updateData.name,
        description: updateData.description,
        createdAt: new Date(),
        is_colaborative: false,
        user_created: {} as User,
        users_joined: [],
      };
      updateMapMock.mockResolvedValue(dummyMap);

      const result = await service.updateMap('map1', updateData);

      expect(updateMapMock).toHaveBeenCalledWith('map1', updateData);
      expect(result).toEqual(dummyMap);
    });

    it('debe lanzar error si faltan datos obligatorios', async () => {
      const incompleteData = {
        name: '',
        description: '',
      };

      await expect(service.updateMap('map1', incompleteData)).rejects.toThrow(
        'No pueden faltar algunos datos importantes como el nombre o coordenadas.'
      );
    });
  });

  describe('deleteMap', () => {
    it('debe eliminar el mapa exitosamente cuando existe', async () => {
      const dummyMap: Map = {
        id: 'map1',
        name: 'Mapa a eliminar',
        description: 'Descripción',
        createdAt: new Date(),
        is_colaborative: false,
        user_created: {} as User,
        users_joined: [],
      };
      getMapByIdMock.mockResolvedValue(dummyMap);
      deleteMapMock.mockResolvedValue(true);

      const result = await service.deleteMap('map1', 'user1');

      expect(getMapByIdMock).toHaveBeenCalledWith('map1');
      expect(deleteMapMock).toHaveBeenCalledWith('map1', 'user1');
      expect(result).toEqual({ success: true, message: 'Mapa eliminado correctamente' });
    });

    it('debe retornar error si el mapa no existe', async () => {
      getMapByIdMock.mockResolvedValue(null);

      const result = await service.deleteMap('map-inexistente', 'user1');

      expect(result).toEqual({
        success: false,
        message: 'Mapa con ID map-inexistente no encontrado',
      });
    });
  });

  describe('getPrincipalMapForUser', () => {
    it('debe retornar el mapa principal para el usuario', async () => {
      const dummyMap: Map = {
        id: 'map1',
        name: 'Mapa principal',
        description: 'Descripción principal',
        createdAt: new Date(),
        is_colaborative: false,
        user_created: {} as User,
        users_joined: [],
      };
      getPrincipalMapForUserMock.mockResolvedValue(dummyMap);

      const result = await service.getPrincipalMapForUser('user1');

      expect(getPrincipalMapForUserMock).toHaveBeenCalledWith('user1');
      expect(result).toEqual(dummyMap);
    });

    it('debe lanzar error si no se encuentra el mapa principal', async () => {
      getPrincipalMapForUserMock.mockResolvedValue(null);

      await expect(service.getPrincipalMapForUser('user1')).rejects.toThrow(
        'No se encontro el mapa principal del usuario'
      );
    });
  });

  describe('getCollaborativeMapsForUser', () => {
    it('debe retornar los mapas colaborativos para el usuario', async () => {
      const dummyMaps: Map[] = [
        {
          id: 'map1',
          name: 'Mapa colaborativo 1',
          description: 'Descripción 1',
          createdAt: new Date(),
          is_colaborative: true,
          user_created: {} as User,
          users_joined: [],
        },
        {
          id: 'map2',
          name: 'Mapa colaborativo 2',
          description: 'Descripción 2',
          createdAt: new Date(),
          is_colaborative: true,
          user_created: {} as User,
          users_joined: [],
        },
      ];
      getCollaborativeMapsForUserMock.mockResolvedValue(dummyMaps);

      const result = await service.getCollaborativeMapsForUser('user1');

      expect(getCollaborativeMapsForUserMock).toHaveBeenCalledWith('user1');
      expect(result).toEqual(dummyMaps);
    });

    it('debe retornar un arreglo vacío si no se encuentran mapas colaborativos', async () => {
      getCollaborativeMapsForUserMock.mockResolvedValue([]);

      const result = await service.getCollaborativeMapsForUser('user1');

      expect(getCollaborativeMapsForUserMock).toHaveBeenCalledWith('user1');
      expect(result).toEqual([]);
    });
  });
});