/**
 * Controlador para los Puntos de Interés (POI)
 * Gestiona las peticiones HTTP relacionadas con POIs
 */

import { Request, Response } from 'express';
import * as POIService from '../services/poi.service';
import { AuthenticatedRequest } from '../../../../backend/api-gateway/src/types';
import * as AuthService from '../../../auth-service/src/services/auth.service';

/**
 * Crea un nuevo punto de interés
 */
export const createPOI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const poiData = req.body;

    // Obtener token desde los headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: 'Usuario no autenticado - Token no proporcionado' });
      return;
    }

    // Extraer el token después de "Bearer "
    const token = authHeader.split(" ")[1];

    // Verificar el token
    const verifiedUser = await AuthService.verifyUserToken(token);

    if (!verifiedUser) {
      res.status(401).json({ error: 'Token inválido o expirado' });
      return;
    }
    const newPOI = await POIService.createPOI(poiData, verifiedUser.userId);
    res.status(201).json(newPOI);
  } catch (error) {
    console.error('Error al crear el punto de interés:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Error al crear el punto de interés'
    });
  }
};



export const createPOISinToken = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const poiData = req.body;

    // Extraer las coordenadas y convertirlas a un tipo geométrico de PostGIS

    // Crear el objeto Geometry adecuado para PostGIS


    // Actualizar los datos con la geometría convertida
    const updatedPOIData = {
      ...poiData,
    };

    // Llamar al servicio para crear el nuevo POI
    const newPOI = await POIService.createPOISinToken(updatedPOIData);

    res.status(201).json(newPOI);
  } catch (error) {
    console.error('Error al crear el punto de interés:', error);
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Error al crear el punto de interés'
    });
  }
};


/**
 * Obtiene un punto de interés por su ID
 */
export const getPOIById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const poiId = req.params.id;

    if (!poiId) {
      res.status(400).json({ error: 'ID del punto de interés no proporcionado' });
      return;
    }

    const poi = await POIService.getPOIById(poiId);

    if (!poi) {
      res.status(404).json({ error: 'Punto de interés no encontrado' });
      return;
    }

    res.status(200).json(poi);
  } catch (error) {
    console.error('Error al obtener el punto de interés:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error al obtener el punto de interés'
    });
  }
};

/**
 * Actualiza un punto de interés existente
 */
export const updatePOI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const poiId = req.params.id;
    const updateData = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!poiId) {
      res.status(400).json({ error: 'ID del punto de interés no proporcionado' });
      return;
    }

    const updatedPOI = await POIService.updatePOI(poiId, updateData, userId);

    if (!updatedPOI) {
      res.status(404).json({ error: 'Punto de interés no encontrado' });
      return;
    }

    res.status(200).json(updatedPOI);
  } catch (error) {
    console.error('Error al actualizar el punto de interés:', error);
    res.status(error instanceof Error && error.message.includes('permisos') ? 403 : 400).json({
      error: error instanceof Error ? error.message : 'Error al actualizar el punto de interés'
    });
  }
};

/**
 * Elimina un punto de interés (marca como inactivo)
 */
export const deletePOI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const poiId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    if (!poiId) {
      res.status(400).json({ error: 'ID del punto de interés no proporcionado' });
      return;
    }

    const deleted = await POIService.deletePOI(poiId, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Punto de interés no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar el punto de interés:', error);
    res.status(error instanceof Error && error.message.includes('permisos') ? 403 : 500).json({
      error: error instanceof Error ? error.message : 'Error al eliminar el punto de interés'
    });
  }
};

/**
 * Busca puntos de interés cercanos a una ubicación geográfica
 */
export const findNearbyPOIs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { latitude, longitude, radius, category } = req.query;

    if (!latitude || !longitude || !radius) {
      res.status(400).json({
        error: 'Latitud, longitud y radio son parámetros obligatorios'
      });
      return;
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const radiusKm = parseFloat(radius as string);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
      res.status(400).json({
        error: 'Latitud, longitud y radio deben ser valores numéricos válidos'
      });
      return;
    }

    // Aplicar filtros adicionales si existen
    const filters = category ? { category: category as string } : undefined;

    const pois = await POIService.findNearbyPOIs(lat, lng, radiusKm, filters);
    res.status(200).json(pois);
  } catch (error) {
    console.error('Error al buscar puntos de interés cercanos:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error al buscar puntos de interés cercanos'
    });
  }
};
/**
 * Obtiene todos los puntos de interés
 */
export const getAllPOIs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pois = await POIService.getAllPOIs();
    res.status(200).json({ success: true, pois });
  } catch (error) {
    console.error('Error al obtener todos los POIs:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error al obtener los POIs' 
    });
  }
};

/**
 * Obtiene todos los puntos de interés de un mapa específico
 */
export const getPOIsByMapId = async (req: Request, res: Response): Promise<void> => {
  try {
    const mapId = req.params.mapId;
    console.log(`Controlador POI: Obteniendo POIs para el mapa ${mapId}`);

    if (!mapId) {
      res.status(400).json({ success: false, message: 'Falta el ID del mapa' });
      return;
    }

    // Por simplicidad, devolvemos una lista vacía por ahora
    // En una implementación real, buscaríamos los POIs en la base de datos
    console.log(`Controlador POI: No hay POIs para el mapa ${mapId}, devolviendo lista vacía`);
    
    res.status(200).json({ 
      success: true, 
      pois: [] 
    });
  } catch (error) {
    console.error('Error al obtener POIs por mapa:', error);
    res.status(500).json({ success: false, message: 'Error al obtener POIs por mapa' });
  }
};