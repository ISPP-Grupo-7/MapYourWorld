/**
 * Servicio de Perfil de Usuario
 * Gestiona la información de perfil (UserProfile).
 */

// import { publishEvent } from '@shared/libs/rabbitmq';
import { UserProfileRepository } from '../repositories/userProfile.repository';
import { UserProfile } from '../models/userProfile.model';

const userProfileRepository = new UserProfileRepository();

/**
 * Obtiene el perfil completo de un usuario por su ID de perfil (UUID).
 * @param profileId UUID del perfil (campo 'id' de UserProfile)
 */
export const getUserProfile = async (
  profileId: string
): Promise<UserProfile | null> => {
  try {
    const userProfile = await userProfileRepository.findById(profileId);
    return userProfile || null;
  } catch (error) {
    console.error(`Error al obtener perfil con ID ${profileId}:`, error);
    throw new Error(
      `No se pudo obtener el perfil: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
};

/**
 * Actualiza el perfil de un usuario
 * @param profileId UUID del perfil (campo 'id')
 * @param profileData Datos del perfil a actualizar (username, firstName, lastName, picture)
 */
export const updateUserProfile = async (
  profileId: string,
  profileData: Partial<Omit<UserProfile, 'id'>>
): Promise<UserProfile | null> => {
  try {
    const existingProfile = await userProfileRepository.findById(profileId);
    if (!existingProfile) {
      return null;
    }


    if (
      profileData.username &&
      profileData.username !== existingProfile.username
    ) {
      const userWithSameUsername = await userProfileRepository.findByUsername(
        profileData.username
      );
      if (userWithSameUsername) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    const updatedProfile = await userProfileRepository.update(profileId, profileData);
    if (!updatedProfile) {
      throw new Error('Error al actualizar el perfil');
    }


    // await publishEvent('user.profile.updated', {
    //   profileId,
    //   updatedFields: Object.keys(profileData),
    //   timestamp: new Date().toISOString(),
    // });

    return updatedProfile;
  } catch (error) {
    console.error(`Error al actualizar perfil con ID ${profileId}:`, error);
    throw new Error(
      `No se pudo actualizar el perfil: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
};

/**
 * Actualiza la imagen (picture) del usuario
 * @param profileId UUID del perfil (campo 'id')
 * @param pictureData Imagen en base64 o URL de imagen
 */
export const updateUserPicture = async (
  profileId: string,
  pictureData: string
): Promise<{ success: boolean; pictureUrl: string }> => {
  try {
    const existingProfile = await userProfileRepository.findById(profileId);
    if (!existingProfile) {
      throw new Error('Perfil no encontrado');
    }

    let pictureUrl: string;

    if (pictureData.startsWith('data:')) {
      pictureUrl = `https://storage.example.com/pictures/${profileId}-${Date.now()}.jpg`;
    } else if (
      pictureData.startsWith('http://') ||
      pictureData.startsWith('https://')
    ) {
      pictureUrl = pictureData;
    } else {
      throw new Error('Formato de imagen no soportado');
    }

    const updatedProfile = await userProfileRepository.update(profileId, {
      picture: pictureUrl,
    });
    if (!updatedProfile) {
      throw new Error('Error al actualizar la imagen');
    }


    // await publishEvent('user.picture.updated', {
    //   profileId,
    //   pictureUrl,
    //   timestamp: new Date().toISOString(),
    // });

    return { success: true, pictureUrl };
  } catch (error) {
    console.error(`Error al actualizar imagen del perfil ${profileId}:`, error);
    throw new Error(
      `No se pudo actualizar la imagen: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
};

/**
 * Busca usuarios por username, nombre o apellido
 * @param query Texto a buscar
 * @param limit Límite de resultados (por defecto 10)
 * @param offset Desplazamiento para paginación (por defecto 0)
 */
export const searchUsers = async (
  query: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ users: Partial<UserProfile>[]; total: number }> => {
  try {
    if (!query || query.trim().length < 3) {
      throw new Error('La consulta de búsqueda debe tener al menos 3 caracteres');
    }

    const sanitizedQuery = query.trim();


    const [users, total] = await userProfileRepository.search(
      sanitizedQuery,
      limit,
      offset
    );


    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      picture: user.picture,
    }));

    return { users: formattedUsers, total };
  } catch (error) {
    console.error(`Error al buscar usuarios con "${query}":`, error);
    throw new Error(
      `No se pudo realizar la búsqueda: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
};
