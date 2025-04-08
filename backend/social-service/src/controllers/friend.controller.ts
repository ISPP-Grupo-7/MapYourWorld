import { Request, Response } from 'express';
import * as FriendService from '../services/friend.service'; 
import { Friend, FriendStatus } from '../models/friend.model';

/**
 * Controlador para crear una solicitud de amistad.
 */
export const createFriendController = async (req: Request, res: Response): Promise<void> => {
  try {
    const {requesterId, receiverId, mapId} = req.body; 
    if (!requesterId || !receiverId) {
      res.status(400).json({ message: 'Faltan parámetros requeridos.' });
      return;
    }
    const newFriend = await FriendService.sendRequestFriend(requesterId, receiverId, mapId);
    res.status(201).json({success: true, message: "Amistad creada exitosamente", friend: newFriend});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear amistad",
      error: error instanceof Error ? error.message : error,
    });
  }
};




/**
 * Controlador para listar solicitudes de amistad según estado.
 * Se espera recibir en los parámetros: status y userId.
 */
export const listFriendsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, userId } = req.params;
    if (!status || !userId) {
      res.status(400).json({ message: 'Faltan parámetros requeridos.' });
      return;
    }
    const statusEnum = FriendStatus[status as keyof typeof FriendStatus];
    const friends = await FriendService.listFriends(statusEnum, userId);
    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al listar solicitudes de amistad:', 
      error: error instanceof Error ? error.message : error 
    });
  }
};

/**
 * Controlador para obtener una solicitud de amistad por ID.
 */
export const findFriendByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendId } = req.params;
    if (!friendId) {
      res.status(400).json({ message: 'Falta el parámetro de solicitud de amistad (friendId)' });
      return;
    }
    const friend = await FriendService.findFriendById(friendId);
    if (!friend) { 
      res.status(404).json({ message: `Amigo con ID ${friendId} no encontrado` });
      return;
    }
    res.status(200).json(friend);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener solicitud de amistad por ID:', 
      error: error instanceof Error ? error.message : error 
    });
  }
};

/**
 * Controlador para buscar usuarios por nombre.
 */
export const listSearchUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const nameData = req.params.nameData;
    if (!nameData) {
       res.status(400).json({ message: 'Falta el parámetro de búsqueda (nameData)' });
       return;
    }
    const users = await FriendService.listSearchUser(nameData as string);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al buscar usuarios:', 
      error: error instanceof Error ? error.message : error 
    });
  }
};

/**
 * Controlador para actualizar el estado de una solicitud de amistad.
 * Por ejemplo, para aceptar la solicitud se llamaría con status = ACCEPTED.
 */
export const updateFriendStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendId, status } = req.params;
    const statusEnum = FriendStatus[status as keyof typeof FriendStatus];
    const result = await FriendService.updateFriendStatus(friendId, statusEnum);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al actualizar el estado de la amistad:', 
      error: error instanceof Error ? error.message : error 
    });
  }
};

/**
 * Controlador para obtener la lista de amigos (solicitudes ACCEPTED) de un usuario.
 * Se espera recibir el userId en los parámetros.
 */
export const getFriendsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: 'Falta el parámetro userId.' });
      return;
    }
    const friends = await FriendService.getFriends(userId);
    res.status(200).json(friends);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener lista de amigos:', 
      error: error instanceof Error ? error.message : error 
    });
  }
};

export const getPendingRequestsForRecipientController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: 'Falta el parámetro userId.' });
      return;
    }
    const pendingRequests = await FriendService.getPendingRequestsForRecipient(userId);
    res.status(200).json(pendingRequests);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener solicitudes pendientes para el destinatario:', 
      error: error instanceof Error ? error.message : error 
    });
  }
}
