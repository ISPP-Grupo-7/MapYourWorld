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

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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


  export default db