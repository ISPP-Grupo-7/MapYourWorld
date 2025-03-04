import { Repository } from 'typeorm';
import { AppDataSource } from '@backend/database/appDataSource';
import { UserLocation } from '@backend/map-service/src/models/user-location.model';

export class LocationRepository {
    private locationRepo: Repository<UserLocation>;

    constructor() {
        this.locationRepo = AppDataSource.getRepository(UserLocation);
    }

    async saveUserLocation(userId: string, latitude: number, longitude: number, timestamp: Date): Promise<UserLocation> {
        const location = this.locationRepo.create({
            userId,
            location: () => `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
            timestamp
        });
        return await this.locationRepo.save(location);
    }

    async getUserLocations(userId: string, limit: number = 50): Promise<UserLocation[]> {
        return await this.locationRepo.find({
            where: { userId },
            order: { timestamp: 'DESC' },
            take: limit
        });
    }
}