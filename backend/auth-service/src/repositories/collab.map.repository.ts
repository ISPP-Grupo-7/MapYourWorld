import { Repository } from "typeorm";
import { User } from "../models/user.model";
import { AppDataSource } from "../../../database/appDataSource";
import { Map } from "../../../map-service/src/models/map.model";

export default class CollabMapRepository {

    private repo: Repository<User>;
    private mapRepo: Repository<Map>;

    constructor() {
        this.repo = AppDataSource.getRepository(User);
        this.mapRepo = AppDataSource.getRepository(Map);
    }

    async joinMap(mapId: string, userId: string): Promise<void> {
        const newCollabMap = await this.mapRepo.findOne({
            where: { id: mapId },
            relations: ["users_joined"], // Asegura que traemos los usuarios ya asociados
        });
    
        const user = await this.repo.findOne({
            where: { id: userId },
            relations: ["maps_joined"], // Asegura que traemos los mapas ya asociados
        });
    
        if (newCollabMap && user) {
            // Verificamos que el usuario no esté ya en la lista
            if (!newCollabMap.users_joined.some(u => u.id === user.id)) {
                newCollabMap.users_joined.push(user);
            }
    
            if (!user.maps_joined.some(m => m.id === newCollabMap.id)) {
                user.maps_joined.push(newCollabMap);
            }
    
            await this.mapRepo.save(newCollabMap);
            await this.repo.save(user);
        }
    }
    
}