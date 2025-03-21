import { Repository } from 'typeorm';
import { District } from '../models/district.model'; // Importa tu entidad
import { AppDataSource } from '../../../database/appDataSource'; // Importa la instancia de conexión
import { Map } from '../models/map.model';
import { Region } from '../models/region.model';
import { User } from '../../../auth-service/src/models/user.model';
import { Color, UserDistrict } from '../models/user-district.model';

export default class DistrictRepository {
    private districtRepo: Repository<District>;
    private regionRepo: Repository<Region>;
    private mapRepo: Repository<Map>
    private userRepo: Repository<User>
    private userDistrictRepo: Repository<UserDistrict>


    constructor() {
        this.districtRepo = AppDataSource.getRepository(District);
        this.regionRepo = AppDataSource.getRepository(Region);
        this.mapRepo = AppDataSource.getRepository(Map)
        this.userRepo = AppDataSource.getRepository(User)
        this.userDistrictRepo = AppDataSource.getRepository(UserDistrict)
    }

    async createDistrict(districtData: Omit<District, 'id'>): Promise<void> {
        await this.districtRepo.save(districtData);
    }

    async getDistrictById(districtId: string): Promise<District> {
        const district = await this.districtRepo.findOneBy({ id: districtId });
        if (!district) {
            throw new Error(`District with id ${districtId} not found`);
        }
        return district;
    }

    async getDistricts(): Promise<District[]> {
        return await this.districtRepo.find();
    }

    async updateDistrict(districtId: string, districtData: Partial<District>): Promise<District> {
        const district = await this.getDistrictById(districtId);
        Object.assign(district, districtData);
        return await this.districtRepo.save(district);
    }

    async unlockDistrict(districtId: string, userId:string , regionId:string ): Promise<District> {
        const district = await this.districtRepo.findOne({where:
            {   
                id:districtId,
                region_assignee: {id: regionId}
            }, relations: ['region_assignee', 'region_assignee.map_assignee']
        });

        if(!district){
            throw new Error(`El distrito con id ${districtId}, perteneciente a la region con id ${regionId} no existe`)
        }
        const discoveredBy = await this.userRepo.findOne({where: {id:userId}})
        if (!discoveredBy){
            throw new Error(`El usuario con id ${userId}, no existe`)

        }

        district.isUnlocked = true;

        if(!district.region_assignee){
            throw new Error(`La region con id ${regionId}, no existe`)
        }

        if(!district.region_assignee.map_assignee){
            throw new Error(`El mapa no existe`)
        }


        if(district.region_assignee.map_assignee.is_colaborative === true){
            const userDistrict = new UserDistrict();
            userDistrict.user = discoveredBy;
            userDistrict.district = district;
            userDistrict.color = Color.AZUL; // Poner los colores definidos(Los colores definidos son los posibles valores del enum Color)
            await this.userDistrictRepo.save(userDistrict);
        }
        return await this.districtRepo.save(district);
    }

    async getDistrictsUnlocked(): Promise<District[]> {
        return await this.districtRepo.find({ where: { isUnlocked: true } });
    }

    async findDistrictContainingLocation(latitude: number, longitude: number): Promise<District | null> {
        const result = await this.districtRepo.query(`
            SELECT * 
            FROM district 
            WHERE ST_Within(ST_SetSRID(ST_MakePoint($1, $2), 4326), boundaries)
            LIMIT 1
        `, [longitude, latitude]);

        return result;
    }

    async getDistrictsByMapId(mapId: string): Promise<District[]> {
        console.log(`Buscando distritos para el mapa con ID ${mapId}`);
        
        const districts = await this.districtRepo.find({ where: { region_assignee: 
            {map_assignee:
                {id: mapId} 
            }
        }, 
        relations: ['region_assignee','region_assignee.map_assignee'] });

        console.log(`Se encontraron ${districts.length} distritos para el mapa ${mapId}`);
        return districts;
    }
}
