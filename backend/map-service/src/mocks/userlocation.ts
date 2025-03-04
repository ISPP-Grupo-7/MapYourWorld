import { saveUserLocation } from "@backend/map-service/src/controllers/location.controller";
import { AppDataSource } from '@backend/database/appDataSource';
import httpMocks from "node-mocks-http";
import { AuthenticatedRequest } from "@backend/auth-service/src/types";


const req : AuthenticatedRequest = httpMocks.createRequest({
    method: "POST",
    url: "/test-location",
    body: { latitude: 1.0, longitude: 1.0, timestamp: null },
});
const res = httpMocks.createResponse();

async function initializeDDBB() {
    try {
        AppDataSource.initialize();
        console.log('Conexión exitosa a la base de datos')
    } catch (e) {
        console.log('Conexión errónea a la base de datos:', e);
    }
}

async function createTestData() {
    try {
        await initializeDDBB();
        const result = await saveUserLocation(req, res)
        //console.log(result.json.message);
    } catch (error) {
        console.error('Error al insertar datos:');
    }
}

createTestData();