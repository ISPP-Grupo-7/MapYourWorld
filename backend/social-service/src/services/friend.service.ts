import { Friend, FriendStatus, RequestType } from '../models/friend.model';
import FriendRepository from '../repositories/friend.repository';
import { User } from '../../../auth-service/src/models/user.model';
import { AppDataSource } from '../../../database/appDataSource';
import { AuthRepository } from '../../../auth-service/src/repositories/auth.repository';
import MapRepository from '../../../map-service/src/repositories/map.repository';

const repo = new FriendRepository();
const userRepo = new AuthRepository();
const mapRepo = new MapRepository();

/**
 * Envía una solicitud de amistad.
 * Valida que los datos sean correctos y que no exista ya una solicitud activa.
 */
export const sendRequestFriend = async (

  requesterId:string,
  recipientId:string,
  mapId?:string

): Promise<Friend | { success: boolean; message: string }> => {
  try {
    var map: any = null;

    if (requesterId === recipientId) {
      throw new Error("El receptor y el solicitante deben ser distintos.");
    }
    
    if(mapId){
      map = await mapRepo.getOnlyMapById(mapId);
      if(!map){
        throw new Error("El mapa no fue encontrado");
      }
    }else{
      const existingFriendship = await repo.findExistingFriendship(requesterId, recipientId);

    if (existingFriendship && existingFriendship.requestType === RequestType.FRIEND) {
      if (existingFriendship.status === FriendStatus.PENDING) {
        return { success: false, message: "Ya existe una solicitud de amistad pendiente." };
      }
      if (existingFriendship.status === FriendStatus.ACCEPTED) {
        return { success: false, message: "Estos usuarios ya son amigos." };
      }
      if (existingFriendship.status === FriendStatus.BLOCKED) {
        return { success: false, message: "No se puede enviar solicitud porque uno de los usuarios ha bloqueado la relación." };
      }
      if (existingFriendship.status === FriendStatus.DELETED) {
        // Reactivar la amistad en estado pendiente
        return await repo.updateFriendStatus(existingFriendship.id, FriendStatus.PENDING);
      }
    }
    }


    
    const requester = await userRepo.findById(requesterId);
    const recipient = await userRepo.findById(recipientId);



    if (!requester || !recipient) {
      throw new Error(`Uno de los usuarios no fue encontrado (requester: ${requesterId}, recipient: ${recipientId}).`);
    }
    
    if(map){
    const usersMap = await mapRepo.getUsersOnMapById(map.id)
    const usuariosMapId = usersMap.map(user => user.id)


    if(usuariosMapId.some(userId => userId == recipient.id)){
      throw new Error("Está intentando invitar a un usuario que ya está dentro de la partida")
    }

    if (!usuariosMapId.includes(requester.id)){
      throw new Error("No puede invitar si no está unido al mapa")
    }

    }

    // Crear la solicitud de amistad
    const newFriend = new Friend();
    newFriend.requester = requester;
    newFriend.recipient = recipient;
    newFriend.createdAt = new Date();
    newFriend.updatedAt = new Date();
    if(map){
      newFriend.requestType = RequestType.MAP;
      newFriend.map = map;
    }

    const savedFriend = await repo.createFriend(newFriend);

    console.log("Solicitud de amistad creada:", newFriend);
    return savedFriend;

  } catch (error) {
    console.error("Error al crear solicitud de amistad:", error);
    throw error;
  }
};


/**
 * Lista las solicitudes de amistad de un usuario según el estado indicado.
 *
 * @param status Estado de la solicitud de amistad (PENDING, ACCEPTED, BLOCKED)
 * @param userId ID del usuario
 * @returns Lista de solicitudes de amistad
 */
export const listFriends = async (
  status: FriendStatus,
  userId: string
): Promise<Friend[]> => {
  const friends = await repo.findAllByIdAndStatus(userId, status);
  return friends;
};

/**
 * Obtiene una solicitud de amistad por su ID.
 *
 * @param friendId ID de la solicitud de amistad
 * @returns La solicitud de amistad encontrada o lanza un error si no existe
 */
export const findFriendById = async (friendId: string): Promise<Friend | null> => {
  const friend = await repo.getFriendById(friendId);
  if (!friend) {
    throw new Error(`Solicitud de amistad con ID ${friendId} no encontrada`);
  } else {
    return friend;
  }
};

/**
 * Busca usuarios por nombre para facilitar la selección de amigos.
 *
 * @param nameData Texto de búsqueda del nombre del usuario
 * @returns Lista de usuarios que coinciden con el criterio de búsqueda
 */
export const listSearchUser = async (
  nameData: string
): Promise<User[]> => {
  const users = await repo.findAllUsersByName(nameData);
  return users;
};

/**
 * Actualiza el estado de una solicitud de amistad.
 *
 * @param friendId ID de la solicitud de amistad a actualizar
 * @param status Nuevo estado de la solicitud de amistad
 * @returns Objeto con el resultado de la actualización
 */
export const updateFriendStatus = async (
  friendId: string,
  status: FriendStatus,
): Promise<{
  success: boolean;
  message?: string;
}> => {
  const updatedFriend = await repo.updateFriendStatus(friendId, status);
  if (!updatedFriend) {
    throw new Error('Error al actualizar el estado de la solicitud de amistad');
  }

  switch (updatedFriend.status) {
    case FriendStatus.ACCEPTED:
      if (updatedFriend.status === FriendStatus.ACCEPTED) {
        return { success: true, message: 'Solicitud de amistad aceptada correctamente' };
      } else {
        throw new Error('Error al actualizar el estado de la solicitud de amistad');
      }
    case FriendStatus.BLOCKED:
      if (updatedFriend.status === FriendStatus.BLOCKED) {
        return { success: true, message: 'Solicitud de amistad bloqueada correctamente' };
      } else {
        throw new Error('Error al actualizar el estado de la solicitud de amistad');
      }
    case FriendStatus.DELETED:
      if (updatedFriend.status === FriendStatus.DELETED) {
        return { success: true, message: 'Solicitud de amistad eliminada correctamente' };
      } else {
        throw new Error('Error al actualizar el estado de la solicitud de amistad');
      }
    default:
      throw new Error('Error al actualizar el estado de la solicitud de amistad');
  }
};

/**
 * Obtiene la lista de amigos (relaciones ACCEPTED) de un usuario.
 *
 * @param userId ID del usuario.
 * @returns Lista de usuarios amigos.
 */
export const getFriends = async (
  userId: string
): Promise<User[]> => {
  const friends = await repo.getFriends(userId);
  return friends;
};

export const getPendingRequestsForRecipient = async (
  userId: string
): Promise<Friend[]> => {
  const pendingRequests = await repo.getPendingRequestsForRecipient(userId);
  return pendingRequests;
};
