/**
 * Script para arrancar todo el backend de MapYourWorld de forma coordinada
 * 
 * Este script inicia todos los microservicios en el orden correcto, asegurando
 * que las dependencias (como RabbitMQ) estén disponibles antes de iniciar
 * los servicios que las requieren.
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { Socket } from 'net';

// Cargar variables de entorno
dotenv.config();

// Configuración
const BASE_DIR = path.resolve(__dirname);
const LOG_DIR = path.join(BASE_DIR, 'logs');
const SERVICES_ORDER = [
  // Primero API Gateway para que RabbitMQ esté disponible para todos
  'api-gateway',  
  // Luego servicios core  
  'auth-service',
  'user-service',
  // Servicios de funcionalidad principal
  'map-service',  
  'notification-service',
  'social-service'
];

// Servicios que tienen diferentes nombres de script para modo dev y prod
const SERVICE_SCRIPT = {
  dev: 'dev',
  prod: 'start'
};

// Mensajes clave para detectar la inicialización correcta de cada servicio
const SERVICE_READY_MESSAGES: Record<string, string[]> = {
  'api-gateway': [
    'RabbitMQ inicializado correctamente',
    'API Gateway ejecutándose en http'
  ],
  'auth-service': [
    'Auth Service iniciado en puerto',
    'Conexión establecida con la base de datos'
  ],
  'user-service': [
    'User Service iniciado en puerto',
    'Conexión establecida con la base de datos'
  ],
  'map-service': [
    'Map Service iniciado en puerto'
  ],
  'notification-service': [
    'Notification Service iniciado en puerto'
  ],
  'social-service': [
    'Social Service iniciado en puerto'
  ]
};

// Variable para almacenar los procesos de los servicios
const serviceProcesses: Record<string, ChildProcess> = {};

// Estado de los servicios
const serviceReadyState: Record<string, boolean> = {};

// Variable para controlar el cierre ordenado
let shuttingDown = false;

// Crear directorio de logs si no existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Imprime un mensaje formateado en la consola
 */
function log(service: string, message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info'): void {
  const timestamp = new Date().toISOString();
  let coloredMsg = message;
  
  switch (type) {
    case 'error':
      coloredMsg = chalk.red(message);
      break;
    case 'success':
      coloredMsg = chalk.green(message);
      break;
    case 'warning':
      coloredMsg = chalk.yellow(message);
      break;
    default:
      coloredMsg = chalk.blue(message);
  }
  
  console.log(`[${chalk.gray(timestamp)}] [${chalk.yellow(service)}] ${coloredMsg}`);
  
  // También guardar en archivo de log
  const logFile = path.join(LOG_DIR, 'backend.log');
  fs.appendFileSync(logFile, `[${timestamp}] [${service}] [${type.toUpperCase()}] ${message}\n`);
}

/**
 * Verifica si RabbitMQ está disponible
 */
async function checkRabbitMQ(): Promise<boolean> {
  return new Promise((resolve) => {
    const host = process.env.RABBITMQ_HOST || 'localhost';
    const port = parseInt(process.env.RABBITMQ_PORT || '5672', 10);
    log('runBackend', `Verificando disponibilidad de RabbitMQ en ${host}:${port}...`, 'info');
    
    const client = new Socket();
    let isAvailable = false;
    
    // Establecer timeout de conexión
    const timeout = setTimeout(() => {
      client.destroy();
      log('runBackend', 'Timeout al verificar disponibilidad de RabbitMQ', 'error');
      resolve(false);
    }, 5000);
    
    client.connect(port, host, () => {
      clearTimeout(timeout);
      isAvailable = true;
      log('runBackend', 'RabbitMQ está disponible', 'success');
      client.destroy();
    });
    
    client.on('error', () => {
      clearTimeout(timeout);
      log('runBackend', 'RabbitMQ no está disponible - podría ser necesario instalarlo o iniciarlo manualmente', 'error');
      client.destroy();
    });
    
    client.on('close', () => {
      resolve(isAvailable);
    });
  });
}

/**
 * Inicia un servicio específico
 */
function startService(serviceName: string, mode: 'dev' | 'prod'): Promise<void> {
  return new Promise((resolve, reject) => {
    const servicePath = path.join(BASE_DIR, serviceName);
    const scriptMode = SERVICE_SCRIPT[mode];
    
    log(serviceName, `Iniciando en modo ${mode}...`, 'info');
    
    // Verificar que el directorio del servicio existe
    if (!fs.existsSync(servicePath)) {
      const error = `Directorio del servicio ${serviceName} no encontrado en ${servicePath}`;
      log(serviceName, error, 'error');
      return reject(new Error(error));
    }
    
    // En lugar de usar npm run dev/start que podría usar concurrently,
    // vamos a ejecutar directamente ts-node o node dependiendo del modo
    let command: string;
    let args: string[];
    
    if (mode === 'dev') {
      // En modo dev, usamos ts-node directamente
      command = 'npx';
      args = ['ts-node', 'src/index.ts'];
    } else {
      // En modo prod, asumimos que el código está compilado y usamos node
      command = 'node';
      args = ['dist/index.js'];
    }
    
    // Configurar entorno con variables adicionales
    const env = {
      ...process.env,
      SERVICE_NAME: serviceName,
      NODE_ENV: mode === 'prod' ? 'production' : 'development'
    };
    
    // Crear directorio de logs si no existe
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    
    // Crear archivo de log específico para este servicio
    const logFile = path.join(LOG_DIR, `${serviceName}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    
    try {
      // Iniciar el proceso del servicio
      const serviceProcess = spawn(command, args, {
        cwd: servicePath,
        env,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Registrar el proceso
      serviceProcesses[serviceName] = serviceProcess;
      
      // Manejar salida estándar
      serviceProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString().trim();
        if (output) {
          const timestamp = new Date().toISOString();
          const logLine = `[${timestamp}] [${serviceName}] ${output}`;
          console.log(logLine);
          logStream.write(`${logLine}\n`);
          
          // Verificar si el servicio está listo
          if (SERVICE_READY_MESSAGES[serviceName]) {
            for (const readyMessage of SERVICE_READY_MESSAGES[serviceName]) {
              if (output.includes(readyMessage)) {
                log(serviceName, `Mensaje de ready detectado: ${readyMessage}`, 'success');
                break;
              }
            }
          }
        }
      });
      
      // Manejar salida de errores
      serviceProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString().trim();
        if (output) {
          const timestamp = new Date().toISOString();
          const logLine = `[${timestamp}] [${serviceName}] [ERROR] ${output}`;
          console.error(chalk.red(logLine));
          logStream.write(`${logLine}\n`);
        }
      });
      
      // Manejar cierre del proceso
      serviceProcess.on('close', (code: number) => {
        if (code !== 0 && !shuttingDown) {
          const errorMsg = `El servicio ${serviceName} se detuvo con código ${code}`;
          log(serviceName, errorMsg, 'error');
          logStream.end();
          reject(new Error(errorMsg));
        } else {
          if (shuttingDown) {
            log(serviceName, `Servicio detenido correctamente`, 'success');
          }
          logStream.end();
          resolve();
        }
      });
      
      // Manejar errores del proceso
      serviceProcess.on('error', (error: Error) => {
        const errorMsg = `Error al iniciar el servicio ${serviceName}: ${error.message}`;
        log(serviceName, errorMsg, 'error');
        logStream.end();
        reject(new Error(errorMsg));
      });
      
      log(serviceName, `Proceso iniciado con PID ${serviceProcess.pid}`, 'info');
    } catch (error: any) {
      const errorMsg = `Error al iniciar el servicio ${serviceName}: ${error.message}`;
      log(serviceName, errorMsg, 'error');
      logStream.end();
      reject(new Error(errorMsg));
    }
  });
}

/**
 * Inicia todos los servicios en orden
 */
async function startAllServices(mode: 'dev' | 'prod'): Promise<void> {
  log('runBackend', `Iniciando todos los servicios en modo ${mode}...`, 'info');
  
  try {
    // Verificar si RabbitMQ está disponible antes de iniciar
    const rabbitAvailable = await checkRabbitMQ();
    if (!rabbitAvailable) {
      log('runBackend', 'Advertencia: RabbitMQ no está disponible. Los servicios pueden fallar al intentar conectarse.', 'warning');
      
      // Preguntar si continuar
      if (process.env.UNIFIED_START !== 'true') { // No preguntar si se inicia desde script unificado
        process.stdout.write('¿Desea continuar de todos modos? (s/n): ');
        const response = await new Promise<string>((resolve) => {
          process.stdin.once('data', (data) => {
            resolve(data.toString().trim().toLowerCase());
          });
        });
        
        if (response !== 's' && response !== 'si' && response !== 'y' && response !== 'yes') {
          log('runBackend', 'Inicialización cancelada por el usuario', 'info');
          process.exit(0);
        }
      }
    }
    
    // Iniciar cada servicio de manera secuencial
    for (const service of SERVICES_ORDER) {
      await startService(service, mode);
      log('runBackend', `Servicio ${service} iniciado correctamente`, 'success');
      
      // Pequeña pausa entre servicios para evitar sobrecarga
      // Pausa más larga después del API Gateway para asegurar que RabbitMQ esté completamente listo
      const pauseTime = service === 'api-gateway' ? 8000 : 2000;
      log('runBackend', `Esperando ${pauseTime/1000} segundos antes de continuar...`, 'info');
      await new Promise(resolve => setTimeout(resolve, pauseTime));
    }
    
    log('runBackend', 'Todos los servicios iniciados correctamente ✅', 'success');
    log('runBackend', `Sistema completo disponible en: http://localhost:${process.env.PORT || 3030}`, 'success');
    
    // Mostrar información sobre los servicios
    const apiGatewayPort = process.env.API_GATEWAY_PORT || 3030;
    log('runBackend', `
🔹 API Gateway: http://localhost:${apiGatewayPort}
🔹 Documentación API: http://localhost:${apiGatewayPort}/api/docs
🔹 Estado del sistema: http://localhost:${apiGatewayPort}/health
    `, 'info');
    
  } catch (error) {
    log('runBackend', `Error al iniciar los servicios: ${String(error)}`, 'error');
    // Detener todos los servicios que ya se iniciaron
    await stopAllServices();
    process.exit(1);
  }
}

/**
 * Detiene todos los servicios
 */
async function stopAllServices(): Promise<void> {
  log('runBackend', 'Deteniendo todos los servicios...', 'info');
  
  // Indicar que estamos en proceso de cierre
  shuttingDown = true;
  
  // Detener servicios en orden inverso para cerrar de forma ordenada
  for (const service of [...SERVICES_ORDER].reverse()) {
    if (serviceProcesses[service]) {
      log(service, 'Enviando señal para detener...', 'info');
      
      // Enviar señal SIGINT para cierre limpio
      serviceProcesses[service].kill('SIGINT');
      
      // Esperar un poco para que el servicio se detenga correctamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Forzar cierre si aún sigue en ejecución
      if (serviceProcesses[service].exitCode === null) {
        log(service, 'Forzando cierre...', 'error');
        serviceProcesses[service].kill('SIGKILL');
      }
      
      delete serviceProcesses[service];
    }
  }
  
  log('runBackend', 'Todos los servicios detenidos correctamente', 'success');
}

/**
 * Función principal que ejecuta el script
 */
async function main(): Promise<void> {
  // Determinar modo (dev o prod)
  const mode = process.argv.includes('--prod') ? 'prod' : 'dev';
  
  log('runBackend', '🚀 Iniciando backend de MapYourWorld', 'info');
  log('runBackend', `Modo: ${mode}`, 'info');
  
  // Manejar señales para cierre limpio
  process.on('SIGINT', async () => {
    if (!shuttingDown) {
      log('runBackend', 'Recibida señal de interrupción (CTRL+C)', 'info');
      await stopAllServices();
      process.exit(0);
    }
  });
  
  process.on('SIGTERM', async () => {
    if (!shuttingDown) {
      log('runBackend', 'Recibida señal de terminación', 'info');
      await stopAllServices();
      process.exit(0);
    }
  });
  
  try {
    // Iniciar todos los servicios
    await startAllServices(mode);
  } catch (error) {
    log('runBackend', `Error fatal: ${String(error)}`, 'error');
    process.exit(1);
  }
}

// Ejecutar la función principal
main().catch(error => {
  log('runBackend', `Error fatal: ${String(error)}`, 'error');
  process.exit(1);
}); 
