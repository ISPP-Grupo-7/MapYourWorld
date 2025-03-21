import { Repository } from 'typeorm';
import { Photo } from '../models/photo.model'; // Importa tu entidad
import { AppDataSource } from '../../../database/appDataSource'; // Importa la instancia de conexión
import { PointOfInterest } from '../../../map-service/src/models/poi.model'

export class PhotoRepository {
    private photoRepo: Repository<Photo>;
    private poiRepo: Repository<PointOfInterest>;
    constructor() {
        this.photoRepo = AppDataSource.getRepository(Photo);
        this.poiRepo = AppDataSource.getRepository(PointOfInterest)
    }

    async getAll(): Promise<Photo[]> {
        return await this.photoRepo.find();
    }

    async getById(id: string): Promise<Photo> {
        const photo = await this.photoRepo.findOneBy({ id });
        if (!photo) {
            throw new Error(`Photo with id ${id} not found`);
        }
        return photo;
    }

    async createPhoto(photoData: Omit<Photo, 'id'>,poiId:string): Promise<Photo> {
        const newPhoto = this.photoRepo.create(photoData);
        const poi =await this.poiRepo.findOne({where:{id:poiId}})
        if (!poi) {
            throw new Error(`Poi con id ${poiId} no ha sido encontrado`);
        }
        newPhoto.poi=poi;
        newPhoto.uploadDate= new Date();
        return await this.photoRepo.save(newPhoto);
    }

    async updatePhoto(id: string, updateData: Partial<Photo>): Promise<Photo> {
        const photo = await this.getById(id);
        Object.assign(photo, updateData);
        photo.updatedAt=new Date();
        return await this.photoRepo.save(photo);
    }

    async deletePhoto(id: string): Promise<boolean> {
        const result = await this.photoRepo.delete(id);
        return result.affected !== 0;
    }

    async getByPoiId(poiId: string): Promise<Photo[]> {
        return await this.photoRepo.find({ where: { poi: { id: poiId } } });
    }
}
