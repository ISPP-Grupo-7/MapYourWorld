import { 
    getAllUserStats, 
    getUserStatById, 
    getUserStatByUserId,
    createUserStat,
    updateUserStat,
    updateUserStatByUserId,
    deleteUserStat
  } from '../services/userStat.service';
  import { UserStatRepository } from '../repositories/userStat.repository';
  import { UserStat } from '../models/userStat.model';
  
  // Mock the UserStatRepository
  jest.mock('../repositories/userStat.repository', () => {
    const mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateById: jest.fn(),
      delete: jest.fn()
    };
    return {
      UserStatRepository: jest.fn().mockImplementation(() => mockRepo)
    };
  });
  
  describe('UserStat Service Tests', () => {
    let repoInstance: any;
    let originalConsoleError: any;
  
    beforeEach(() => {
      jest.clearAllMocks();
      // Guardar la implementación original de console.error
      originalConsoleError = console.error;
      // Reemplazar console.error con un mock vacío
      console.error = jest.fn();
      
      // Get the mocked repository instance
      const UserStatRepositoryMock = UserStatRepository as jest.Mock;
      // Create a new instance of the mock before each test
      new UserStatRepositoryMock();
      repoInstance = UserStatRepositoryMock.mock.results[0].value;
    });
  
    afterEach(() => {
      // Restaurar la implementación original de console.error
      console.error = originalConsoleError;
    });
  
    describe('getAllUserStats', () => {
      it('should return all user stats', async () => {
        const mockStats = [
          { id: '1', userId: 'user1', totalPoisCreados: 10, totalAchievements: 5, rankingPoints: 100 },
          { id: '2', userId: 'user2', totalPoisCreados: 20, totalAchievements: 15, rankingPoints: 200 }
        ];
        repoInstance.findAll.mockResolvedValue(mockStats);
  
        const result = await getAllUserStats();
  
        expect(repoInstance.findAll).toHaveBeenCalled();
        expect(result).toEqual(mockStats);
      });
  
      it('should throw an error when repository fails', async () => {
        repoInstance.findAll.mockRejectedValue(new Error('Database error'));
  
        await expect(getAllUserStats()).rejects.toThrow('Could not fetch user stats');
      });
    });
  
    describe('getUserStatById', () => {
      it('should return a user stat for a valid ID', async () => {
        const mockStat = { id: '1', userId: 'user1', totalPoisCreados: 10, totalAchievements: 5, rankingPoints: 100 };
        repoInstance.findById.mockResolvedValue(mockStat);
  
        const result = await getUserStatById('1');
  
        expect(repoInstance.findById).toHaveBeenCalledWith('1');
        expect(result).toEqual(mockStat);
      });
  
      it('should return null for non-existent ID', async () => {
        repoInstance.findById.mockResolvedValue(null);
  
        const result = await getUserStatById('999');
  
        expect(repoInstance.findById).toHaveBeenCalledWith('999');
        expect(result).toBeNull();
      });
  
      it('should throw an error when repository fails', async () => {
        repoInstance.findById.mockRejectedValue(new Error('Database error'));
  
        await expect(getUserStatById('1')).rejects.toThrow('Could not fetch user stat with ID: 1');
      });
    });
  
    describe('getUserStatByUserId', () => {
      it('should return a user stat for a valid user ID', async () => {
        const mockStat = { id: '1', userId: 'user1', totalPoisCreados: 10, totalAchievements: 5, rankingPoints: 100 };
        repoInstance.findByUserId.mockResolvedValue(mockStat);
  
        const result = await getUserStatByUserId('user1');
  
        expect(repoInstance.findByUserId).toHaveBeenCalledWith('user1');
        expect(result).toEqual(mockStat);
      });
  
      it('should return null for non-existent user ID', async () => {
        repoInstance.findByUserId.mockResolvedValue(null);
  
        const result = await getUserStatByUserId('nonexistent');
  
        expect(repoInstance.findByUserId).toHaveBeenCalledWith('nonexistent');
        expect(result).toBeNull();
      });
  
      it('should throw an error when repository fails', async () => {
        repoInstance.findByUserId.mockRejectedValue(new Error('Database error'));
  
        await expect(getUserStatByUserId('user1')).rejects.toThrow('Could not fetch user stat for user ID: user1');
      });
    });
  
    describe('createUserStat', () => {
      it('should create a new user stat', async () => {
        const mockStatData = { userId: 'user1', totalPoisCreados: 10, totalAchievements: 5, rankingPoints: 100 };
        const mockCreatedStat = { id: '1', ...mockStatData };
        
        repoInstance.findByUserId.mockResolvedValue(null);
        repoInstance.create.mockResolvedValue(mockCreatedStat);
  
        const result = await createUserStat(mockStatData);
  
        expect(repoInstance.findByUserId).toHaveBeenCalledWith('user1');
        expect(repoInstance.create).toHaveBeenCalledWith(mockStatData);
        expect(result).toEqual(mockCreatedStat);
      });
  
      it('should throw an error if a stat already exists for the user', async () => {
        const mockStatData = { userId: 'user1', totalPoisCreados: 10, totalAchievements: 5, rankingPoints: 100 };
        const existingStat = { id: '1', ...mockStatData };
        
        repoInstance.findByUserId.mockResolvedValue(existingStat);
  
        await expect(createUserStat(mockStatData)).rejects.toThrow('User stat already exists for user ID: user1');
        expect(repoInstance.create).not.toHaveBeenCalled();
      });
    });
  
    describe('updateUserStat', () => {
      it('should update a user stat by ID', async () => {
        const mockUpdate = { totalPoisCreados: 15, totalAchievements: 7 };
        const mockUpdatedStat = { id: '1', userId: 'user1', totalPoisCreados: 15, totalAchievements: 7, rankingPoints: 100 };
        
        repoInstance.updateById.mockResolvedValue(mockUpdatedStat);
  
        const result = await updateUserStat('1', mockUpdate);
  
        expect(repoInstance.updateById).toHaveBeenCalledWith('1', mockUpdate);
        expect(result).toEqual(mockUpdatedStat);
      });
  
      it('should return null when updating non-existent record', async () => {
        repoInstance.updateById.mockResolvedValue(null);
  
        const result = await updateUserStat('999', { totalPoisCreados: 15 });
  
        expect(repoInstance.updateById).toHaveBeenCalledWith('999', { totalPoisCreados: 15 });
        expect(result).toBeNull();
      });
  
      it('should throw an error when repository fails', async () => {
        repoInstance.updateById.mockRejectedValue(new Error('Database error'));
  
        await expect(updateUserStat('1', { totalPoisCreados: 15 })).rejects.toThrow('Could not update user stat with ID: 1');
      });
    });
  
    describe('updateUserStatByUserId', () => {
      it('should update a user stat by user ID', async () => {
        const mockUpdate = { totalPoisCreados: 15, totalAchievements: 7 };
        const mockUpdatedStat = { id: '1', userId: 'user1', totalPoisCreados: 15, totalAchievements: 7, rankingPoints: 100 };
        
        repoInstance.update.mockResolvedValue(mockUpdatedStat);
  
        const result = await updateUserStatByUserId('user1', mockUpdate);
  
        expect(repoInstance.update).toHaveBeenCalledWith('user1', mockUpdate);
        expect(result).toEqual(mockUpdatedStat);
      });
  
      it('should return null when updating non-existent user', async () => {
        repoInstance.update.mockResolvedValue(null);
  
        const result = await updateUserStatByUserId('nonexistent', { totalPoisCreados: 15 });
  
        expect(repoInstance.update).toHaveBeenCalledWith('nonexistent', { totalPoisCreados: 15 });
        expect(result).toBeNull();
      });
  
      it('should throw an error when repository fails', async () => {
        repoInstance.update.mockRejectedValue(new Error('Database error'));
  
        await expect(updateUserStatByUserId('user1', { totalPoisCreados: 15 })).rejects.toThrow('Could not update user stat for user ID: user1');
      });
    });
  
    describe('deleteUserStat', () => {
      it('should delete a user stat', async () => {
        repoInstance.delete.mockResolvedValue(undefined);
  
        await deleteUserStat('1');
  
        expect(repoInstance.delete).toHaveBeenCalledWith('1');
      });
  
      it('should throw an error when repository fails', async () => {
        repoInstance.delete.mockRejectedValue(new Error('Database error'));
  
        await expect(deleteUserStat('1')).rejects.toThrow('Could not delete user stat with ID: 1');
      });
    });
  });