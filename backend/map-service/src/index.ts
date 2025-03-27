import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import districtRoutes from './routes/district.routes';
import authRouter from '../../auth-service/src/routes/auth.routes';
import poiRouter from './routes/poi.routes';
import { initializeDatabase } from '../../database/appDataSource';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

// app.use(districtRoutes);  
app.use('/api/districts', districtRoutes);
app.use('/api/auth', authRouter);
app.use('/api/poi', poiRouter);

// Ruta '/PEPE/Prueba' con método GET
app.get('/PEPE/Prueba', (req: Request, res: Response) => {
  res.json({ message: '¡Ruta PEPE/Prueba alcanzada!' });
});

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  }
  catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Solo iniciar el servidor si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

export default app;
