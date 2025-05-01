import { Repository } from 'typeorm';
import { Achievement } from '../models/achievement.model'; // Importa tu entidad
import { AppDataSource } from '../../database/appDataSource'; // Importa la instancia de conexión

export  class AchievementRepository {
    public achievementRepo: Repository<Achievement>;


    constructor() {
        this.achievementRepo = AppDataSource.getRepository(Achievement);
    }

      async findByName(name: string): Promise<Achievement | null> {
        return this.achievementRepo.findOneBy({ name  });
      }
      async findAll(): Promise<Achievement[] | null> {
        return this.achievementRepo.find()
      }

    
      async createAchievement(achievementData: Omit<Achievement, 'id'>): Promise<Achievement> {
        const newAchievement = await this.achievementRepo.save(achievementData);
        return newAchievement;
      }      

    async findById(id: string): Promise<Achievement | null> {
      return this.achievementRepo.findOne({ where: { id } });
    }
  
    //no se implementna métodos adicionales ya que con los básicos de typeorm es suficiente
    //se deja esta clase como punto de extensión
}
