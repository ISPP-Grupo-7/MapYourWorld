/**
 * Servicio de Autenticación de MapYourWorld
 * Gestiona registro, login y verificación de tokens
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes';
import { initializeDatabase } from '../../database/appDataSource';


// Cargar variables de entorno
dotenv.config();

// Inicializar la app Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRouter);
//app.use('/api/email', emailRouter);

// Ruta de salud para verificar que el servicio está funcionando
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'auth-service',
    status: 'operational',
    version: '1.0.0'
  });
});

// Iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await initializeDatabase();
    
    // Conectar a RabbitMQ
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servicio de autenticación ejecutándose en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servicio de autenticación:', error);
    process.exit(1);
  }
};

// Solo iniciar el servidor si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

// Exportar la app para las pruebas
export default app;