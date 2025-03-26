
import { AppDataSource } from '../../../database/appDataSource';
import { Geometry } from 'geojson';
import * as fs from 'fs';
import { District } from "../models/district.model";
import {Role, User} from "../../../auth-service/src/models/user.model"
import {registerUser} from "../../../auth-service/src/services/auth.service"

const filePath = 'database/map.geojson';
const rawData = fs.readFileSync(filePath, 'utf-8');
const geojsonData = JSON.parse(rawData);


const user_map_Id = 'some-admin-user-id'; // Usa un ID de usuario con permisos de administrador
const districtsData = geojsonData.features.map((feature: any, index: number) => ({
    name: `Distrito ${index + 1}`, // Asigna un nombre genérico si no hay "properties"
    description: 'Descripción genérica del distrito.', // Se puede personalizar
    boundaries: {
        type: feature.geometry.type,
        coordinates: feature.geometry.coordinates
    } as Geometry,
    isUnlocked: false,
    map: null,
    user: null
}));



const user1 = {
    email:"user1@gmail.com" ,
    password:"user12345*",
    username:"user1",
    firstName:"User",
    lastName:"1"
}


const user2 = {
    email:"user2@gmail.com" ,
    password:"user12345*",
    username:"user2",
     firstName:"User",
     lastName:"2"
}





const userAdmin = {
    email:"userAdmin@gmail.com" ,
    password:"admin12345*",
    role: Role.ADMIN,
    username:"admin",
    firstName:"admin",
    lastName:"admin"
}
export async function createAllDistricts() {
    try {
        if (!AppDataSource.isInitialized) {
            console.log("🔄 Inicializando la base de datos...");
            await AppDataSource.initialize();
            console.log("✅ Base de datos inicializada.");
        }

        const existingDistricts = await AppDataSource.getRepository(District).count();
        if (existingDistricts > 0) {
            console.log("⚠️ Los distritos ya están en la base de datos. No se insertarán duplicados.");
            return;
        }

        //for (const districtData of districtsData) {
        // await createDistrict();
        //     console.log(`✅ Distrito creado: ${districtData.name}`, result);
        // }
    } catch (error) {
        console.error("❌ Error al crear usuarios:", error);
    }
}





export async function createUsers() {
    try {
        if (!AppDataSource.isInitialized) {
            console.log("🔄 Inicializando la base de datos...");
            await AppDataSource.initialize();
            console.log("✅ Base de datos inicializada.");
        }

        const existingDistricts = await AppDataSource.getRepository(User).count();
        if (existingDistricts > 0) {
            console.log("⚠️ Los usuarios ya han sido creados. No se insertarán duplicados.");
            return;
        }

        //Creación usuario1
        await registerUser(user1);

        //Creación usuario2
        await registerUser(user2);

        //Creación usuario3
        await registerUser(userAdmin);
    
        
    } catch (error) {
        console.error("❌ Error al crear los distritos:", error);
    }
}
