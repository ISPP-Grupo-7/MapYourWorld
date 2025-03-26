import { PhotoRepository } from '../repositories/photo.repository';
import { Photo } from '../models/photo.model';

const photoRepo = new PhotoRepository();

/**
 * Crea una nueva foto y la asocia a un Point of Interest (POI)
 * @param photoData Datos de la foto a crear
 * @param poiId ID del Point of Interest al que asociar la foto
 */
export const uploadPhotoToPoi = async (photoData: Omit<Photo, 'id'>, poiId: string): Promise<Photo> => {
  return await photoRepo.createPhoto({ ...photoData}, poiId );
};

/**
 * Obtiene una foto por su ID
 * @param id ID de la foto
 */
export const findPhotoById = async (id: string): Promise<Photo | null> => {
  return await photoRepo.getById(id);
};

/**
 * Obtiene todas las fotos
 */
export const findAllPhotos = async (): Promise<Photo[]> => {
  return await photoRepo.getAll();
};

/**
 * Actualiza una foto existente
 * @param id ID de la foto a actualizar
 * @param updateData Datos a actualizar de la foto
 */
export const updatePhoto = async (id: string, updateData: Partial<Photo>): Promise<Photo | null> => {
  return await photoRepo.updatePhoto(id, updateData);
};

/**
 * Elimina una foto por su ID
 * @param id ID de la foto a eliminar
 */
export const deletePhoto = async (id: string): Promise<boolean> => {
  return await photoRepo.deletePhoto(id);
};

/**
 * Obtiene todas las fotos asociadas a un POI específico
 * @param poiId ID del Point of Interest
 */
export const getPhotosByPoiId = async (poiId: string): Promise<Photo[]> => {
  return await photoRepo.getByPoiId(poiId);
};
