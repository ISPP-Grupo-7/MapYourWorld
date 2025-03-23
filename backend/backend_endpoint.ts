import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import districtRoutes from './map-service/src/routes/district.routes';
import mapRoutes from './map-service/src/routes/map.routes';
import authRoutes from './auth-service/src/routes/auth.routes';
import profileRoutes from './user-service/src/routes/profile.routes';
import pointOfInterest from './map-service/src/routes/poi.routes';
import regionRoutes from './map-service/src/routes/region.routes';
import friendRoutes from './social-service/src/routes/friend.routes';
import collabMapRoutes from './auth-service/src/routes/collab.map.routes';
import paymentRoutes from './payment-service/src/routes/payment.routes';
import { initializeDatabase } from './database/appDataSource';
import { createAllDistricts, createUsers } from './map-service/src/mocks/district_create';
import subscriptionRoutes from './payment-service/routes/subscription.routes';
import { createAchievements } from './achievement-service/mocks/achievement_create';
import userAchievementRoutes from './achievement-service/routes/userAchievement.routes';
import achievementRoutes from './achievement-service/routes/achievement.routes';
import https from 'https';
import fs from 'fs';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*', // Permite orígenes seguros
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Definir las rutas

app.use('/api/districts', districtRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/poi', pointOfInterest);
app.use('/api/friends', friendRoutes);
app.use('/api/maps', mapRoutes)
app.use('/api/collabMap', collabMapRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/user-achievements', userAchievementRoutes);
app.use('/api/achievements', achievementRoutes);


// Interfaz para los servicios
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
    //await createAllDistricts();

    await createUsers();

    // Poblar la base de datos con logros
    await createAchievements();

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