import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne
} from 'typeorm';

// TODO: Importar la entidad PointOfInterest cuando esté implementada
import { PointOfInterest } from '../../../map-service/src/models/poi.model'

@Entity('photos')
export class Photo {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // TODO: Hacer cuando esté implementada
    // Relación con la entidad PointOfInterest
    @ManyToOne(() => PointOfInterest, (poi) => poi.images)
    poi!: PointOfInterest;

    @Column({ type: 'text' })
    image!: string; // Datos o URL de la imagen

    @CreateDateColumn()
    uploadDate!: Date; // Fecha de subida

    @Column({ type: 'varchar', length: 255, nullable: true })
    caption!: string; // Pie de foto o leyenda

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
