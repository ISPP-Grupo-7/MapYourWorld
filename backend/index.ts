/**
 * Punto de entrada principal para el desarrollo del backend
 * Este archivo facilita la ejecución de todo el backend desde un único punto durante el desarrollo
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import districtRoutes from './map-service/src/routes/district.routes';


// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express principal
const app = express();

// Middlewares básicos
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Puerto para el servidor de desarrollo
const PORT = process.env.PORT || 3000;


// Definir las rutas


app.use('/api/districts', districtRoutes)


// Interfaz para los servicios
interface Service {
  name: string;
  url: string;
}

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Servidor de desarrollo de MapYourWorld',
    services: [
      { name: 'Auth Service', url: 'https://localhost:3001' },
      { name: 'User Service', url: 'https://localhost:3002' },
      { name: 'Map Service', url: 'https://localhost:3003' },
      { name: 'Notification Service', url: 'https://localhost:3004' },
      { name: 'Social Service', url: 'https://localhost:3005' }
    ] as Service[],
    status: 'online'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
    🚀 Servidor de desarrollo MapYourWorld iniciado en el puerto ${PORT}
    
    Este es un servidor de desarrollo para ejecutar todos los microservicios
    desde un único punto. En producción, cada servicio se ejecutará por separado.
    
    Para iniciar los servicios individualmente, utiliza los siguientes comandos:
    
    - Auth Service:        cd auth-service && npm start
    - User Service:        cd user-service && npm start
    - Map Service:         cd map-service && npm start
    - Notification Service: cd notification-service && npm start
    - Social Service:      cd social-service && npm start
    
    Para ejecutar todo el sistema con Docker: npm run docker:up (desde la raíz del proyecto)
  `);
}); 