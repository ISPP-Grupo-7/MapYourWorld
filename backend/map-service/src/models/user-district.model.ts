import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../../auth-service/src/models/user.model';
import { District } from './district.model';

export enum Color {
    AZUL = '#0000FF',
    VERDE = '#00FF00',
    AMARILLO = '#FFFF00',
    NARANJA = '#FFA500',
    FUCSIA = '#FF00FF',
    MORADO = '#800080'
  }

@Entity('user-district')
export class UserDistrict {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'enum', enum: Color, default: Color.VERDE })
    color!: Color;

    @ManyToOne(() => User, (user) => user.userDistrict)
    @JoinColumn({ name: 'UsuarioColoreador' })
    user!: User;

    @ManyToOne(() => District, (district) => district.userDistrict)
    @JoinColumn({ name: 'DistritoColoreado' })
    district!: District;
}


