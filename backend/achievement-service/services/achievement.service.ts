/**
 * Servicio de mapas
 * Gestiona la creación, consulta y desbloqueo de mapas del mapa
 */

//import { publishEvent } from '@shared/libs/rabbitmq';
import {Achievement} from '../models/achievement.model';
import {AchievementRepository} from '../repositories/achievement.repository';
import { AppDataSource } from '../../database/appDataSource'; // Importa la instancia de conexión


const repo = new AchievementRepository();

/**
 * Crea un nuevo logro
 * @param AchievementData Datos del logro a crear
 */

//crear logro
export const createAchievement = async (
  achievementData: Omit<Achievement, 'id'>
): Promise<Achievement> => {
  try {
    const newAchievement = await repo.createAchievement(achievementData);
    return newAchievement;
  } catch (error) {
    console.error("Error en createAchievement:", error);
    throw new Error("Error al crear el logro");
  }
};


//obtener todos los logros
export const getAchievements = async (): Promise<Achievement[] | null> => {
  try {
    const achievements = await repo.findAll();
    return achievements;
  } catch (error) {
    throw new Error("Error al obtener los logros");
  }
};

//obtener logro por nombre
export const getAchievementByName = async (name: string): Promise<Achievement | null> => {
  try {
    const a = await repo.findByName(name);
    return a;
  } catch (error) {
    throw new Error("Error al obtener logro por nombre");
  }
};

//obtener logro por id
export const getAchievementById = async (id: string): Promise<Achievement | null> => {
  try {
    const a = await repo.findById(id);
    return a;
  } catch (error) {
    throw new Error("Error al obtener logro por id");
  }
};