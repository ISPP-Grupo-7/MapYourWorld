// In backend/map-service/src/controllers/location.controller.ts
import { Request, Response } from 'express';
import { locationService } from '../services/location.service';
import {AuthenticatedRequest} from "@backend/api-gateway/src/types";
/**
 * Guardar la ubicación del usuario en la base de datos
 */
export const saveUserLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Recibida petición de ubicación:', req.body);
    const userId = req.user?.userId || '1'; // ID por defecto para pruebas
    const { latitude, longitude, timestamp } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    // Convertir a números
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinate format'
      });
    }
    
    const result = await locationService.saveUserLocation(
      userId,
      lat,
      lng,
      timestamp ? new Date(timestamp) : new Date()
    );
    
    return res.status(200).json({
      success: true,
      message: 'Location saved successfully'
      //,district: result.district || null
    });
    
  } catch (error) {
    console.error('Error saving location:', error);
    return res.status(500).json({
      success: false,
      message: `Error processing location data: ${error}`
    });
  }
};