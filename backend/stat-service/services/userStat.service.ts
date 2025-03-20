import { UserStatRepository } from '../repositories/userStat.repository';
import { UserStat } from '../models/userStat.model';

const userStatRepository = new UserStatRepository();

export const getAllUserStats = async (): Promise<UserStat[]> => {
  try {
    return await userStatRepository.findAll();
  } catch (error) {
    console.error('Error fetching all user stats:', error);
    throw new Error('Could not fetch user stats');
  }
};

export const getUserStatById = async (id: string): Promise<UserStat | null> => {
  try {
    return await userStatRepository.findById(id);
  } catch (error) {
    console.error(`Error fetching user stat with ID ${id}:`, error);
    throw new Error(`Could not fetch user stat with ID: ${id}`);
  }
};

export const getUserStatByUserId = async (userId: string): Promise<UserStat | null> => {
  try {
    return await userStatRepository.findByUserId(userId);
  } catch (error) {
    console.error(`Error fetching user stat for user ID ${userId}:`, error);
    throw new Error(`Could not fetch user stat for user ID: ${userId}`);
  }
};

export const createUserStat = async (userStatData: Partial<UserStat>): Promise<UserStat> => {
  try {
    // Check if a stat already exists for this user
    if (userStatData.userId) {
      const existingStat = await userStatRepository.findByUserId(userStatData.userId);
      if (existingStat) {
        throw new Error(`User stat already exists for user ID: ${userStatData.userId}`);
      }
    }
    
    return await userStatRepository.create(userStatData);
  } catch (error) {
    console.error('Error creating user stat:', error);
    throw error;
  }
};

export const updateUserStat = async (id: string, userStatData: Partial<UserStat>): Promise<UserStat | null> => {
  try {
    return await userStatRepository.updateById(id, userStatData);
  } catch (error) {
    console.error(`Error updating user stat with ID ${id}:`, error);
    throw new Error(`Could not update user stat with ID: ${id}`);
  }
};

export const updateUserStatByUserId = async (userId: string, statsUpdate: Partial<UserStat>): Promise<UserStat | null> => {
  try {
    return await userStatRepository.update(userId, statsUpdate);
  } catch (error) {
    console.error(`Error updating user stat for user ID ${userId}:`, error);
    throw new Error(`Could not update user stat for user ID: ${userId}`);
  }
};

export const deleteUserStat = async (id: string): Promise<void> => {
  try {
    await userStatRepository.delete(id);
  } catch (error) {
    console.error(`Error deleting user stat with ID ${id}:`, error);
    throw new Error(`Could not delete user stat with ID: ${id}`);
  }
};