import { Repository } from 'typeorm';
import { AppDataSource } from '../../../database/appDataSource';
import { UserDistrict } from '../models/user-district.model';
import { District } from '../models/district.model';

export class UserDistrictRepository {
    private repo: Repository<UserDistrict>;

    constructor() {
        this.repo = AppDataSource.getRepository(UserDistrict);
    }

    async createUserDistrict(userDistrictData: Omit<UserDistrict, 'id'>): Promise<UserDistrict> {
        try {
            const userDistrict = this.repo.create(userDistrictData);
            return await this.repo.save(userDistrict);
        } catch (error) {
            console.error("Error al crear UserDistrict:", error);
            throw new Error("No se pudo crear la asignación de usuario-distrito");
        }
    }

    async getUnlockedDistrictsByUser(userId: string): Promise<UserDistrict[]> {
        try {
            // Obtener todos los distritos desbloqueados por el usuario con sus colores
            return await this.repo.createQueryBuilder("userDistrict")
                .leftJoinAndSelect("userDistrict.district", "district")
                .leftJoinAndSelect("userDistrict.user", "user")
                .where("user.id = :userId", { userId })
                .andWhere("district.isUnlocked = :isUnlocked", { isUnlocked: true })
                .getMany();
        } catch (error) {
            console.error("Error al obtener distritos desbloqueados:", error);
            throw new Error("No se pudieron obtener los distritos desbloqueados");
        }
    }

    async assignColorToUserDistrict(userId: string, districtId: string, color: string): Promise<UserDistrict> {
        try {
            // Buscar si ya existe una asignación
            let userDistrict = await this.repo.createQueryBuilder("userDistrict")
                .leftJoinAndSelect("userDistrict.district", "district")
                .leftJoinAndSelect("userDistrict.user", "user")
                .where("user.id = :userId", { userId })
                .andWhere("district.id = :districtId", { districtId })
                .getOne();
            
            // Si no existe, crear una nueva asignación
            if (!userDistrict) {
                throw new Error("No existe asignación de usuario-distrito");
            }
            
            // Actualizar el color
            userDistrict.color = color;
            return await this.repo.save(userDistrict);
        } catch (error) {
            console.error("Error al asignar color:", error);
            throw new Error("No se pudo asignar el color al distrito");
        }
    }
}