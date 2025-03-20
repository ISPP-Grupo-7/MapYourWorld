import { Request, Response } from 'express';
import * as UserStatService from '../services/userStat.service';

export const getAllUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userStats = await UserStatService.getAllUserStats();
    res.json(userStats);
  } catch (error) {
    console.error('Error in getAllUserStats controller:', error);
    res.status(500).json({ 
      message: 'Error fetching user stats', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const getUserStatById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userStat = await UserStatService.getUserStatById(id);
    
    if (!userStat) {
      res.status(404).json({ message: `User stat with ID ${id} not found` });
      return;
    }
    
    res.json(userStat);
  } catch (error) {
    console.error(`Error in getUserStatById controller for ID ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error fetching user stat', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const getUserStatByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const userStat = await UserStatService.getUserStatByUserId(userId);
    
    if (!userStat) {
      res.status(404).json({ message: `User stat for user ID ${userId} not found` });
      return;
    }
    
    res.json(userStat);
  } catch (error) {
    console.error(`Error in getUserStatByUserId controller for user ID ${req.params.userId}:`, error);
    res.status(500).json({ 
      message: 'Error fetching user stat', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const createUserStat = async (req: Request, res: Response): Promise<void> => {
  try {
    const userStat = await UserStatService.createUserStat(req.body);
    res.status(201).json(userStat);
  } catch (error) {
    console.error('Error in createUserStat controller:', error);
    res.status(400).json({ 
      message: 'Error creating user stat', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const updateUserStat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedUserStat = await UserStatService.updateUserStat(id, req.body);
    
    if (!updatedUserStat) {
      res.status(404).json({ message: `User stat with ID ${id} not found` });
      return;
    }
    
    res.json(updatedUserStat);
  } catch (error) {
    console.error(`Error in updateUserStat controller for ID ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error updating user stat', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const updateUserStatByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const updatedUserStat = await UserStatService.updateUserStatByUserId(userId, req.body);
    
    if (!updatedUserStat) {
      res.status(404).json({ message: `User stat for user ID ${userId} not found` });
      return;
    }
    
    res.json(updatedUserStat);
  } catch (error) {
    console.error(`Error in updateUserStatByUserId controller for user ID ${req.params.userId}:`, error);
    res.status(500).json({ 
      message: 'Error updating user stat', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

export const deleteUserStat = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await UserStatService.deleteUserStat(id);
    res.status(204).send();
  } catch (error) {
    console.error(`Error in deleteUserStat controller for ID ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error deleting user stat', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};