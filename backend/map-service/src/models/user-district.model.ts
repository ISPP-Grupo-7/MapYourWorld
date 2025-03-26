import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, RelationId, JoinColumn } from 'typeorm';
import { Geometry } from 'geojson';
import { Map } from './map.model';
import { User } from '../../../auth-service/src/models/user.model';
import { District } from './district.model';

@Entity('user-district')
export class UserDistrict {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    color!: string;

    @ManyToOne(() => User, (user) => user.userDistrict)
    @JoinColumn({ name: 'UsuarioColoreador' })
    user!: User;

    @ManyToOne(() => District, (district) => district.userDistrict)
    @JoinColumn({ name: 'DistritoColoreado' })
    district!: District;
}

