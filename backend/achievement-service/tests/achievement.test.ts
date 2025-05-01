import { createAchievement, getAchievementByName , getAchievements} from '../services/achievement.service';
import { AchievementRepository } from '../repositories/achievement.repository';

// Mock de AchievementRepository
jest.mock('../repositories/achievement.repository', () => {
    const mockRepo = {
        findByName:jest.fn(),
        findAll: jest.fn(),
        createAchievement:jest.fn()

      };
      return {
        AchievementRepository: jest.fn().mockImplementation(() => mockRepo)
      };
});

describe('Pruebas de servicio de logros', () => {
    let repoInstance: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Se obtiene la instancia del repositorio simulado
        const AchievementRepositoryMock  = AchievementRepository as jest.Mock;
        // Crear una nueva instancia del mock antes de cada test
        new AchievementRepositoryMock();
        repoInstance = AchievementRepositoryMock.mock.results[0].value;
    });


    describe('getAchievementByName', () => {
        it('debe retornar un usuario para un id válido', async () => {
        const dummyAchievement = { id: 'achievement1', name: 'pepe', description:"pepe", points:15, iconUrl:"pepe" };
        repoInstance.findByName.mockResolvedValue(dummyAchievement);

        const result = await getAchievementByName('pepe');
        expect(result).toEqual(dummyAchievement);
        expect(repoInstance.findByName).toHaveBeenCalledWith('pepe');
        });
    });


    describe("getAchievements", () => {
        afterEach(() => {
          jest.clearAllMocks();
        });
      
        it("debe devolver una lista de logros cuando findAll funciona correctamente", async () => {
          const mockAchievements = [
            { id: 1, name: "Primer logro" },
            { id: 2, name: "Segundo logro" },
          ];
          repoInstance.findAll.mockResolvedValue(mockAchievements);
      
          const result = await getAchievements();
          expect(result).toEqual(mockAchievements);
          expect(repoInstance.findAll).toHaveBeenCalledTimes(1);
        });
      
        it("debe lanzar un error cuando findAll falla", async () => {
            repoInstance.findAll.mockRejectedValue(new Error("DB error"));
      
          await expect(getAchievements()).rejects.toThrow("Error al obtener los logros");
          expect(repoInstance.findAll).toHaveBeenCalledTimes(1);
        });
      });

      describe("createAchievement", () => {
        afterEach(() => {
          jest.clearAllMocks();
        });
      
        it("debe llamar a repo.createAchievement con los datos correctos", async () => {
          const mockAchievementData = { name: "Nuevo logro", description: "pepe", points: 15, iconUrl:"pepe"  };
          
          await createAchievement(mockAchievementData);
          
          expect(repoInstance.createAchievement).toHaveBeenCalledWith(mockAchievementData);
          expect(repoInstance.createAchievement).toHaveBeenCalledTimes(1);
        });
      

      });
      
});