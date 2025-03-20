import { Repository } from 'typeorm';
import { AppDataSource } from '../../../database/appDataSource';
import { PointOfInterest } from '../models/poi.model';
import { User } from '../../../auth-service/src/models/user.model';

export class PointOfInterestRepository {
    private poiRepo: Repository<PointOfInterest>;
    private userRepo: Repository<User>

    constructor() {
        this.poiRepo = AppDataSource.getRepository(PointOfInterest);
        this.userRepo = AppDataSource.getRepository(User)
    }


    async getPoiByNameAndLocation(poiData: Omit<PointOfInterest, 'id'>): Promise<PointOfInterest | null> {
        
        const location = poiData.location;
        if (!location || 
            !location.type || 
            location.type !== 'Point' || 
            !location.coordinates || 
            location.coordinates.length !== 2) {
          throw new Error('Las coordenadas de ubicación son inválidas');
        }

        const [longitude, latitude] = location.coordinates;
          
    
        const poi = await this.poiRepo.findOne({
            where: {
              name: poiData.name,
              location: { 
                type: 'Point',
                coordinates: [longitude, latitude] 
              } as any
            }
          });



        return poi;
}



    async getPoiById(poiId: string): Promise<PointOfInterest | null> {
        

        const poi =await this.poiRepo.findOne({where:{id:poiId}, relations:["user"]})

        if (!poi) {
            throw new Error(`Poi con id ${poiId} no ha sido encontrado`);
        }
        return poi;
    }



    async createPoi(poiData: Omit<PointOfInterest, 'id'>, userId:string): Promise<PointOfInterest> {
        const newPoi = this.poiRepo.create(poiData);

        const usuarioEncontrado =await this.userRepo.findOne({where:{id:userId}})

        if (!usuarioEncontrado) {
            throw new Error(`Usuario con id ${userId} no ha sido encontrado`);
        }


        newPoi.createdAt = new Date();
        newPoi.user = usuarioEncontrado



        return await this.poiRepo.save(newPoi);
    }


    async updatePoi(poiId: string, poiData: Partial<PointOfInterest>): Promise<PointOfInterest> {
        const poi = await this.getPoiById(poiId);

        if(!poi){
            throw new Error(`Poi con id ${poiId} no ha sido encontrado`);

        }
        Object.assign(poi, poiData);
        return await this.poiRepo.save(poi);
    }

    async deletePOI(poiId: string): Promise<void> {
        const poi = await this.getPoiById(poiId);

        if(!poi){
            throw new Error(`Poi con id ${poiId} no ha sido encontrado`);
        }
        this.poiRepo.delete(poi)
    }


    async getAllPois(): Promise<PointOfInterest[] | null > {
        const pois = this.poiRepo.find({relations:["user"]})
    
        return pois;
    
    }

    
// dado un id de mapa, quiero todos los puntos de interes de ese mapa.

    async getPointsOfInterestByMapId(mapId: string): Promise<PointOfInterest[]> {
        
        const pois = await this.poiRepo.createQueryBuilder('poi')
            .innerJoin('poi.district', 'district')
            .innerJoin('district.region_assignee', 'region')
            .innerJoin('region.map_assignee', 'map')
            .where('map.id = :mapId', { mapId })
            .getMany();

        return pois;
    };



}