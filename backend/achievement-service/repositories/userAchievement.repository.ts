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

    //save UserAchievement
    async create(userAchievementData: UserAchievement): Promise<UserAchievement> {
        const userAchievement = this.userAchievementRepo.create(userAchievementData);
        return await this.userAchievementRepo.save(userAchievement);

    }    

    
    async createUserAchievement(userAchievementData: Omit<UserAchievement, 'id'>): Promise<UserAchievement>{
        const newUserAchievement = this.userAchievementRepo.create()
        
        const logro = await this.achievementRepo.findOne({where: {id:userAchievementData.achievement.id}})

        if(!logro){
            throw new Error(`El logro con id ${userAchievementData.achievement.id} no existe ` )
        }

        newUserAchievement.achievement = logro

        return this.userAchievementRepo.save(newUserAchievement)


    }

    async getAchievementsByUserId(userId: string): Promise<Achievement[]> {
        const logrosUsuario = await this.userAchievementRepo.find({
          where: { user: { id: userId } },
          relations: ["achievement"],
        });
        return logrosUsuario.map(logrosUsuario => logrosUsuario.achievement);
      }
      

    async getUsersByAchievementId(achievementId:string): Promise<User[] | null>{

        const usuariosConLogros = await this.userAchievementRepo.find({
            where: { achievement: { id: achievementId } },
            relations: ["user"],
          });

        return usuariosConLogros.map(userAchievement => userAchievement.user)
    }

        

        

}
