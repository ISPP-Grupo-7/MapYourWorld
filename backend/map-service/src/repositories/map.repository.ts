import { Repository } from 'typeorm';
import { Map } from '../models/map.model'; // Importa tu entidad
import { AppDataSource } from '../../../database/appDataSource'; // Importa la instancia de conexión
import { User } from '../../../auth-service/src/models/user.model';

export default class MapRepository {
    private mapRepo: Repository<Map>;
    private userRepo: Repository<User>;

    constructor() {
        this.mapRepo = AppDataSource.getRepository(Map);
        this.userRepo = AppDataSource.getRepository(User);
    }

    async createMap(mapData: Omit<Map, 'id'>, userId: string): Promise<Map> {
        const map = this.mapRepo.create(mapData);

        if (!map) {
            throw new Error(`Mapa no enviado correctamente`);
        }

        const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['maps_joined'] });
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }

        map.user_created = user;
        return await this.mapRepo.save(map);
    }

    async createMapColaborativo(mapData: Omit<Map, 'id'>, userId: string): Promise<Map> {
        const map = this.mapRepo.create(mapData);
        map.is_colaborative = true;
        if (!map) {
            throw new Error("Mapa no enviado correctamente");
        }


        const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['maps_joined'] });
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        map.user_created = user;
        const lista_usuarios_unidos = []
        lista_usuarios_unidos.push(user);
        map.users_joined = lista_usuarios_unidos;
        await this.mapRepo.save(map);

        
        const lista_mapas_unidos = []
        lista_mapas_unidos.push(map);
        user.maps_joined = lista_mapas_unidos;
        await this.userRepo.save(user);
        
        return map
    }

    async createMapColaborativoWithId(mapData: Omit<Map, 'id'>, userId: string, specificMapId: string): Promise<Map> {
        // Crear un objeto de mapa con los datos proporcionados
        const map = this.mapRepo.create(mapData);
        // Asignar el ID específico
        (map as any).id = specificMapId;
        map.is_colaborative = true;
        
        if (!map) {
            throw new Error("Mapa no enviado correctamente");
        }

        // Buscar el usuario
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['maps_joined'] });
        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }
        
        // Asignar el usuario como creador
        map.user_created = user;
        
        // Añadir el usuario a la lista de usuarios unidos
        const lista_usuarios_unidos = [];
        lista_usuarios_unidos.push(user);
        map.users_joined = lista_usuarios_unidos;
        
        // Guardar el mapa
        await this.mapRepo.save(map);
        
        // Actualizar la relación del usuario con el mapa
        let lista_mapas_unidos = user.maps_joined || [];
        lista_mapas_unidos.push(map);
        user.maps_joined = lista_mapas_unidos;
        await this.userRepo.save(user);
        
        return map;
    }

    async getMapById(mapId: string): Promise<Map> {
        const map = await this.mapRepo.findOne({ where: { id: mapId }, relations: ['users_joined'] });
        if (!map) {
            throw new Error(`District with id ${mapId} not found`);
        }
        return map;
    }

    async getUsersOnMapById(mapId: string): Promise<User[]> {
        const map = await this.mapRepo.findOne({ where: { id: mapId }, relations: ['users_joined'] });
        if (!map) {
            throw new Error(`Mapa con id ${mapId} no encontrado`);
        }

        const users = map.users_joined;
        if (!users) {
            throw new Error(`No hay usuarios en el mapa con id ${mapId}`);
        }
        return users;
    }


    async updateMap(mapId: string, mapData: Partial<Map>): Promise<Map> {
        const map = await this.getMapById(mapId);
        Object.assign(map, mapData);
        return await this.mapRepo.save(map);
    }

    async deleteMap(mapId: string): Promise<void> {
        const map = await this.getMapById(mapId);
        await this.mapRepo.remove(map);
    }

    async getCollaborativeMapsForUser(userId: string): Promise<Map[]> {
        try {
            // Buscar al usuario
            const user = await this.userRepo.findOne({ 
                where: { id: userId }, 
                relations: ['maps_joined'] 
            });
            
            if (!user || !user.maps_joined || user.maps_joined.length === 0) {
                return [];
            }
            
            // Filtramos solo los mapas colaborativos
            const collaborativeMaps = user.maps_joined.filter(map => map.is_colaborative);
            
            // Para cada mapa, cargamos la información completa con los usuarios
            const mapsWithUsers = await Promise.all(
                collaborativeMaps.map(async (map) => {
                    return await this.mapRepo.findOne({ 
                        where: { id: map.id }, 
                        relations: ['users_joined', 'user_created'] 
                    });
                })
            );
            
            // Filtramos los posibles nulos
            return mapsWithUsers.filter((map): map is Map => map !== null);
        } catch (error) {
            console.error(`Error al obtener mapas colaborativos para el usuario ${userId}:`, error);
            throw error;
        }
    }

}
