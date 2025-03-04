import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

const db = pgPromise()({
  host: process.env.DB_HOST || 'localhost' ,     // Usar las variables de entorno
  port: Number(process.env.DB_PORT) || 5432,     // Usar las variables de entorno
  user: process.env.DB_USER || 'postgres',     // Usar las variables de entorno
  password: process.env.DB_PASSWORD || 'mapyourworld13', // Usar las variables de entorno
  database: process.env.DB_NAME || 'mapyourworldDB', // Usar las variables de entorno
  ssl: false,                    // Desactivar SSL si no es necesario
});


db.none(`
    DROP TABLE IF EXISTS users;
    
    CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    DROP TABLE IF EXISTS district;

    CREATE TABLE IF NOT EXISTS district (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      boundaries GEOMETRY(Polygon, 4326),  -- Usando tipo GEOMETRY para almacenar polígonos
      center GEOMETRY(Point, 4326),  -- Usando tipo GEOMETRY para almacenar el punto central
      isBlocked BOOLEAN DEFAULT FALSE  -- Booleano para marcar si está bloqueado
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      location GEOMETRY(Point, 4326) NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Índice espacial para consultas geográficas rápidas
    CREATE INDEX IF NOT EXISTS idx_user_locations_gist ON user_locations USING GIST(location);
    CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    bio TEXT,
    avatar VARCHAR(255),
    phone VARCHAR(50),
    location JSONB,
    social JSONB,
    preferences JSONB DEFAULT '{"language": "es", "theme": "light", "notificationsEnabled": true, "privacySettings": {"showLocation": true, "showActivity": true, "profileVisibility": "public"}}'::jsonb,
    statistics JSONB DEFAULT '{"totalPoints": 0, "level": 1, "districtsUnlocked": 0, "poisVisited": 0, "photosUploaded": 0, "achievements": 0, "followers": 0, "following": 0}'::jsonb,
    accountStatus VARCHAR(50) DEFAULT 'active' CHECK (accountStatus IN ('active','suspended','deactivated')),
    lastActive TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  `)
  .then(() => {
    console.log('Tablas creadas satisfactoriamente');
  })
  .catch((error) => {
    console.error('Error al crear la tabla:', error);
  });

// En backend/map-service/src/index.ts (o donde inicies tu servicio)
// Verificar configuración de PostGIS
db.any(`SELECT PostGIS_version();`)
  .then(() => {
    console.log('✅ PostGIS está instalado y funcionando');
    
    // Verificar tabla de ubicaciones
    return db.any(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_locations'
      );`
    );
  })
  .then(result => {
    if (result[0].exists) {
      console.log('✅ Tabla user_locations existe');
    } else {
      console.error('❌ Tabla user_locations NO existe');
    }
  })
  .catch(error => {
    console.error('❌ Error verificando PostGIS:', error);
  });

export default db