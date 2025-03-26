import { Request, Response } from 'express';
import * as collabMapService from '../services/collab.map.service';

/**
 * Controlador para unirse a un mapa existente
 */
export const joinMap = async (req: Request, res: Response): Promise<void> => {
  try {
    const mapId = req.params.mapId;
    const userId = req.params.userId;
    const { friendId } = req.body;

    if (!mapId || !userId || !friendId) {
      res.status(400).json({ success: false, message: 'MapId y UserId son requeridos' });
      return;
    }

    await collabMapService.joinMap(mapId, userId, friendId);

    res.status(200).json({
      success: true,
      message: 'Usuario unido al mapa exitosamente'
    });
  } catch (error) {
    console.error('Error al unirse al mapa:', error);
    res.status(400).json({
      success: false,
      message: 'Error al unirse al mapa',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};