//Mocks de POI
const mockedgetPOIsByUserIdAndDistrict = jest.fn();
const mockedgetPoiByNameAndLocation = jest.fn();
const mockedgetPoiById = jest.fn();
const mockedcreatePoi = jest.fn();
const mockedupdatePoi = jest.fn();
const mockeddeletePOI = jest.fn();
const mockedgetAllPois = jest.fn();
const mockedgetPointsOfInterestByMapId = jest.fn();
const mockedcreatePoiInAllMaps = jest.fn();
const mockedgetUniquePointsOfInterestBusiness = jest.fn();
const mockedcreatePOIsOnLagMaps = jest.fn();


// Mocks de Subscription
const mockedgetActiveSubscriptionByUserId = jest.fn()

//Mocks de auth
const mockedgetUserById = jest.fn()


jest.mock('../repositories/poi.repostory', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    getPOIsByUserIdAndDistrict: mockedgetPOIsByUserIdAndDistrict,
    getPoiByNameAndLocation: mockedgetPoiByNameAndLocation,
    getPoiById: mockedgetPoiById,
    createPoi: mockedcreatePoi,
    updatePoi: mockedupdatePoi,
    deletePOI: mockeddeletePOI,
    getAllPois: mockedgetAllPois,
    getPointsOfInterestByMapId: mockedgetPointsOfInterestByMapId,
    createPoiInAllMaps: mockedcreatePoiInAllMaps,
    getUniquePointsOfInterestBusiness:mockedgetUniquePointsOfInterestBusiness,
    createPOIsOnLagMaps: mockedcreatePOIsOnLagMaps

  })),
}));

jest.mock('../../../payment-service/repositories/subscription.repository', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        getActiveSubscriptionByUserId:mockedgetActiveSubscriptionByUserId
    })),
  }));


  jest.mock('../../../auth-service/src/repositories/auth.repository', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        findById:mockedgetUserById
    })),
  }));


import { Role, User } from "../../../auth-service/src/models/user.model";
import { getPOIsByMapId } from "../controllers/poi.controller";
import { District } from "../models/district.model";
import { Category, PointOfInterest } from "../models/poi.model"
import { 
    createPOI,
    createPOIInAllMaps,
    getPOIById,
    getAllPOIs, 
    updatePOI,
    deletePOI,
    getPointsOfInterestByMapId,
    getPointsBusinessAndUnique,
    createPOIsOnLagMaps   
 } from "../services/poi.service"


 describe('POI Service', () => {

    const fixedDate = new Date('2021-01-01T00:00:00.000Z');

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.useFakeTimers(); // Usamos fake timers sin 'modern'
        jest.setSystemTime(fixedDate);
    });
    



    describe('getPOIById', () => {
        it("debe devolver un poi buscado por id", async() => {
            const poiId = 'poi1-uuid';
            const expectedPOI: PointOfInterest  = {
                id: poiId,
                name: 'Test POI',
                description:"Test description",
                location: {
                    type: 'Point',
                    coordinates: [10.0, 20.0]
                },
                category:Category.MONUMENTOS,
                images:"Test image",
                isBusiness:true,
                createdAt: fixedDate,
                user: {} as User,
                district: {} as District,



            };
    
    
            mockedgetPoiById.mockResolvedValue(expectedPOI);
            const result = await getPOIById(poiId);
            expect(result).toEqual(expectedPOI);
            expect(mockedgetPoiById).toHaveBeenCalledWith(poiId);
        })
    });

    describe('getAllPOIs', () => {
        it("debe devolver una lista con todos los pois creados", async() => {
            const expectedPOI1: PointOfInterest  = {
                id: "poi1-uuid",
                name: 'Test POI',
                description:"Test description",
                location: {
                    type: 'Point',
                    coordinates: [10.0, 20.0]
                },
                category:Category.MONUMENTOS,
                images:"Test image",
                isBusiness:true,
                createdAt: fixedDate,
                user: {} as User,
                district: {} as District,
            };

            const expectedPOI2: PointOfInterest  = {
                id: "poi2-uuid",
                name: 'Test POI',
                description:"Test description",
                location: {
                    type: 'Point',
                    coordinates: [11.0, 21.0]
                },
                category:Category.MONUMENTOS,
                images:"Test image",
                isBusiness:true,
                createdAt: fixedDate,
                user: {} as User,
                district: {} as District,
            };

            const expectedPOIs: PointOfInterest[] = [expectedPOI1, expectedPOI2];
    
    
            mockedgetAllPois.mockResolvedValue(expectedPOIs);
            const result = await getAllPOIs();
            expect(result).toEqual(expectedPOIs);
            expect(mockedgetAllPois).toHaveBeenCalled();
        })
    });


    describe('getPointsOfInterestByMapId', () => {
        it("debe devolver un poi de un mapa específico", async() => {
            const mapId = 'map1-uuid';
            const expectedPOI: PointOfInterest  = {
                id: "poi1-uuid",
                name: 'Test POI',
                description:"Test description",
                location: {
                    type: 'Point',
                    coordinates: [10.0, 20.0]
                },
                category:Category.MONUMENTOS,
                images:"Test image",
                isBusiness:true,
                createdAt: fixedDate,
                user: {} as User,
                district: {} as District,



            };
    
    
            mockedgetPointsOfInterestByMapId.mockResolvedValue([expectedPOI]);
            const result = await getPointsOfInterestByMapId(mapId);
            expect(result).toEqual([expectedPOI]);
            expect(mockedgetPointsOfInterestByMapId).toHaveBeenCalledWith(mapId);
        })
    });



    describe('getPointsBusinessAndUnique', () => {
        it("debe devolver un Pois unicos de una lista de pois", async() => {
            const expectedPOI1: PointOfInterest  = {
                id: "poi1-uuid",
                name: 'Test POI',
                description:"Test description",
                location: {
                    type: 'Point',
                    coordinates: [10.0, 20.0]
                },
                category:Category.MONUMENTOS,
                images:"Test image",
                isBusiness:true,
                createdAt: fixedDate,
                user: {} as User,
                district: {} as District,
            };

            const expectedPOI2: PointOfInterest  = {
                id: "poi2-uuid",
                name: 'Test POI',
                description:"Test description",
                location: {
                    type: 'Point',
                    coordinates: [11.0, 21.0]
                },
                category:Category.MONUMENTOS,
                images:"Test image",
                isBusiness:true,
                createdAt: fixedDate,
                user: {} as User,
                district: {} as District,
            };

            const expectedPOIs: PointOfInterest[] = [expectedPOI1, expectedPOI2];
    
    
            mockedgetUniquePointsOfInterestBusiness.mockResolvedValue(expectedPOIs);
            const result = await getPointsBusinessAndUnique();
            expect(result).toEqual(expectedPOIs);
            expect(mockedgetUniquePointsOfInterestBusiness).toHaveBeenCalled();
        })
    });




    describe('createPOI', () => {
        const mockPOIData: Omit<PointOfInterest, 'id'> = {
            name: 'Test POI',
            description:"Test description",
            location: {
                type: 'Point',
                coordinates: [11.0, 21.0]
            },
            category:Category.MONUMENTOS,
            images:"Test image",
            isBusiness:true,
            createdAt: fixedDate,
            user: {} as User,
            district: {} as District,
        };


        const mockPOIData2: Omit<PointOfInterest, 'id'> = {
            name: 'Test POI',
            description:"Test description",
            location: {
                type: 'Point',
                coordinates: [11.0, 21.0]
            },
            category:Category.MONUMENTOS,
            images:"Test image",
            isBusiness:true,
            createdAt: fixedDate,
            user: {} as User,
            district: {} as District,
        };
      
        const userId = 'user123';
      
        beforeEach(() => {
          jest.clearAllMocks();
        });
      
        it('debería lanzar un error si faltan datos obligatorios', async () => {
          await expect(createPOI({ ...mockPOIData, name: '' }, userId)).rejects.toThrow(
            'Nombre, ubicación y categoría son campos obligatorios'
          );
        });
      
        it('debería lanzar un error si ya existe un POI en la misma ubicación', async () => {
          mockedgetPoiByNameAndLocation.mockResolvedValue({ ...mockPOIData, id: 'poi_uuid1' });
          await expect(createPOI(mockPOIData2, userId)).rejects.toThrow(
            'Ya existe un punto de interés similar en esta ubicación'
          );
        });
      
        it('debería lanzar un error si el usuario con plan FREE ya tiene un POI en el distrito', async () => {
          mockedgetPoiByNameAndLocation.mockResolvedValue(null);
          mockedgetActiveSubscriptionByUserId.mockResolvedValue({ plan: 'FREE' });
          mockedgetPOIsByUserIdAndDistrict.mockResolvedValue([{ id: 'existingPOI' }]);
          
          await expect(createPOI(mockPOIData, userId)).rejects.toThrow(
            'El usuario ya tiene un punto de interés en este distrito, para crear más puntos de interés, actualiza tu plan al plan PREMIUM'
          );
        });
      
        it('debería crear un POI si no hay restricciones', async () => {
            mockedgetPoiByNameAndLocation.mockResolvedValue(null);
            mockedgetActiveSubscriptionByUserId.mockResolvedValue({ plan: 'PREMIUM' });
            mockedgetPOIsByUserIdAndDistrict.mockResolvedValue({ id: 'newPOI', ...mockPOIData });
            mockedcreatePoi.mockResolvedValue({ id: 'newPOI', ...mockPOIData });
          const result = await createPOI(mockPOIData, userId);
          expect(result).toEqual({ id: 'newPOI', ...mockPOIData });
        });
      });
      




      describe('createPOIinAllMaps', () => {
        const mockPOIData: Omit<PointOfInterest, 'id'> = {
            name: 'Test POI',
            description:"Test description",
            location: {
                type: 'Point',
                coordinates: [11.0, 21.0]
            },
            category:Category.MONUMENTOS,
            images:"Test image",
            isBusiness:true,
            createdAt: fixedDate,
            user: {} as User,
            district: {} as District,
        };


        const mockPOIData2: Omit<PointOfInterest, 'id'> = {
            name: 'Test POI',
            description:"Test description",
            location: {
                type: 'Point',
                coordinates: [11.0, 21.0]
            },
            category:Category.MONUMENTOS,
            images:"Test image",
            isBusiness:true,
            createdAt: fixedDate,
            user: {} as User,
            district: {} as District,
        };
      
        const userId = 'user123';


        const dummyUser: User = {
            id: userId,
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

          const dummyUserOK: User = {
            id: userId,
            email: 'user1@example.com',
            role: Role.ADMIN,
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
      
        beforeEach(() => {
          jest.clearAllMocks();
        });
      
        it('debería lanzar un error si el usuario no existe', async () => {
            mockedgetUserById.mockResolvedValue(null);
            await expect(createPOIInAllMaps({ ...mockPOIData, name: '' }, userId)).rejects.toThrow(
                'El usuario no existe'
            );
        });
      
        it('debería lanzar un error si un usuario con rol distinto a ADMIN intenta crear POIS en todos los mapas', async () => {
            mockedgetUserById.mockResolvedValue(dummyUser);
            await expect(createPOIInAllMaps({ ...mockPOIData, name: '' }, userId)).rejects.toThrow(
                'No tienes permisos para crear puntos de interés en todos los mapas'
            );
        });
        it('debería crear un POI si no hay restricciones', async () => {
            mockedgetUserById.mockResolvedValue(dummyUserOK);
            mockedcreatePoiInAllMaps.mockResolvedValue({});
            

            await expect(createPOIInAllMaps(mockPOIData, userId)).resolves.toBeUndefined();



        });
      });




    describe("updatePOI", () => {
        beforeEach(() => {
          jest.clearAllMocks();
        });


        const poiId = "poi1-uuid";
        const userId = "user123";

        const dummyUser: User = {
        id: userId,
        email: "user@example.com",
        role: Role.USER,
        password: "secret",
        is_active: true,
        token_data: undefined,
        profile: {} as any,
        sentFriendRequests: [],
        receivedFriendRequests: [],
        maps_joined: [],
        subscription: {} as any,
        userDistrict: [],
        };

        const defaultPOI: PointOfInterest = {
        id: poiId,
        name: "Test POI",
        description: "Test description",
        location: {
            type: "Point",
            coordinates: [10.0, 20.0],
        },
        category: Category.MONUMENTOS,
        images: "Test image",
        isBusiness: true,
        createdAt: new Date("2021-01-01T00:00:00.000Z"),
        user: dummyUser,
        district: {} as any,
        };
      
        it("debe lanzar un error si no existe el POI", async () => {
          // Mock para que getPoiById retorne null
          mockedgetPoiById.mockResolvedValue(null);
          await expect(updatePOI(poiId, { name: "Updated POI" }, userId))
            .rejects.toThrow(`Poi con id ${poiId} no ha sido encontrado`);
        });
      
        it("debe lanzar un error si el POI no pertenece al usuario", async () => {
          // Clonar el POI y cambiar el usuario
          const poiConOtroUsuario = { ...defaultPOI, user: { ...dummyUser, id: "otroUser" } };
          mockedgetPoiById.mockResolvedValue(poiConOtroUsuario);
          await expect(updatePOI(poiId, { name: "Updated POI" }, userId))
            .rejects.toThrow("No tienes permisos para actualizar este punto de interés");
        });
      
        it("debe lanzar un error si los datos de ubicación son inválidos", async () => {
          mockedgetPoiById.mockResolvedValue(defaultPOI);
          // Actualización con coordenadas incompletas
          await expect(updatePOI(poiId, { ...defaultPOI, location:{type: "Point", coordinates: [0], }, }, userId))
            .rejects.toThrow("Las coordenadas de ubicación son inválidas");
      
          // Actualización con tipo incorrecto
          await expect(updatePOI(poiId, { ...defaultPOI, location:{type: "Polygon", coordinates: [0, 20.0] as any, }, }, userId))
            .rejects.toThrow("Las coordenadas de ubicación son inválidas");
        });
      
        it("debe actualizar el POI correctamente", async () => {
          mockedgetPoiById.mockResolvedValue(defaultPOI);
          const updatedPOI: PointOfInterest = { ...defaultPOI, name: "Updated POI" };
          mockedupdatePoi.mockResolvedValue(updatedPOI);
      
          const result = await updatePOI(poiId, { name: "Updated POI" }, userId);
          expect(result).toEqual(updatedPOI);
          expect(mockedupdatePoi).toHaveBeenCalledWith(poiId, { name: "Updated POI" });
        });
      });



      describe("createPOIsOnLagMaps", () => {
        beforeEach(() => {
          jest.clearAllMocks();
        });
      
        it("debe obtener los POIs únicos y crear POIs en el mapa pasado", async () => {
          const dummyPOIs = [
            { id: "poi1", name: "POI 1" },
            { id: "poi2", name: "POI 2" },
          ];
          const mapId = "map123";
      
          // Configurar el mock para que retorne dummyPOIs
          mockedgetUniquePointsOfInterestBusiness.mockResolvedValue(dummyPOIs);
      
          await createPOIsOnLagMaps(mapId);
      
          // Verifica que se llamó a getUniquePointsOfInterestBusiness
          expect(mockedgetUniquePointsOfInterestBusiness).toHaveBeenCalled();
      
          // Y que createPOIsOnLagMaps fue llamado con los POIs y el mapId
          expect(mockedcreatePOIsOnLagMaps).toHaveBeenCalledWith(dummyPOIs, mapId);
        });
      });


















 });