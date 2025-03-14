import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Geometry } from 'geojson';
import { Map } from './map.model';
import { User } from '../../../auth-service/src/models/user.model';

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

    @ManyToOne(() => Map, (map) => map.id)
    map!: Map;

    @ManyToOne(() => User, (user) => user.id)
    user!: User;
}


