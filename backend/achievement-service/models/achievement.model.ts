import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { UserAchievement } from './userAchievement.model';

@Entity('achievements')
export class Achievement {
    //identificador único
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    //nombre del logro
    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    name!: string;

    //descripción del logro
    @Column({ type: 'text', nullable: false })
    description!: string;

    //puntos del logro
    @Column({ type: 'int', nullable: false })
    points!: number;

    //url de la imagen del logro
    @Column({ type: 'varchar', length: 255, nullable: false })
    iconUrl!: string;
}
