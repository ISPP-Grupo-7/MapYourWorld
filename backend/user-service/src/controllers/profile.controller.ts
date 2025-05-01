import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateUserPicture,
  searchUsers,
  createUserProfile,
} from '../services/profile.service';

export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const profileId = req.params.profileId;
    const profile = await getUserProfile(profileId);
    if (!profile) {
      res.status(404).json({ message: 'Perfil no encontrado' });
      return;
    }
    res.json(profile);
  } catch (error) {
    console.error(`Error al obtener el perfil ${req.params.profileId}:`, error);
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const profileId = req.params.profileId;
    const profileData = req.body;
    const updatedProfile = await updateUserProfile(profileId, profileData);
    if (!updatedProfile) {
      res.status(404).json({ message: 'Perfil no encontrado' });
      return;
    }
    res.json(updatedProfile);
  } catch (error) {
    console.error(`Error al actualizar el perfil ${req.params.profileId}:`, error);
    next(error);
  }
};

export const updatePicture: RequestHandler = async (req, res, next) => {
  try {
    const profileId = req.params.profileId;
    const { pictureData } = req.body;
    if (!pictureData) {
      res.status(400).json({ message: 'Falta pictureData en la solicitud' });
      return;
    }
    const result = await updateUserPicture(profileId, pictureData);
    res.json(result);
  } catch (error) {
    console.error(`Error al actualizar la imagen del perfil ${req.params.profileId}:`, error);
    next(error);
  }
};

export const searchProfiles: RequestHandler = async (req, res, next) => {
  try {
    const query = req.query.query as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const result = await searchUsers(query, limit, offset);
    res.json(result);
  } catch (error) {
    console.error(`Error al buscar perfiles con query "${req.query.query}":`, error);
    next(error);
  }
};

  export const createProfile: RequestHandler = async (req, res, next) => {
    try {
      const profileData = req.body;
      const newProfile = await createUserProfile(profileData);
      res.status(201).json(newProfile);
    } catch (error) {
      console.error('Error al crear el perfil:', error);
      next(error);
    }
  };

