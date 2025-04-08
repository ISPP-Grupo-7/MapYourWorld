import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Geometry } from 'geojson';
import { Map } from './map.model';
import { User } from '../../../auth-service/src/models/user.model';
import { UserDistrict } from "./user-district.model";
import { Region } from './region.model';

@Entity('districts')
export class District {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string;

    @Column({ type: 'geometry', spatialFeatureType: 'MultiPolygon', srid: 4326, nullable: false })
    boundaries!: Geometry;

    @Column({ type: 'boolean', default: false })
    isUnlocked!: boolean;

    @ManyToOne(() => Region, (region) => region.id, { onDelete:"CASCADE"})
    region_assignee!: Region;

    @OneToMany(() => UserDistrict, (userDistrict) => userDistrict.district, { onDelete:"CASCADE"})
    userDistrict!: UserDistrict[];
}


