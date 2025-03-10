import { Request, Response } from 'express';
import * as FriendService from '../services/friend.service'; // Importamos el servicio
import { FriendStatus } from '../models/friend.model';

/**
 * Controlador de la gestión de relaciones de amistad.
 */
export const createFriendController = async (req: Request, res: Response): Promise<void> => {
  try {
    const friendData = req.body; // Recibimos los datos de la solicitud de amistad

    // Llamamos al servicio para crear una nueva relación de amistad
    const newFriend = await FriendService.createFriend(friendData);
    res.status(201).json(newFriend); // Retornamos el nuevo amigo creado

  } catch (error) {
    res.status(500).json({ message:'Error al crear amistad:', error });
  }
};

export const listFriendsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query; // Obtenemos el estado de la solicitud de amistad (PENDING/ACCEPTED)
    const { userId } = req.params; // Obtenemos el ID del usuario de la URL

    if (!status || !userId) {
      res.status(400).json({ message: 'Faltan parámetros requeridos.' });
      return;
    }

    const statusEnum = FriendStatus[status as keyof typeof FriendStatus];
    const friends = await FriendService.listFriends(statusEnum, userId);

    res.status(200).json(friends);

  } catch (error) {
    res.status(500).json({ message: 'Error al listar amigos:', error });
  }
};

export const findFriendByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendId } = req.params; // Obtenemos el ID del amigo desde la URL
    const friend = await FriendService.findFriendById(friendId);

    if (!friend) { 
      res.status(404).json({ message: `Amigo con ID ${friendId} no encontrado` });
      return;
    }

    res.status(200).json(friend);

  } catch (error) {
    console.error();
    res.status(500).json({ message: 'Error al obtener amigo por ID:', error});
  }
};

export const listSearchUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nameData } = req.query; // Obtenemos el dato de búsqueda (nombre) desde la query

    if (!nameData) {
       res.status(400).json({ message: 'Falta el parámetro de búsqueda (nameData)' });
       return;
      }

    const users = await FriendService.listSearchUser(nameData as string);
    res.status(200).json(users);

  } catch (error) {
    console.error();
    res.status(500).json({ message: 'Error al buscar usuarios:', error });
  }
};

export const updateFriendStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendId } = req.params; // Obtenemos el ID del amigo desde la URL

    const result = await FriendService.updateFriendStatus(friendId);

    res.status(200).json(result);

  } catch (error) {
    console.error();
    res.status(500).json({ message: 'Error al actualizar el estado de la amistad:', error });
  }
};

export const deleteFriendController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { friendId } = req.params; // Obtenemos el ID del amigo desde la URL

    await FriendService.deleteFriend(friendId);
    res.status(204).send(); // Retorna un 204 sin contenido si se eliminó correctamente

  } catch (error) {
    console.error();
    res.status(500).json({ message: 'Error al eliminar la amistad:', error });
  }
};
