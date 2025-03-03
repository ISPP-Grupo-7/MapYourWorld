import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_locations')
export class UserLocation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'user_id' })
    userId!: string;

    @Column({ type: 'geometry', srid: 4326 })
    location: any; // TypeORM no tiene un tipo específico para geometrías PostGIS

    @Column({ type: 'timestamp' })
    timestamp!: Date;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
}