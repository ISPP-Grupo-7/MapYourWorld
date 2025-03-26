import CollabMapRepository from '../repositories/collab.map.repository'; 
import MapRepository  from '../../../map-service/src/repositories/map.repository'; // Importa tu entidad
import FriendRepository from '../../../social-service/src/repositories/friend.repository';
const repo = new CollabMapRepository();
const mapRepo = new MapRepository();
const friendRepo = new FriendRepository();


/**
 * Unirse a un mapa existente
 * @param MapId ID del mapa a actualizar
 * @param userId ID del usuario que realiza la actualización 
 */
export const joinMap = async (
  MapId: string,
  UserId: string,
  friendId: string
): Promise<void> => {

  try {
    const mapa = await mapRepo.getMapById(MapId);
    if ((mapa.is_colaborative === true && mapa.users_joined.length > 4) || !mapa.is_colaborative) {
      throw new Error("No puedes unirte a este mapa");
    }
    await repo.joinMap(MapId, UserId);
    await friendRepo.deleteFriendInvitation(friendId);
  } catch (error) {
    console.error("Error al unirte al mapa:", error);
    throw error;
  }

};