/**
 * Servicio de Perfil de Usuario
 * Gestiona la información de perfil, preferencias y estadísticas de los usuarios
 */

import { publishEvent } from '@shared/libs/rabbitmq';
import { UserProfileRepository } from '../repositories/userProfile.repository';
import { UserProfile } from '../models/userProfile.model';

/**
 * Obtiene el perfil completo de un usuario
 * @param userId ID del usuario
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRepository = new UserProfileRepository();
    const userProfile = await userRepository.findByUserId(userId);
    if (!userProfile) return null;

    return {
      ...userProfile,
      lastActive: userProfile.lastActive ? userProfile.lastActive : userProfile.updatedAt,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt
    };
  } catch (error) {
    console.error(`Error al obtener perfil de usuario ${userId}:`, error);
    throw new Error(`No se pudo obtener el perfil: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Obtiene perfil básico visible por otros usuarios
 * @param userId ID del usuario
 * @param viewerId ID del usuario que está viendo el perfil (opcional)
 */
export const getPublicUserProfile = async (
  userId: string,
  viewerId?: string
): Promise<Partial<UserProfile> | null> => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return null;
    if (viewerId === userId) return profile;

    const privacySettings = profile.preferences.privacySettings;
    if (privacySettings.profileVisibility === 'private') {
      return {
        id: profile.id,
        username: profile.username,
        avatar: profile.avatar
      };
    }

    const { email, phone, preferences, lastActive, ...baseProfile } = profile;

    const publicProfile = {
      ...baseProfile,
      ...(privacySettings.showLocation ? { location: profile.location } : {}),
    };
    
    return publicProfile;
  } catch (error) {
    console.error(`Error al obtener perfil público ${userId}:`, error);
    throw new Error(`No se pudo obtener el perfil público: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Actualiza el perfil de un usuario
 * @param userId ID del usuario
 * @param profileData Datos del perfil a actualizar
 */
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'statistics' | 'accountStatus'>>
): Promise<UserProfile | null> => {
  try {
    const userRepository = new UserProfileRepository();
    const existingProfile = await userRepository.findByUserId(userId);
    if (!existingProfile) return null;

    const updateData: Partial<UserProfile> = {};

    if (profileData.username && profileData.username !== existingProfile.username) {
      const userWithSameUsername = await userRepository.findByUsername(profileData.username);
      if (userWithSameUsername) {
        throw new Error('El nombre de usuario ya está en uso');
      }
      updateData.username = profileData.username;
    }
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;
    if (profileData.phone !== undefined) updateData.phone = profileData.phone;

    if (profileData.location) {
      updateData.location = { ...existingProfile.location, ...profileData.location };
    }
    if (profileData.social) {
      updateData.social = { ...existingProfile.social, ...profileData.social };
    }

    const updatedProfile = await userRepository.update(userId, updateData);
    if (!updatedProfile) {
      throw new Error('Error al actualizar el perfil');
    }

    await publishEvent('user.profile.updated', {
      userId,
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    });
    return getUserProfile(userId);
  } catch (error) {
    console.error(`Error al actualizar perfil del usuario ${userId}:`, error);
    throw new Error(`No se pudo actualizar el perfil: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Actualiza la imagen de avatar del usuario
 * @param userId ID del usuario
 * @param avatarData Imagen en base64 o URL de imagen
 */
export const updateUserAvatar = async (
  userId: string,
  avatarData: string
): Promise<{ success: boolean; avatarUrl: string }> => {
  try {
    const userRepository = new UserProfileRepository();
    const existingProfile = await userRepository.findByUserId(userId);
    if (!existingProfile) throw new Error('Usuario no encontrado');

    let avatarUrl: string;
    if (avatarData.startsWith('data:')) {
      // Simular la subida de imagen y generar una URL
      avatarUrl = `https://storage.example.com/avatars/${userId}-${Date.now()}.jpg`;
    } else if (avatarData.startsWith('http://') || avatarData.startsWith('https://')) {
      avatarUrl = avatarData;
    } else {
      throw new Error('Formato de imagen no soportado');
    }

    const updatedProfile = await userRepository.update(userId, { avatar: avatarUrl });
    if (!updatedProfile) throw new Error('Error al actualizar avatar');

    await publishEvent('user.avatar.updated', {
      userId,
      avatarUrl,
      timestamp: new Date().toISOString()
    });
    return { success: true, avatarUrl };
  } catch (error) {
    console.error(`Error al actualizar avatar para el usuario ${userId}:`, error);
    throw new Error(`No se pudo actualizar el avatar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Actualiza las preferencias del usuario
 * @param userId ID del usuario
 * @param preferences Preferencias a actualizar
 */
export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<UserProfile['preferences']>
): Promise<UserProfile['preferences'] | undefined> => {
  try {
    const userRepository = new UserProfileRepository();
    const existingProfile = await userRepository.findByUserId(userId);
    if (!existingProfile) throw new Error('Usuario no encontrado');

    const validatedPreferences: Partial<UserProfile['preferences']> = {};
    if (preferences.theme) {
      const validThemes = ['light', 'dark', 'system'];
      if (!validThemes.includes(preferences.theme)) {
        throw new Error('Tema no válido. Opciones válidas: light, dark, system');
      }
      validatedPreferences.theme = preferences.theme;
    }
    if (preferences.language) {
      const supportedLanguages = ['es', 'en'];
      if (!supportedLanguages.includes(preferences.language)) {
        throw new Error(`Idioma no soportado. Idiomas disponibles: ${supportedLanguages.join(', ')}`);
      }
      validatedPreferences.language = preferences.language;
    }
    if (preferences.notificationsEnabled !== undefined) {
      validatedPreferences.notificationsEnabled = Boolean(preferences.notificationsEnabled);
    }
    if (preferences.privacySettings) {
      validatedPreferences.privacySettings = { ...existingProfile.preferences.privacySettings };
      if (preferences.privacySettings.profileVisibility) {
        const validVisibilities = ['public', 'followers', 'private'];
        if (!validVisibilities.includes(preferences.privacySettings.profileVisibility)) {
          throw new Error('Visibilidad de perfil no válida. Opciones: public, followers, private');
        }
        validatedPreferences.privacySettings.profileVisibility = preferences.privacySettings.profileVisibility;
      }
    }

    const updatedPreferences = {
      ...existingProfile.preferences,
      ...validatedPreferences,
      privacySettings: {
        ...existingProfile.preferences.privacySettings,
        ...(validatedPreferences.privacySettings || {})
      }
    };

    const updatedProfile = await userRepository.updatePreferences(userId, updatedPreferences);
    if (!updatedProfile) throw new Error('Error al actualizar las preferencias');

    await publishEvent('user.preferences.updated', {
      userId,
      updatedFields: Object.keys(validatedPreferences),
      timestamp: new Date().toISOString()
    });
    return updatedProfile.preferences;
  } catch (error) {
    console.error(`Error al actualizar preferencias del usuario ${userId}:`, error);
    throw new Error(`No se pudieron actualizar las preferencias: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Busca usuarios por nombre de usuario o nombre completo
 * @param query Texto a buscar
 * @param limit Límite de resultados (por defecto 10)
 * @param offset Desplazamiento para paginación
 */
export const searchUsers = async (
  query: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  users: Partial<UserProfile>[];
  total: number;
}> => {
  try {
    if (!query || query.trim().length < 3) {
      throw new Error('La consulta de búsqueda debe tener al menos 3 caracteres');
    }
    
    const sanitizedQuery = query.trim();
    const userRepository = new UserProfileRepository();
    const [users, total] = await userRepository.search(sanitizedQuery, limit, offset);
    
    const formattedUsers = users.map(user => ({
      userId: user.id,
      username: user.username,
      fullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
      bio: user.bio?.substring(0, 100),
      avatar: user.avatar,
      statistics: {
        followers: user.statistics.followers,
        following: user.statistics.following
      },
      accountStatus: user.accountStatus
    })) as unknown as Partial<UserProfile>[];
    
    return { users: formattedUsers, total };
  } catch (error) {
    console.error(`Error al buscar usuarios con consulta "${query}":`, error);
    throw new Error(`No se pudo realizar la búsqueda: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

/**
 * Desactiva la cuenta de un usuario
 * @param userId ID del usuario
 * @param reason Razón de la desactivación
 */
export const deactivateUserAccount = async (
  userId: string,
  reason?: string
): Promise<boolean> => {
  const userRepository = new UserProfileRepository();
  const existingProfile = await userRepository.findByUserId(userId);
  if (!existingProfile) throw new Error('Usuario no encontrado');
  if (existingProfile.accountStatus === 'deactivated') throw new Error('La cuenta ya está desactivada');

  const updatedProfile = await userRepository.updateAccountStatus(userId, 'deactivated');
  if (!updatedProfile) throw new Error('Error al desactivar la cuenta');

  await publishEvent('user.account.deactivated', {
    userId,
    reason,
    timestamp: new Date().toISOString()
  });
  console.log(`Cuenta del usuario ${userId} desactivada exitosamente`);
  return true;
};

/**
 * Reactiva la cuenta de un usuario
 * @param userId ID del usuario
 */
export const reactivateUserAccount = async (userId: string): Promise<boolean> => {
  try {
    const userRepository = new UserProfileRepository();
    const existingProfile = await userRepository.findByUserId(userId);
    if (!existingProfile) throw new Error('Usuario no encontrado');
    if (existingProfile.accountStatus !== 'deactivated') throw new Error('La cuenta ya está activa');

    const updatedProfile = await userRepository.updateAccountStatus(userId, 'active');
    if (!updatedProfile) throw new Error('Error al reactivar la cuenta');

    await publishEvent('user.account.reactivated', {
      userId,
      previousStatus: 'deactivated',
      newStatus: 'active',
      timestamp: new Date().toISOString()
    });
    console.log(`Cuenta del usuario ${userId} reactivada exitosamente`);
    return true;
  } catch (error) {
    console.error(`Error al reactivar cuenta del usuario ${userId}:`, error);
    throw new Error(`No se pudo reactivar la cuenta: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};
