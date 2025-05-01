import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, Unique } from 'typeorm';
import { User } from '../../auth-service/src/models/user.model';
import { Achievement } from './achievement.model';

@Entity('userAchievements')
@Unique(['user', 'achievement'])
export class UserAchievement {
    
    //identificador único
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'date', nullable: false })
    dateEarned!: Date;

    //Usuario que obtiene el logro
    @ManyToOne(() => User, (user) => user.id)
    user!: User; 

    //Logro que obtiene el usuario
    @ManyToOne(() => Achievement, (achievement) => achievement.id)
    achievement!: Achievement; 
}
