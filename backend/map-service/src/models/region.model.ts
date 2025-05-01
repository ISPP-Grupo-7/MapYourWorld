import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { Map } from './map.model';

@Entity('regions')
export class Region {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: false })
    description!: string;

    @ManyToOne(() => Map, (map) => map.id ,{nullable: false, onDelete: 'CASCADE'}) 
    map_assignee!: Map; 
}