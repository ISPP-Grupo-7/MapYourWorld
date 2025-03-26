import { createUserAchievement, getAchievementsByUser, getUsersByAchievement } from "../services/userAchievement.service";
import { UserAchievementRepository } from "../repositories/userAchievement.repository";
import { Role } from "../../auth-service/src/models/user.model";
import { PlanType } from "../../payment-service/models/subscription.model";
import { Achievement } from "../models/achievement.model";

jest.mock('../repositories/userAchievement.repository', () => {
    const mockRepo = {
        create: jest.fn(),
        createUserAchievement:jest.fn(),
        getAchievementsByUserId: jest.fn(),
        getUsersByAchievementId:jest.fn()

      };
      return {
        UserAchievementRepository: jest.fn().mockImplementation(() => mockRepo)
      };
});

describe("Pruebas de userAchiements", () => {
  let repoInstance: any;

    beforeEach(() => {
        jest.clearAllMocks();
        // Se obtiene la instancia del repositorio simulado
        const UserAchievementRepositoryMock  = UserAchievementRepository as jest.Mock;
        // Crear una nueva instancia del mock antes de cada test
        new UserAchievementRepositoryMock();
        repoInstance = UserAchievementRepositoryMock.mock.results[0].value;
    });


  describe("createUserAchievement", () => {
    it("debe crear un nuevo usuario-logro", async () => {
        const userData = {
            id: 'user1',  // Asegúrate de que el id esté presente
            email: 'newuser@example.com',
            password: 'Password1!',
            role: Role.USER,
            is_active: true,  // Añadir propiedad is_active
            sentFriendRequests: [],  // Añadir sentFriendRequests
            receivedFriendRequests: [],  // Añadir receivedFriendRequests
            maps_joined: [],  // Añadir maps_joined
            profile: { 
                id: 'profile1', 
                username: 'newuser', 
                firstName: 'New', 
                lastName: 'User' 
            },
            subscription:{
              id:"suscripcion1",
              plan: PlanType.FREE,
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-12-31'),
              is_active: true,
              autoRenew: false,
              createdAt: new Date('2024-01-01'),
              updatedAt: new Date('2024-03-18'),   
            }
        } as any;
        userData.subscription.user = userData;
    
        const mockAchievement = new Achievement();
        mockAchievement.id = "achievement1";
        mockAchievement.name = "Primer Logro";
        mockAchievement.description = "Descripción del primer logro";
        mockAchievement.points = 10;
        mockAchievement.iconUrl = "http://example.com/icon1.png";
      
        const expectedUserAchievement = {
            user: userData,
            achievement: mockAchievement,
            dateEarned: expect.any(Date)
        };
      
        repoInstance.create.mockResolvedValue(expectedUserAchievement);
      
        const result = await createUserAchievement(userData, mockAchievement);

        // Verificamos que se llamó al método create con un objeto que contiene el usuario y el logro correctos
        expect(repoInstance.create).toHaveBeenCalledWith(
            expect.objectContaining({
                user: userData,
                achievement: mockAchievement,
                dateEarned: expect.any(Date)
            })
        );
        
        expect(result).toEqual(expect.objectContaining({
            user: userData,
            achievement: mockAchievement
        }));
    });
  });

  describe("getAchievementsByUser", () => {
    it("debe obtener los logros de un usuario", async () => {
      const mockAchievements = [{ id: "1", user: { id: "123" }, achievement: { id: "456" } }];
      repoInstance.getAchievementsByUserId = jest.fn().mockResolvedValue(mockAchievements);
      
      const result = await getAchievementsByUser("123");
      
      expect(repoInstance.getAchievementsByUserId).toHaveBeenCalledWith("123");
      expect(result).toEqual(mockAchievements);
    });
  });

  describe("getUsersByAchievement", () => {
    it("debe obtener los usuarios que consiguieron un logro", async () => {
      const mockUsers = [{ id: "123", name: "Usuario 1" }];
      repoInstance.getUsersByAchievementId = jest.fn().mockResolvedValue(mockUsers);
      
      const result = await getUsersByAchievement("456");
      
      expect(repoInstance.getUsersByAchievementId).toHaveBeenCalledWith("456");
      expect(result).toEqual(mockUsers);
    });
  });
});
