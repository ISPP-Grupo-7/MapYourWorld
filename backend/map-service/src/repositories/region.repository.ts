import { Repository } from 'typeorm';
import { AppDataSource } from '../../../database/appDataSource';
import { Region } from '../models/region.model';
import { Map } from '../models/map.model';

export default class RegionRepository {
    private regionRepo: Repository<Region>;
    private mapRepo: Repository<Map>

    constructor() {
        this.regionRepo = AppDataSource.getRepository(Region);
        this.mapRepo= AppDataSource.getRepository(Map)
    }

    async createRegion(regionData: Omit<Region, 'id'>, mapa_id: string): Promise<Region | null> {
            const region = this.regionRepo.create(regionData);
            if(!region){
                throw new Error(`Region no creada correctamente`);
            }

            return await this.regionRepo.save(region);
    }

    async getRegionById(regionId: string): Promise<Region> {
            const region = await this.regionRepo.findOneBy({ id: regionId });
            if (!region) {
                throw new Error(`Region with id ${regionId} not found`);
            }
            return region;
    }
    async getRegionByName(regionName: string): Promise<Region> {
        const region = await this.regionRepo.findOneBy({ name: regionName });
        if (!region) {
            throw new Error(`Region with name ${regionName} not found`);
        }
        return region;
    }
    async updateRegion(regionId: string, regionData: Partial<Region>): Promise<Region> {
            const region = await this.getRegionById(regionId);
            Object.assign(region, regionData);
            return await this.regionRepo.save(region);
    }
    async getRegions(): Promise<Region[]> {
            return await this.regionRepo.find();
    }
    async deleteRegion(regionId: string): Promise<boolean> {
        const result = await this.regionRepo.delete(regionId);
        // Si 'affected' es null o undefined, lo convertimos a 0
        return (result.affected ?? 0) > 0;
      }
      
    
}