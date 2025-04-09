/**
 * Servicio de mapas
 * Gestiona la creación, consulta y desbloqueo de mapas del mapa
 */

//import { publishEvent } from '@shared/libs/rabbitmq';
import {UserAchievement} from '../models/userAchievement.model';
import {UserAchievementRepository} from '../repositories/userAchievement.repository';
import { User } from '../../auth-service/src/models/user.model';
import AuthRepository  from '../../auth-service/src/repositories/auth.repository';
import { AchievementRepository } from '../repositories/achievement.repository';
import { Achievement } from '../models/achievement.model';

const repo = new UserAchievementRepository();
const repoAuth = new AuthRepository();
const repoAchievement = new AchievementRepository();



//desbloquear logro para usuario
export const createUserAchievement = async (
  user: User, achievement: Achievement
): Promise<UserAchievement> => {
  try {
    const newUserAchievement = new UserAchievement();
    newUserAchievement.user = user;
    newUserAchievement.achievement = achievement;
    newUserAchievement.dateEarned = new Date();

    console.log("usario-logro creado correctamente:", newUserAchievement);
    
    repo.create(newUserAchievement)

    return newUserAchievement;

  } catch (error) {
    throw new Error("Error al crear el usuario-logro");
  }
};


//obtener todos los logros de un usuario

export const getAchievementsByUser = async (userId: string): Promise<Achievement[]> => {
  try {
    const userAchievements = await repo.getAchievementsByUserId(userId)
    return userAchievements;

  }
    catch (error) {
    throw new Error("Error al obtener los logros del usuario");
  }
}

//obtener todos usuarios que consiguieron un logro
export const getUsersByAchievement = async (achievementId: string): Promise<User[] | null> => {
  try {
    const userAchievements = await repo.getUsersByAchievementId(achievementId) 
    return userAchievements;
  } catch (error) {
    throw new Error("Error al obtener los logros del usuario");
  }
};