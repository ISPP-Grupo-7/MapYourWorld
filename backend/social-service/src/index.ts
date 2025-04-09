/**
 * Servicio Social de MapYourWorld
 * Gestiona comentarios, likes, fotos y seguimiento entre usuarios
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import photoRouter from './routes/photo.routes';
import friendRouter from './routes/friend.routes';
import { initializeDatabase } from '../../database/appDataSource';

// Cargar variables de entorno
dotenv.config();

// Inicializar la app Express
const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' })); // Aumentar límite para subida de imágenes
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/photos', photoRouter);
app.use('/api/friends', friendRouter); // Añadir el router de amigos

// Ruta de salud para verificar que el servicio está funcionando
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    service: 'social-service',
    status: 'operational',
    version: '1.0.0'
  });
});

// Iniciar el servidor
const startServer = async () => {
  try {
    // Conectar a la base de datos
    await initializeDatabase();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✅ Servicio social ejecutándose en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servicio social:', error);
    process.exit(1);
  }
};

// Solo iniciar el servidor si este archivo se ejecuta directamente
if (require.main === module) {
  startServer();
}

// Exportar la app para las pruebas
export default app;