
// region.service.test.ts

import { Region } from '../models/region.model';
import { Map } from '../models/map.model';
import { User, Role } from '../../../auth-service/src/models/user.model';
import { PlanType } from '../../../payment-service/models/subscription.model';
import { mock } from 'node:test';

// --- Dummies para cumplir con los tipos --

// Dummy para el Map (para la propiedad map_assignee de Region)
const dummyMapForRegion: Map = {
  id: 'dummy-map',
  name: 'Dummy Map',
  description: 'Dummy Description',
  createdAt: new Date(),
  is_colaborative: false,
  users_joined: [],
  user_created: {
    id: 'user0',
    email: 'user0@example.com',
    role: Role.USER,
    password: 'dummy',
    is_active: true,
    token_data: '',
    profile: {
      id: 'profile0',
      username: 'user0',
      firstName: 'User',
      lastName: 'Zero',
    },
    sentFriendRequests: [],
    receivedFriendRequests: [],
    maps_joined: [],
    subscription: {} as any,
    userDistrict: [],
  },
};

// Dummy para la Subscription
const dummySubscription = {
  id: 'sub1',
  plan: PlanType.FREE,
  startDate: new Date('2023-01-01'),
  endDate: new Date('2023-12-31'),
  is_active: true,
  user: {} as User, // se asignará luego
};

// Dummy para el User que incluye la suscripción
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
  subscription: dummySubscription,
  userDistrict: [],
};
// Asignamos el usuario dummy a la suscripción
dummySubscription.user = dummyUser;

const mockedCreateRegion = jest.fn();
const mockedGetRegionById = jest.fn();
const mockedGetRegionByName = jest.fn();
const mockedGetAllRegions = jest.fn();
const mockedUpdateRegion = jest.fn();
const mockedDeleteRegion = jest.fn();

// --- Mocks del Repositorio de Region ---
// El servicio (region.service.ts) importa RegionRepository y crea una instancia a nivel de módulo.
jest.mock('../repositories/region.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createRegion: mockedCreateRegion,
    getRegionById: mockedGetRegionById,
    getRegionByName: mockedGetRegionByName,
    getRegions: mockedGetAllRegions,
    updateRegion: mockedUpdateRegion,
    deleteRegion: mockedDeleteRegion,
  })),
}));

// Obtenemos el mock para acceder a las instancias y sus métodos mockeados.
const MockedRegionRepository = require('../repositories/region.repository').default as jest.Mock;

// --- Variables para los métodos del servicio ---
let createRegion: (regionData: Omit<Region, 'id'>, mapaId: string) => Promise<Region | null>;
let getRegionById: (regionId: string) => Promise<Region | null>;
let getRegionByName: (regionName: string) => Promise<Region | null>;
let getAllRegions: () => Promise<Region[]>;
let updateRegion: (regionId: string, updateData: Partial<Omit<Region, 'id'>>) => Promise<Region | null>;
let deleteRegion: (regionId: string) => Promise<{ success: boolean; message: string }>;
let repoInstance: any;

describe('Region Service', () => {
  beforeEach(() => {
    // Reiniciamos los módulos y limpiamos los mocks para tener un entorno limpio
    jest.resetModules();
    jest.clearAllMocks();

    // Requerimos el servicio DESPUÉS de resetModules
    const service = require('../services/region.service');
    createRegion = service.createRegion;
    getRegionById = service.getRegionById;
    getRegionByName = service.getRegionByName;
    getAllRegions = service.getAllRegions;
    updateRegion = service.updateRegion;
    deleteRegion = service.deleteRegion;

    // Obtenemos la instancia del repositorio creada en el servicio
    repoInstance = MockedRegionRepository.mock.instances[0];
  });

  describe('createRegion', () => {
    it('debe lanzar error si faltan datos requeridos', async () => {
      const regionData = { name: '', description: '' } as Omit<Region, 'id'>;
      const mapaId = '';
      await expect(createRegion(regionData, mapaId)).rejects.toThrow(
        "Faltan datos importantes como el nombre, la descripción o el id del mapa a asignar."
      );
    });

    it('debe crear la región exitosamente', async () => {
      const regionData: Omit<Region, 'id'> = {
        name: 'Region 1',
        description: 'Descripción de Region 1',
        map_assignee: dummyMapForRegion,
      };
      const mapaId = 'map1';
      const dummyRegion: Region = { id: 'region1', ...regionData };

      // Configuramos el mock para que retorne dummyRegion.
      mockedCreateRegion.mockResolvedValue(dummyRegion);

      const result = await createRegion(regionData, mapaId);

      expect(mockedCreateRegion).toHaveBeenCalledWith(regionData, mapaId);
      expect(result).toEqual(dummyRegion);
    });
  });

  describe('getRegionById', () => {
    it('debe lanzar error si la región no es encontrada', async () => {
      const regionId = 'nonexistent';
      mockedGetRegionById.mockResolvedValue(null);

      await expect(getRegionById(regionId)).rejects.toThrow(
        `Región con ID ${regionId} no encontrada`
      );
    });

    it('debe retornar la región si es encontrada', async () => {
      const regionId = 'region1';
      const dummyRegion: Region = {
        id: regionId,
        name: 'Region 1',
        description: 'Descripción de Region 1',
        map_assignee: dummyMapForRegion,
      };
     mockedGetRegionById.mockResolvedValue(dummyRegion);

      const result = await getRegionById(regionId);

      expect(mockedGetRegionById).toHaveBeenCalledWith(regionId);
      expect(result).toEqual(dummyRegion);
    });
  });

  describe('getRegionByName', () => {
    it('debe lanzar error si la región no es encontrada', async () => {
      const regionName = 'NoExistente';
      mockedGetRegionByName.mockResolvedValue(null);

      await expect(getRegionByName(regionName)).rejects.toThrow(
        `Región con nombre ${regionName} no encontrada`
      );
    });

    it('debe retornar la región si es encontrada', async () => {
      const regionName = 'Region 1';
      const dummyRegion: Region = {
        id: 'region1',
        name: regionName,
        description: 'Descripción de Region 1',
        map_assignee: dummyMapForRegion,
      };
      mockedGetRegionByName.mockResolvedValue(dummyRegion);

      const result = await getRegionByName(regionName);

      expect(mockedGetRegionByName).toHaveBeenCalledWith(regionName);
      expect(result).toEqual(dummyRegion);
    });
  });

  describe('getAllRegions', () => {
    it('debe retornar un arreglo de regiones', async () => {
      const dummyRegions: Region[] = [
        {
          id: 'region1',
          name: 'Region 1',
          description: 'Descripción 1',
          map_assignee: dummyMapForRegion,
        },
        {
          id: 'region2',
          name: 'Region 2',
          description: 'Descripción 2',
          map_assignee: dummyMapForRegion,
        },
      ];
      mockedGetAllRegions.mockResolvedValue(dummyRegions);

      const result = await getAllRegions();

      expect(mockedGetAllRegions).toHaveBeenCalled();
      expect(result).toEqual(dummyRegions);
    });
  });

  describe('updateRegion', () => {
    it('debe lanzar error si faltan datos importantes en la actualización', async () => {
      const regionId = 'region1';
      const updateData = { name: '', description: '' };
      await expect(updateRegion(regionId, updateData)).rejects.toThrow(
        "Faltan datos importantes como el nombre o la descripción."
      );
    });

    it('debe actualizar la región exitosamente', async () => {
      const regionId = 'region1';
      const updateData = { name: 'Region Actualizada', description: 'Nueva descripción' };
      const updatedRegion: Region = {
        id: regionId,
        name: updateData.name,
        description: updateData.description,
        map_assignee: dummyMapForRegion,
      };

      mockedUpdateRegion.mockResolvedValue(updatedRegion);

      const result = await updateRegion(regionId, updateData);

      expect(mockedUpdateRegion).toHaveBeenCalledWith(regionId, updateData);
      expect(result).toEqual(updatedRegion);
    });
  });

  describe('deleteRegion', () => {
    it('debe lanzar error si la eliminación falla', async () => {
      const regionId = 'region1';
      mockedDeleteRegion.mockResolvedValue(false);

      await expect(deleteRegion(regionId)).rejects.toThrow(
        `No se pudo eliminar la región con ID ${regionId}`
      );
    });

    it('debe retornar éxito si la eliminación es exitosa', async () => {
      const regionId = 'region1';
      mockedDeleteRegion.mockResolvedValue(true);

      const result = await deleteRegion(regionId);

      expect(mockedDeleteRegion).toHaveBeenCalledWith(regionId);
      expect(result).toEqual({ success: true, message: "Región eliminada correctamente" });
    });
  });
});
