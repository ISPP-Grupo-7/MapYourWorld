import { createDistricts } from "../services/district.service";
import { AppDataSource } from '../../../database/appDataSource';
import { Geometry } from 'geojson';
import * as fs from 'fs';
import { District } from "../models/district.model";
import {Role, User} from "../../../auth-service/src/models/user.model"
import {registerUser} from "../../../auth-service/src/services/auth.service"
import {createUserProfile} from "../../../user-service/src/services/profile.service"

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

const profile1 = {
    id:"00000000-0000-0000-0000-000000000001",
    username:"user1",
    firstName:"user",
    lastName:"1",
    picture: ""
}

const user1 = {
    email:"user1@gmail.com" ,
    password:"user12345*",
    role: Role.USER,
    token_data: "",
    profile: profile1.id
}

const profile2 = {
    id:"00000000-0000-0000-0000-000000000002",
    username:"user2",
    firstName:"user",
    lastName:"2",
    picture: ""
}

const user2 = {
    email:"user2@gmail.com" ,
    password:"user12345*",
    role: Role.USER,
    token_data: "",
    profile: profile2.id
}



const profileAdmin = {
    id:"00000000-0000-0000-0000-000000000003",
    username:"user",
    firstName:"admin",
    lastName:"3",
    picture: ""
}

const userAdmin = {
    email:"userAdmin@gmail.com" ,
    password:"admin12345*",
    role: Role.ADMIN,
    token_data: "",
    profile: profileAdmin.id
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
        await createUserProfile(profile1)
        await registerUser(user1);

        //Creación usuario2
        await createUserProfile(profile2)
        await registerUser(user2);

        //Creación usuario3
        await createUserProfile(profileAdmin)
        await registerUser(userAdmin);
    
        
    } catch (error) {
        console.error("❌ Error al crear los distritos:", error);
    }
}

