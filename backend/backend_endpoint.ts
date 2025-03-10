import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import districtRoutes from './map-service/src/routes/district.routes';
import authRoutes from './auth-service/src/routes/auth.routes';
import profileRoutes from './user-service/src/routes/profile.routes';
import friendRoutes from './social-service/src/routes/friend.routes';
import { initializeDatabase } from './database/appDataSource';
import { createAllDistricts } from './map-service/src/mocks/district_create';

dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.use('/api/districts', districtRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/friends', friendRoutes);

interface Service {
  name: string;
  url: string;
}

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Servidor de desarrollo de MapYourWorld',
    services: [
      { name: 'Auth Service', url: 'http://localhost:3001' },
      { name: 'User Service', url: 'http://localhost:3002' },
      { name: 'Map Service', url: 'http://localhost:3003' },
      { name: 'Notification Service', url: 'http://localhost:3004' },
      { name: 'Social Service', url: 'http://localhost:3005' }
    ] as Service[],
    status: 'online'
  });
});

const startServer = async () => {
  try {
    // Inicializar la base de datos
    await initializeDatabase();

    // Poblar la base de datos con distritos
    await createAllDistricts();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor de desarrollo MapYourWorld iniciado en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();