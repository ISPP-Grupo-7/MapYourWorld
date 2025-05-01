import { Request, Response } from 'express';
import * as UserAchievementService from '../../achievement-service/services/userAchievement.service';
import * as UserFriendService from '../../social-service/src/services/friend.service';
import * as PoiService from '../../map-service/src/services/poi.service';
import * as DistrictService from '../../map-service/src/services/district.service';
import * as MapService from '../../map-service/src/services/map.service';

/**
 * Obtiene la lista de estadísticas de un usuario.
 *
 * @param userId ID del usuario.
 * @returns Lista de estadísticas.
 */
export const getAllStatsByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    //logros, amigos, pois creados, numero de distritos desbloqueados, número de mapas colaborativos.
    const logros = await UserAchievementService.getAchievementsByUser(req.params.userId);
    const numeroLogros = logros.length;

    const amigos = await UserFriendService.getFriends(req.params.userId);
    const numeroAmigos = amigos.length;

    const poisCreados = await PoiService.getPointsOfInterestByUserId(req.params.userId);
    const numeroPoisCreados = poisCreados.length;

    const distritosDesbloqueados = await DistrictService.getUserUnlockedDistricts(req.params.userId);
    const numeroDistritosDesbloqueados = distritosDesbloqueados.length;

    const mapasColaborativos = await MapService.getCollaborativeMapsForUser(req.params.userId);
    const numeroMapasColaborativos = mapasColaborativos.length;

    res.json({numeroLogros:numeroLogros, numeroAmigos: numeroAmigos, numeroPoisCreados: numeroPoisCreados, numeroDistritosDesbloqueados: numeroDistritosDesbloqueados, 
      numeroMapasColaborativos: numeroMapasColaborativos});

  } catch (error) {
    console.error('Error in getAllStatsByUser controller:', error);
    res.status(500).json({ 
      message: 'Error fetching user stats', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};