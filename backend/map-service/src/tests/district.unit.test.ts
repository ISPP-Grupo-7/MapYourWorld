const mockedCreate = jest.fn();
const mockedUpdate = jest.fn();
const mockedGetById = jest.fn();
const mockedGetAll = jest.fn();
const mockedUnlock = jest.fn();
const mockedGetDistrictsUnlocked = jest.fn();
const mockedGetDistrictsByMapId = jest.fn();
const mockedGetDistrictInMapByCoordinates = jest.fn();
const mockedGetDistrictsContainingCoordinates = jest.fn();
const mockedgetUserDistrictsByUserId = jest.fn();




// Mockeamos el repositorio (esto se hace antes de importar el servicio)
jest.mock('../repositories/district.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createDistrict: mockedCreate,
    getDistrictById: mockedGetById,
    getDistricts: mockedGetAll,
    updateDistrict: mockedUpdate,
    unlockDistrict: mockedUnlock,
    getDistrictsUnlocked: mockedGetDistrictsUnlocked,
    getDistrictsByMapId: mockedGetDistrictsByMapId,
    getDistrictInMapByCoordinates: mockedGetDistrictInMapByCoordinates,
    getDistrictsContainingCoordinates: mockedGetDistrictsContainingCoordinates,
    getUserDistrictsByUserId:mockedgetUserDistrictsByUserId

  })),
}));

import { Role, User } from '../../../auth-service/src/models/user.model';
import { District } from '../models/district.model';
import {
    createDistricts,
    getDistrictById,
    getAllDistricts,
    updateDistrict,
    unlockDistrict,
    getUnlockedDistricts,
    getDistrictsByMapId,
    getUserDistrictsWithColors

  } from '../services/district.service';


const dummyUser: User = {
    id: 'user1-uuid',
    email: 'user1@example.com',
    role: Role.USER,
    password: 'secret',
    is_active: true,
    token_data: undefined,
    profile: {} as any, // Ajusta según la estructura real de UserProfile
    sentFriendRequests: [],
    receivedFriendRequests: [],
    maps_joined: [],
    subscription: {} as any,
    userDistrict: [],
  };








describe('District Service', () => {
// Fecha fija para controlar la generación de fechas
const fixedDate = new Date('2021-01-01T00:00:00.000Z');
const thirtyDaysLater = new Date(fixedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  
    // Deshabilitamos globalmente los logs de error para no imprimirlos en consola
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers(); // Usamos fake timers sin 'modern'
    jest.setSystemTime(fixedDate);
});


describe('getDistrictById', () => {
    it("debe devolver un distrito buscado por id", async() => {
        const districtId = 'district1-uuid';
        const expectedDistrict: District = {
            id: districtId,
            name: 'District 1',
            description: 'Description of District 1',
            boundaries: {
                type: 'MultiPolygon',
                coordinates: [], // Ajusta según la estructura real de Geometry
            },
            isUnlocked: false,
            region_assignee: {} as any, // Ajusta según la estructura real de Region
            userDistrict: [],
        };


        mockedGetById.mockResolvedValue(expectedDistrict);
        const result = await getDistrictById(districtId);
        expect(result).toEqual(expectedDistrict);
        expect(mockedGetById).toHaveBeenCalledWith(districtId);
    })
});



describe('getAllDistricts', () => {
    it("debe devolver una lista de distritos", async() => {
        const district1: District = {
            id: "district1-uuid",
            name: 'District 1',
            description: 'Description of District 1',
            boundaries: {
                type: 'MultiPolygon',
                coordinates: [], // Ajusta según la estructura real de Geometry
            },
            isUnlocked: false,
            region_assignee: {} as any, // Ajusta según la estructura real de Region
            userDistrict: [],
        };

        const district2: District = {
            id: "district2-uuid",
            name: 'District 2',
            description: 'Description of District 2',
            boundaries: {
                type: 'MultiPolygon',
                coordinates: [], // Ajusta según la estructura real de Geometry
            },
            isUnlocked: false,
            region_assignee: {} as any, // Ajusta según la estructura real de Region
            userDistrict: [],
        };

        const expectedDistricts: District[] = [district1, district2];

        mockedGetAll.mockResolvedValue(expectedDistricts);
        const result = await getAllDistricts();
        expect(result).toEqual(expectedDistricts);
        expect(mockedGetAll).toHaveBeenCalled();})
});


describe('getUnlockedDistricts', () => {
    it("debe devolver un distrito desbloqueado", async() => {
        const districtId = 'district1-uuid';
        const expectedDistrict: District = {
            id: districtId,
            name: 'District 1',
            description: 'Description of District 1',
            boundaries: {
                type: 'MultiPolygon',
                coordinates: [], // Ajusta según la estructura real de Geometry
            },
            isUnlocked: true,
            region_assignee: {} as any, // Ajusta según la estructura real de Region
            userDistrict: [],
        };


        mockedGetDistrictsUnlocked.mockResolvedValue(expectedDistrict);
        const result = await getUnlockedDistricts();
        expect(result).toEqual(expectedDistrict);
        expect(mockedGetDistrictsUnlocked).toHaveBeenCalled();
    })
});

describe('getDistrictsByMapId', () => {
    it("debe devolver un distrito cuyo mapa asociado tenga el id dado por parámetro", async() => {
        const mapId = 'map1-uuid';
        const expectedDistrict: District = {
            id: 'district1-uuid',
            name: 'District 1',
            description: 'Description of District 1',
            boundaries: {
                type: 'MultiPolygon',
                coordinates: [], // Ajusta según la estructura real de Geometry
            },
            isUnlocked: true,
            region_assignee: {
                id: 'region1-uuid',
                name: 'Region 1',
                description: 'Description of Region 1',
                map_assignee: { 
                    id: mapId,
                    name: 'Map 1',
                    description: 'Description of Map 1',
                    is_colaborative: true,
                    users_joined: [], // Ajusta según la estructura real de User
                    user_created: {} as any, // Ajusta según la estructura real de User
                }, // Ajusta según la estructura real de Map
            } as any, // Ajusta según la estructura real de Region
            userDistrict: [],
        };


        mockedGetDistrictsByMapId.mockResolvedValue(expectedDistrict);
        const result = await getDistrictsByMapId(mapId);
        expect(result).toEqual(expectedDistrict);
        expect(mockedGetDistrictsByMapId).toHaveBeenCalledWith(mapId);
    })
});

describe('getUserDistrictsWithColors', () => {
    it("debe devolver un par de User y District con un color asociado", async() => {
        const userId = 'user1-uuid';
        const expectedDistrict: District = {
            id: 'district1-uuid',
            name: 'District 1',
            description: 'Description of District 1',
            boundaries: {
                type: 'MultiPolygon',
                coordinates: [], // Ajusta según la estructura real de Geometry
            },
            isUnlocked: true,
            region_assignee: {
                id: 'region1-uuid',
                name: 'Region 1',
                description: 'Description of Region 1',
                map_assignee: { 
                    id: 'map1-uuid',
                    name: 'Map 1',
                    description: 'Description of Map 1',
                    is_colaborative: true,
                    users_joined: [], // Ajusta según la estructura real de User
                    user_created: {} as any, // Ajusta según la estructura real de User
                }, // Ajusta según la estructura real de Map
            } as any, // Ajusta según la estructura real de Region
            userDistrict: [],
        };

        const expectedUserDistrict = {
            id: 'userDistrict1-uuid',
            user: dummyUser,
            district: expectedDistrict,
            color: 'red', // Color de ejemplo   
        };

        mockedgetUserDistrictsByUserId.mockResolvedValue([expectedUserDistrict]);
        const result = await getUserDistrictsWithColors(userId);
        expect(result).toEqual([expectedUserDistrict]);
        expect(mockedgetUserDistrictsByUserId).toHaveBeenCalledWith(userId);
    })
});
































});