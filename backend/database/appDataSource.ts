import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { District } from '../map-service/src/models/district.model'; // Importa tus entidades
import { UserProfile } from '../user-service/src/models/userProfile.model';
import { Map } from '../map-service/src/models/map.model';
import { Region } from '../map-service/src/models/region.model';
import { User } from '../auth-service/src/models/user.model';
import { PointOfInterest } from '../map-service/src/models/poi.model';
import { Friend } from '../social-service/src/models/friend.model';
import { Photo } from '../social-service/src/models/photo.model';
import {Payment} from '../payment-service/src/models/payment.model'
import { Subscription } from '../payment-service/models/subscription.model';
import { Achievement } from '../achievement-service/models/achievement.model';
import { UserAchievement } from '../achievement-service/models/userAchievement.model';
import { UserDistrict } from '../map-service/src/models/user-district.model';

export const AppDataSource = new DataSource({
    type: 'postgres', // O el tipo de base de datos que uses (mysql, sqlite, etc.)
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'mapyourworld13',
    database: 'mapyourworldDB',
    synchronize: true, // Solo para desarrollo, en producción usa migraciones
    dropSchema: false, // Asegúrate de que esto esté en false para no perder datos
    logging: true,
    entities: [District, UserProfile, User, Friend, Region, PointOfInterest, Map, Payment, Subscription,Achievement,UserAchievement, UserDistrict, Photo], // Aquí van todas tus entidades
    migrations: [],
    subscribers: [],
    extra: {
        connectionTimeoutMillis: 30000, // 30s de espera para conectar
        query_timeout: 60000, // 60s de espera para consultas
    }
});

export async function initializeDatabase() {
    try {
        console.log("🔄 Conectando a la base de datos...");
        await AppDataSource.initialize();
        console.log("✅ Base de datos conectada y tablas sincronizadas.");
    } catch (error) {
        console.error("❌ Error al inicializar la base de datos:", error);
        process.exit(1);
    }
}