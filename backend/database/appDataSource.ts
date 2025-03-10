import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { District } from '../map-service/src/models/district.model'; // Importa tus entidades
import { UserProfile } from '../user-service/src/models/userProfile.model';
import { User } from '../auth-service/src/models/user.model';
import { Friend } from '../social-service/src/models/friend.model';

export const AppDataSource = new DataSource({
    type: 'postgres', // O el tipo de base de datos que uses (mysql, sqlite, etc.)
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'mapyourworld13',
    database: 'mapyourworldDB',
    synchronize: true, // Solo para desarrollo, en producción usa migraciones
    dropSchema: true, // Asegúrate de que esto esté en false para no perder datos
    logging: true,
    entities: [District, UserProfile, User, Friend], // Aquí van todas tus entidades
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