import { Repository } from 'typeorm';
import { AppDataSource } from '../../../database/appDataSource';
import { PointOfInterest } from '../models/poi.model';
import { User } from '../../../auth-service/src/models/user.model';
import { District } from '../models/district.model';
import DistrictRepository from '../repositories/district.repository';


export class PointOfInterestRepository {
    private poiRepo: Repository<PointOfInterest>;
    private userRepo: Repository<User>
    private districtRepo: Repository<District>

    constructor() {
        this.poiRepo = AppDataSource.getRepository(PointOfInterest);
        this.userRepo = AppDataSource.getRepository(User)
        this.districtRepo = AppDataSource.getRepository(District)
    }

    async getPOIsByUserIdAndDistrict(userId: string, districtId: string): Promise<PointOfInterest[]> {
        if (!userId || !districtId) {
            throw new Error('El userId y el districtId son obligatorios');
        }

        const pois = await this.poiRepo.find({
            where: {
                user: { id: userId },
                district: { id: districtId }
            },
        });

        return pois;
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




     async createPoiInAllMaps(poiData: Omit<PointOfInterest, 'id'>): Promise<void> {
        const newDistrictRepo = new DistrictRepository();
        const coordenadasPOI = poiData.location
        
        if (!coordenadasPOI || 
            !coordenadasPOI.type || 
            coordenadasPOI.type !== 'Point' || 
            !coordenadasPOI.coordinates || 
            coordenadasPOI.coordinates.length !== 2) {
          throw new Error('Las coordenadas de ubicación son inválidas');
        }

        const [longitude, latitude] = coordenadasPOI.coordinates;
        const distritosConCoordenadas = await newDistrictRepo.getDistrictsContainingCoordinates(longitude, latitude);


        for (const district of distritosConCoordenadas) {
            const newPoi = this.poiRepo.create(poiData);
            newPoi.district = district;
            newPoi.isBusiness = true; 
            newPoi.createdAt = new Date();
            await this.poiRepo.save(newPoi);
        }

    }


    async getUniquePointsOfInterestBusiness(): Promise<PointOfInterest[]> {
        // Recupera todos los POIs de negocio
        const pois = await this.poiRepo.find({
            select: ["name", "description", "location", "category", "images", "isBusiness", "createdAt"],
            where: { isBusiness: true }
        });
        
        // Filtra los POIs únicos basándote en las coordenadas (asumiendo que location.coordinates es [longitude, latitude])
        const uniqueMap = new Map<string, PointOfInterest>();
        
        for (const poi of pois) {
            if (poi.location && poi.location.type && poi.location.type === "Point" && Array.isArray(poi.location.coordinates) && poi.location.coordinates.length >= 2) {
                // Se crea una clave que considere solo las dos primeras coordenadas
                const key = poi.location.coordinates.slice(0,2).join(',');
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, poi);
                }
            }
        }
        
        return Array.from(uniqueMap.values());
    }


    async createPOIsOnLagMaps(poisData:PointOfInterest[], mapId:string ): Promise<void> {
        const newDistrictRepo = new DistrictRepository();

        for (const poiData of poisData) { //Recorremos los pois unicos

            const coordenadasPOI = poiData.location
            
            if (!coordenadasPOI || 
                !coordenadasPOI.type || 
                coordenadasPOI.type !== 'Point' || 
                !coordenadasPOI.coordinates || 
                coordenadasPOI.coordinates.length !== 2) {
            throw new Error('Las coordenadas de ubicación son inválidas');
            }

            const [longitude, latitude] = coordenadasPOI.coordinates;
            
            const distritoAIntroducir =  await newDistrictRepo.getDistrictInMapByCoordinates(mapId, longitude, latitude);
            if(!distritoAIntroducir){
                throw new Error(`No hay distrito en el mapa con id ${mapId} que contenga las coordenadas [${longitude}, ${latitude}]`);
            }

            const newPoi = this.poiRepo.create(poiData);
            newPoi.district = distritoAIntroducir;
            newPoi.isBusiness = true; 
            newPoi.createdAt = new Date();
            await this.poiRepo.save(newPoi);
            }
        }
        
    }



