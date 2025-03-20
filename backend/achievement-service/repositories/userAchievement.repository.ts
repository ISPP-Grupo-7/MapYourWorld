import { Repository } from 'typeorm';
import { AppDataSource } from '../../database/appDataSource'; // Importa la instancia de conexión
import { UserAchievement } from '../models/userAchievement.model';
import { Achievement } from '../models/achievement.model';
import { User } from '../../auth-service/src/models/user.model';

export class UserAchievementRepository {
    public userAchievementRepo: Repository<UserAchievement>;
    public achievementRepo: Repository<Achievement>

    constructor() {
        this.userAchievementRepo = AppDataSource.getRepository(UserAchievement);
        this.achievementRepo = AppDataSource.getRepository(Achievement)
        
    }

    async createUserAchievement(userAchievementData: Omit<UserAchievement, 'id'>, achievementId:string): Promise<UserAchievement>{
        const newUserAchievement = this.userAchievementRepo.create(userAchievementData)
        
        
        const logro = await this.achievementRepo.findOne({where: {id:achievementId}})

        if(!logro){
            throw new Error(`El logro con id ${achievementId} no existe ` )
        }

        newUserAchievement.achievement = logro

        return this.userAchievementRepo.save(newUserAchievement)


    }

    async getAchievementsByUserId(userId: string): Promise<UserAchievement[]> {
        const logrosUsuario = await this.userAchievementRepo.find({
          where: { user: { id: userId } },
          relations: ["achievement"],
        });
        return logrosUsuario;
      }
      

    async getUsersByAchievementId(achievementId:string): Promise<User[] | null>{

        const usuariosConLogros = await this.userAchievementRepo.find({ where: { achievement: { id: achievementId } }})

        return usuariosConLogros.map(userAchievement => userAchievement.user)
    }

        

        

}
