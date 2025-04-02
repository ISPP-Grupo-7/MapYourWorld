import { Map } from '../models/map.model';
import { Role, User } from '../../../auth-service/src/models/user.model';
import { UserDistrict } from '../models/user-district.model';

// --- Mocks de dependencias ---

// Mock de MapRepository
const createMapColaborativoMock = jest.fn();
jest.mock('../repositories/map.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createMap: jest.fn(),
    getMapById: jest.fn(),
    createMapColaborativo: createMapColaborativoMock,
  })),
  // Exportamos la función mockeada para usarla en los tests
  _createMapColaborativoMock: createMapColaborativoMock,
}));

// Mock de AuthRepository
const findByIdMock = jest.fn();
jest.mock('../../../auth-service/src/repositories/auth.repository', () => ({
  AuthRepository: jest.fn().mockImplementation(() => ({
    findById: findByIdMock,
  })),
  _findByIdMock: findByIdMock,
}));

// Mock de UserDistrictRepository
const createUserDistrictMock = jest.fn();
jest.mock('../repositories/user-district.repository', () => ({
  UserDistrictRepository: jest.fn().mockImplementation(() => ({
    createUserDistrict: createUserDistrictMock,
  })),
  _createUserDistrictMock: createUserDistrictMock,
}));

// Mock de district.service
jest.mock('../../../map-service/src/services/district.service', () => ({
  createDistricts: jest.fn().mockResolvedValue(true),
}));

// --- Fin de mocks ---

describe('createColaborativeMap', () => {
  let createColaborativeMap: (mapData: Omit<Map, 'id'>, userId: string) => Promise<Map>;
  let createDistricts: jest.Mock;

  beforeEach(() => {
    // Reinicia los módulos y limpia los mocks para evitar contaminación entre tests
    jest.resetModules();
    jest.clearAllMocks();

    // Requerimos el servicio (esto ejecuta el código a nivel de módulo y utiliza los mocks)
    const service = require('../services/map.service');
    createColaborativeMap = service.createColaborativeMap;
    createDistricts = require('../../../map-service/src/services/district.service').createDistricts;
  });

  it('debe crear un mapa colaborativo exitosamente', async () => {
    // Definimos mapData con todas las propiedades obligatorias
    const mapData: Omit<Map, 'id'> = {
      name: 'Mapa colaborativo',
      description: 'Mapa para colaboración',
      createdAt: new Date(),
      is_colaborative: true,
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

    // Dummy respuesta para la creación del mapa colaborativo
    const dummyMap: Map = { id: 'mapColab1', ...mapData };

    // Configuramos el mock para que retorne dummyMap
    createMapColaborativoMock.mockResolvedValue(dummyMap);

    // Simulamos que se encuentra el usuario creador
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

    // Configuramos el mock para la creación del UserDistrict
    const dummyUserDistrict: UserDistrict = {
      id: 'ud1',
      color: 'pepe',
      user: dummyUser,
    } as UserDistrict;
    createUserDistrictMock.mockResolvedValue(dummyUserDistrict);

    // Ejecutamos la función a testear
    const result = await createColaborativeMap(mapData, 'user1');

    // Verificamos las llamadas
    expect(createMapColaborativoMock).toHaveBeenCalledWith(mapData, 'user1');
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

    await expect(createColaborativeMap(mapData, 'user_inexistente')).rejects.toThrow(
      'No se encuentra un usuario con el id user_inexistente'
    );
  });
});
