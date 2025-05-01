/**
 * Servicio de Regiones
 * Gestiona la creación, consulta y actualización de regiones del mapa
 */

import { Region } from '../models/region.model';
import RegionRepository from '../repositories/region.repository';

const repo = new RegionRepository();

/**
 * Crea una nueva región
 * @param regionData Datos de la región a crear
 */
export const createRegion = async (
  regionData: Omit<Region, 'id'>,
  mapaId: string
): Promise<Region | null> => {
  try {
    // 1. Validar los datos de la región
    if (!regionData.name || !regionData.description || !mapaId) {
      throw new Error("Faltan datos importantes como el nombre, la descripción o el id del mapa a asignar.");
    }

    // 2. Crear y guardar la región correctamente
    const newRegion = await repo.createRegion(regionData, mapaId);

    console.log("Región creada correctamente:", newRegion);
    return newRegion;
  } catch (error) {
    console.error("Error al crear la región:", error);
    throw error;
  }
};

/**
 * Obtiene una región por su ID
 * @param regionId ID de la región a obtener
 */
export const getRegionById = async (regionId: string): Promise<Region | null> => {
  // 1. Buscar la región en la base de datos
  const region = await repo.getRegionById(regionId);

  // 2. Retornar error si no se encuentra
  if (!region) {
    throw new Error(`Región con ID ${regionId} no encontrada`);
  } else {
    return region;
  }
};

/**
 * Obtiene una región por su nombre
 * @param regionName Nombre de la región a obtener
 */
export const getRegionByName = async (regionName: string): Promise<Region | null> => {
  const region = await repo.getRegionByName(regionName);
  if (!region) {
    throw new Error(`Región con nombre ${regionName} no encontrada`);
  } else {
    return region;
  }
};

/**
 * Obtiene todas las regiones
 */
export const getAllRegions = async (): Promise<Region[]> => {
  // 1. Consultar todas las regiones en la base de datos
  const regions = await repo.getRegions();
  return regions;
};

/**
 * Actualiza una región existente
 * @param regionId ID de la región a actualizar
 * @param updateData Datos a actualizar de la región
 */
export const updateRegion = async (
  regionId: string,
  updateData: Partial<Omit<Region, 'id'>>
): Promise<Region | null> => {
  try {
    // 1. Validar los datos de actualización
    if (!updateData.name || !updateData.description) {
      throw new Error("Faltan datos importantes como el nombre o la descripción.");
    }

    // 2. Actualizar la región en la base de datos
    const updatedRegion = await repo.updateRegion(regionId, updateData);

    return updatedRegion;
  } catch (error) {
    console.error("Error al actualizar la región:", error);
    throw error;
  }
};

/**
 * Elimina una región por su ID
 * @param regionId ID de la región a eliminar
 */
export const deleteRegion = async (
  regionId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const deleted = await repo.deleteRegion(regionId);
    if (!deleted) {
      throw new Error(`No se pudo eliminar la región con ID ${regionId}`);
    }
    return { success: true, message: "Región eliminada correctamente" };
  } catch (error) {
    console.error("Error al eliminar la región:", error);
    throw error;
  }
};