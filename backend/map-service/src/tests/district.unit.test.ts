//Mocks de districts
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


//Mocks de maps
const mockedGetMapById = jest.fn();



//Mocks de regions
const mockedCreateRegion = jest.fn();


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


jest.mock('../../../database/map.geojson', () => ({
    features: new Array(10).fill(0).map((_, i) => ({
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[i]], // Coordenadas de ejemplo
      },
    })),
    region_name: 'Test Region',
  }));

jest.mock('../repositories/map.repository',  () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        getMapById:mockedGetMapById,
    })),
  }));

  
jest.mock('../repositories/region.repository',  () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        createRegion:mockedCreateRegion,
    })),
  }));


import { AppDataSource } from '../../../database/appDataSource';
import { Role, User } from '../../../auth-service/src/models/user.model';
import { District } from '../models/district.model';
import {
    createDistricts,
    getDistrictById,
    getAllDistricts,
    updateDistrict,
    unlockDistrict,
    getDistrictsByMapId,
    getUserDistrictsWithColors,
    getUserUnlockedDistricts

    

  } from '../services/district.service';

import { MultiPolygon } from 'typeorm';


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




describe('createDistricts', () => {
    const dummyMap = { id: 'map1-uuid', name: 'Map 1' };
    const dummyRegion = { id: 'region1-uuid', name: 'Sevilla' };
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('debe lanzar error cuando el mapa no se encuentra', async () => {
      // Configura que el repositorio de mapas retorne null
       mockedGetMapById.mockResolvedValue(null);
  
      await expect(createDistricts('map1-uuid')).rejects.toThrow('Mapa no encontrado.');
      expect(mockedGetMapById).toHaveBeenCalledWith('map1-uuid');
    });

    it('debe lanzar error cuando la región no se crea correctamente', async () => {
        // Configura que se encuentre el mapa
        mockedGetMapById.mockResolvedValue(dummyMap);
        // Configura que la creación de la región falle
        mockedCreateRegion.mockResolvedValue(null);
    
        await expect(createDistricts('map1-uuid')).rejects.toThrow('Región no creada correctamente.');
        expect(mockedCreateRegion).toHaveBeenCalled();
      });
    
      it('debe crear correctamente las regiones y los distritos', async () => {
        // Configura que se encuentre el mapa y la región se cree correctamente
        mockedGetMapById.mockResolvedValue(dummyMap);
        mockedCreateRegion.mockResolvedValue(dummyRegion);
        mockedCreate.mockResolvedValue({}); // Simula creación exitosa
    
        // En este ejemplo, el geojsonData mock tiene 10 features y districtsPerRegion es 5,
        // por lo tanto se crearán 2 regiones y 10 distritos en total.
        await createDistricts('map1-uuid');
    
        // Se espera que se hayan creado 2 regiones (10 / 5 = 2)

    
        // Opcionalmente, se puede verificar que los datos de cada distrito tengan el nombre esperado.
        // Ejemplo: verificar el primer distrito
        expect(mockedCreate.mock.calls[0][0]).toMatchObject({
          name: expect.stringContaining('Distrito 1 de Sevilla'),
          isUnlocked: false,
          region_assignee: dummyRegion,
        });
      });
  
  
});



describe('updateDistrict', () => {
    const districtId = 'district1-uuid';
    const expectedDistrictData = {
        name: 'District 1',
        description: 'Description of District 1',
        boundaries: {
            type: "MultiPolygon",
            coordinates: [] // Asegúrate de que este arreglo coincida con el tipo MultiPolygon
        } as MultiPolygon,
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
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  

    it('debe actualizar el distrito correctamente si los datos son válidos y no hay solapamiento', async () => {
        // Configuramos el query para que no encuentre solapamientos
        jest.spyOn(AppDataSource, 'query').mockResolvedValue([]);
        // Configuramos el repositorio para que retorne un distrito actualizado
        const updatedDistrict = { id: districtId, ...expectedDistrictData };
        mockedUpdate.mockResolvedValue(updatedDistrict);
    
        const result = await updateDistrict(districtId, expectedDistrictData);
        expect(AppDataSource.query).toHaveBeenCalledWith(
          expect.stringContaining('SELECT 1'),
          [JSON.stringify(expectedDistrictData.boundaries)]
        );
        expect(mockedUpdate).toHaveBeenCalledWith(districtId, expectedDistrictData);
        expect(result).toEqual(updatedDistrict);
      });

  
    it('debe lanzar error si faltan datos requeridos', async () => {
      const incompleteData = {
        // Falta el campo "name", "description" o "boundaries"
        description: 'Descripción incompleta',
        isUnlocked: false,
      };
  
      await expect(updateDistrict(districtId, incompleteData as any))
        .rejects
        .toThrow("No pueden faltar algunos datos importantes como el nombre o coordenadas.");
    });
  });


  describe('unlockDistrict', () => {
    const districtId = 'district1-uuid';
    const userId = 'user1-uuid';
    const regionId = 'region1-uuid';
    const color = 'red';
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('debe retornar éxito si el distrito es desbloqueado correctamente', async () => {
      // Configuramos el mock para que retorne un distrito desbloqueado
      const unlockedDistrict = { isUnlocked: true };
      mockedUnlock.mockResolvedValue(unlockedDistrict);
  
      const result = await unlockDistrict(districtId, userId, regionId, color);
  
      expect(mockedUnlock).toHaveBeenCalledWith(districtId, userId, regionId, color);
      expect(result).toEqual({
        success: true,
        message: 'Distrito desbloqueado correctamente'
      });
    });
  
    it('debe lanzar error si el distrito no es desbloqueado', async () => {
      // Configuramos el mock para que retorne un distrito que no está desbloqueado
      const unlockedDistrict = { isUnlocked: false };
      mockedUnlock.mockResolvedValue(unlockedDistrict);
  
      await expect(unlockDistrict(districtId, userId, regionId, color))
        .rejects.toThrow('Error al desbloquear el distrito');
      expect(mockedUnlock).toHaveBeenCalledWith(districtId, userId, regionId, color);
    });
  });

     
  describe('getUserUnlockedDistricts', () => {
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
        const result = await getUserUnlockedDistricts("user1-uuid");
        expect(result).toEqual(expectedDistrict);
        expect(mockedGetDistrictsUnlocked).toHaveBeenCalledWith("user1-uuid");
    })
});





























});