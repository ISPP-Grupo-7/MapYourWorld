/**
 * Servicio de Distritos
 * Gestiona la creación, consulta y desbloqueo de distritos del mapa
 */

//import { publishEvent } from '@shared/libs/rabbitmq';
import { Friend, FriendStatus } from '../models/friend.model';
import { AppDataSource } from '../../../database/appDataSource';
import FriendRepository from '../repositories/friend.repository';
import { User } from '../../../auth-service/src/models/user.model';

const repo = new FriendRepository();



export const createFriend = async (
  friendData: Omit<Friend, 'id'>,
): Promise<Friend> => {

  try {
    if (!friendData.recipient || !friendData.requester || !friendData.status) {
      throw new Error("Los datos de receptor, solicitante y estado de la petición son necesarios.")
    }  
    const newFriend = repo.createFriend(friendData);
    console.log("Entrada de solicitud de amistad realizada", newFriend);
    return newFriend;

  } catch (error) {
    console.log(error)
  }
  throw new Error('Método no implementado');
};


export const listFriends = async (
  status:FriendStatus,
  userId: string
): Promise<Friend[]> => {
  const friends = await repo.findAllByIdAndStatus(userId, status);
  if (friends.length === 0) {
    throw new Error(`No se encontraron solicitudes de amistad para el usuario con ID ${userId}`);
  }
  return friends;

};

 

export const findFriendById = async (friendId: string): Promise<Friend | null> => {
  // TODO: Implementar la obtención de un distrito por ID
  // 1. Buscar el distrito en la base de datos
  const friend = await repo.getFriendById(friendId);


  // 2. Retornar null si no se encuentra
  if (friend === null) {
    throw new Error(`Distrito con ID ${friendId} no encontrado`);
  }
  else {
    return friend;
  }

};

/**
 * Obtiene todos los distritos
 * @param includeInactive Indica si se deben incluir distritos inactivos
 */
export const listSearchUser = async (
  nameData: string
): Promise<User[]> => {
  // TODO: Implementar la obtención de todos los distritos
  // 1. Consultar todos los distritos en la base de datos
  const users = await repo.findAllUsersByName(nameData);
  return users;
};

/**
 * Actualiza un distrito existente
 * @param districtId ID del distrito a actualizar
 * @param updateData Datos a actualizar del distrito
 * @param userId ID del usuario administrador que realiza la actualización
 */
export const updateFriendStatus = async (
  friendId: string,
): Promise<{
  success: boolean;
  message?: string;
}> => {

  const updatedFriend = await repo.updateFriendStatus(friendId);
  // 3. Publicar evento de distrito desbloqueado
  if (updatedFriend.status === FriendStatus.ACCEPTED) {
    return { success: true, message: 'Solicitud de amistad aceptada correctamente' };
  } else {
    throw new Error('Error al aceptar la solicitud de amistad');
  }

};

export const deleteFriend = async (friendId: string): Promise<void> => {
  await repo.deleteFriend(friendId);
};

