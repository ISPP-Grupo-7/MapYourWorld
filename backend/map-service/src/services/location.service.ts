import db from '@backend/database/db';
import * as districtService from './district.service';

/**
 * Servicio para gestionar las ubicaciones de usuarios
 */
export class LocationService {

    /**
     * Guarda la ubicación de un usuario y determina en qué distrito se encuentra
     */
    async saveUserLocation(
        userId: string,
        latitude: number,
        longitude: number,
        timestamp: Date = new Date()
    ) {
        try {
            console.log(`Guardando ubicación: user=${userId}, lat=${latitude}, lng=${longitude}`);
            
            // Guardar ubicación usando pg-promise directamente
            await db.none(`
                INSERT INTO user_locations (user_id, location, timestamp) 
                VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)
            `, [userId, longitude, latitude, timestamp]);
            
            console.log('Ubicación guardada correctamente');
            
            // Buscar el distrito que contiene esta ubicación TODO
            // const district = await districtService.findDistrictContainingLocation(
            //     latitude,
            //     longitude
            // );

            return {
                success: true
                //,district
            };
        } catch (error) {
            console.error('Error en LocationService.saveUserLocation:', error);
            throw error;
        }
    }

    /**
     * Obtiene el historial de ubicaciones del usuario
     */
    async getUserLocationHistory(userId: string, limit: number = 50) {
        try {
            return await db.any(`
                SELECT 
                    id, 
                    user_id as userId, 
                    ST_X(location::geometry) as longitude,
                    ST_Y(location::geometry) as latitude,
                    timestamp, 
                    created_at as createdAt
                FROM user_locations
                WHERE user_id = $1
                ORDER BY timestamp DESC
                LIMIT $2
            `, [userId, limit]);
        } catch (error) {
            console.error('Error en LocationService.getUserLocationHistory:', error);
            throw error;
        }
    }
}

// Exportar una instancia única del servicio
export const locationService = new LocationService();