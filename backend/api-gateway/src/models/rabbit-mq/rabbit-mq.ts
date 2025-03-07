/**
 * @fileoverview Implementación de RabbitMQ para el API Gateway
 * 
 * Este módulo proporciona una interfaz unificada para conectarse y utilizar RabbitMQ
 * en la comunicación entre microservicios. Incluye la clase ConectorRabbitMQ y
 * funciones auxiliares para simplificar su uso.
 * 
 * @module RabbitMQ
 */

import * as amqplib from 'amqplib';
import { EventEmitter } from 'events';
import * as dotenv from 'dotenv';
import {
  TipoEvento,
  MensajeEvento,
  EventosConectorRabbitMQ,
  CallbackMensaje
} from './rabbit-mq.types';

// Cargar variables de entorno
dotenv.config();

// Configuración de RabbitMQ desde variables de entorno
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'localhost';
const RABBITMQ_PORT = parseInt(process.env.RABBITMQ_PORT || '5672', 10);
const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest';
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || 'guest';
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || '/';
const RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'mapyourworld';
const RABBITMQ_QUEUE_PREFIX = process.env.RABBITMQ_QUEUE_PREFIX || 'mapyourworld_';
const RABBITMQ_RETRY_ATTEMPTS = parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || '5', 10);
const RABBITMQ_RETRY_DELAY = parseInt(process.env.RABBITMQ_RETRY_DELAY || '5000', 10);
const RABBITMQ_MAX_RECONNECT = parseInt(process.env.RABBITMQ_MAX_RECONNECT || '10', 10);

// Nuevas constantes para Dead Letter Queues
const RABBITMQ_DLX_EXCHANGE = `${RABBITMQ_EXCHANGE}.mensaje-fallido`;
const RABBITMQ_DLQ_PREFIX = `${RABBITMQ_QUEUE_PREFIX}fallidos_`;
const RABBITMQ_MAX_RETRIES = parseInt(process.env.RABBITMQ_MAX_RETRIES || '3', 10);
const RABBITMQ_MESSAGE_TTL = parseInt(process.env.RABBITMQ_MESSAGE_TTL || '30000', 10); // TTL en ms (30 segundos)

// URL de conexión para RabbitMQ
const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`;

// Añadimos la definición de la interfaz InfoMensaje
interface InfoMensaje {
  id: string;
  exchange: string;
  claveEnrutamiento: string;
  cola: string;
  timestamp: number;
  headers: Record<string, any>;
  propiedades: amqplib.MessageProperties;
}

// Constante para intentos máximos (en lugar de RABBITMQ_MAX_RETRIES)
const RABBITMQ_MAX_INTENTOS = 3;

// Actualizar los tipos de contadores para incluir 'procesados' y 'fallidos'
type TipoContador = 'enviados' | 'recibidos' | 'errores' | 'procesados' | 'fallidos';

/**
 * Clase para gestionar la conexión y comunicación con RabbitMQ
 * Implementa el patrón EventEmitter para notificar eventos
 * 
 * @class ConectorRabbitMQ
 * @extends {EventEmitter}
 */
class ConectorRabbitMQ extends EventEmitter {
  /** @private Conexión a RabbitMQ */
  private conexion: amqplib.Connection | null = null;
  
  /** @private Canal de comunicación con RabbitMQ */
  private canal: amqplib.Channel | null = null;
  
  /** @private Registro de suscripciones activas */
  private suscripciones: Map<string, { cola: string, clavesEnrutamiento: string[] }> = new Map();
  
  /** @private Nombre del servicio que utiliza la conexión */
  private nombreServicio: string = 'desconocido';
  
  /** @private Contador de intentos de reconexión */
  private intentosReconexion: number = 0;
  
  /** @private Indicador de reconexión en proceso */
  private reconectando: boolean = false;
  
  /** @private Intervalo para verificar estado de la conexión */
  private intervaloPing: NodeJS.Timeout | null = null;
  
  /** @private Indicador de inicialización */
  private iniciado: boolean = false;

  /** @private Contadores de mensajes recibidos y enviados para métricas */
  private contadorMensajesEnviados: Map<string, number> = new Map();
  private contadorMensajesRecibidos: Map<string, number> = new Map();
  
  /** @private Contador de errores en el procesamiento de mensajes */
  private contadorErrores: Map<string, number> = new Map();

  /** @private Suscripciones pendientes */
  private suscripcionesPendientes: Array<{
    nombreCola: string;
    clavesEnrutamiento: string[];
    callback: CallbackMensaje;
    opciones?: any;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];

  /**
   * Crea una instancia del conector RabbitMQ
   * @param {string} nombreServicio - Nombre del servicio que utilizará la conexión
   */
  constructor(nombreServicio: string) {
    super();
    this.nombreServicio = nombreServicio || 'desconocido';
    
    // Configurar manejo de errores no capturados
    this.on('error', this.manejarErrorNoCapturado.bind(this));
    
    // Configurar listeners para el manejo de salida del proceso
    process.once('SIGINT', this.detenerGracefully.bind(this));
    process.once('SIGTERM', this.detenerGracefully.bind(this));
  }

  /**
   * Inicia la conexión con RabbitMQ
   * 
   * @returns {Promise<void>}
   * @throws {Error} Si ocurre un error durante la inicialización
   */
  public async iniciar(): Promise<void> {
    if (this.iniciado) {
      console.log(`[RabbitMQ:${this.nombreServicio}] Ya se encuentra iniciado`);
      return;
    }

    try {
      await this.conectar();
      
      // Configurar intervalo de ping para verificar estado
      this.configurarPing();
      
      this.iniciado = true;
      console.log(`[RabbitMQ:${this.nombreServicio}] Iniciado correctamente`);
      this.emit('iniciado');
    } catch (error) {
      console.error(`[RabbitMQ:${this.nombreServicio}] Error al iniciar:`, error);
      throw error;
    }
  }

  /**
   * Configura una cola de mensajes fallidos para gestionar 
   * mensajes que no pudieron ser procesados correctamente
   * 
   * @param {string} nombreColaOriginal - Nombre de la cola original
   * @returns {Promise<void>}
   * @throws {Error} Si hay un error al configurar la cola
   * @private
   */
  private async configurarColaMensajesFallidos(nombreColaOriginal: string): Promise<void> {
    if (!this.canal) {
      throw new Error('No hay canal disponible para configurar la cola de mensajes fallidos');
    }
    
    // Crear exchange para mensajes fallidos si no existe
    await this.canal.assertExchange(RABBITMQ_DLX_EXCHANGE, 'topic', {
      durable: true
    });
    
    // Nombre de la cola de mensajes fallidos
    const baseQueueName = nombreColaOriginal.startsWith(RABBITMQ_QUEUE_PREFIX) ? nombreColaOriginal.substring(RABBITMQ_QUEUE_PREFIX.length) : nombreColaOriginal;
    // Nos aseguramos de que para colas de eventos se incluya el prefijo "api-gateway_eventos_"
    const nombreBase = baseQueueName.includes('eventos') ? baseQueueName : `api-gateway_eventos_${baseQueueName}`;
    const nombreColaFallidos = `${RABBITMQ_QUEUE_PREFIX}${nombreBase.replace('_eventos_', '_fallidos_eventos_')}`;
    
    // Crear cola de mensajes fallidos
    await this.canal.assertQueue(nombreColaFallidos, {
      durable: true,
      arguments: { 'x-message-ttl': 7200000 }
    });
    
    // Vincular la cola de mensajes fallidos al exchange
    await this.canal.bindQueue(nombreColaFallidos, RABBITMQ_DLX_EXCHANGE, `${nombreColaOriginal}.fallido`);
    
    console.log(`[RabbitMQ:${this.nombreServicio}] Cola DLQ verificada: ${nombreColaFallidos}`);
  }

  /**
   * Establece la conexión con el servidor RabbitMQ
   * 
   * @returns {Promise<void>}
   * @throws {Error} Si ocurre un error durante la conexión
   * @private
   */
  private async conectar(): Promise<void> {
    if (this.conexion && this.canal) {
      return;
    }

    try {
      console.log(`[RabbitMQ:${this.nombreServicio}] Conectando a ${RABBITMQ_URL}...`);
      
      // Conectar a RabbitMQ
      this.conexion = await amqplib.connect(RABBITMQ_URL) as unknown as amqplib.Connection;
      
      // Configurar manejadores de eventos para la conexión
      this.conexion.on('close', this.manejarCierreConexion.bind(this));
      this.conexion.on('error', this.manejarErrorConexion.bind(this));
      
      // Crear canal
      this.canal = await this.conexion.createChannel();
      
      // Configurar prefetch (control de QoS)
      await this.canal.prefetch(1);
      
      // Declarar el exchange principal
      await this.canal.assertExchange(RABBITMQ_EXCHANGE, 'topic', {
        durable: true,
        autoDelete: false
      });
      
      // Declarar el exchange de mensajes fallidos
      await this.canal.assertExchange(RABBITMQ_DLX_EXCHANGE, 'topic', {
        durable: true,
        autoDelete: false
      });
      
      // Manejar la conexión establecida
      await this.manejarConexionEstablecida();
      
      console.log(`[RabbitMQ:${this.nombreServicio}] Conexión establecida correctamente`);
    } catch (error) {
      console.error(`[RabbitMQ:${this.nombreServicio}] Error al conectar:`, error);
      this.conexion = null;
      this.canal = null;
      
      throw error;
    }
  }

  /**
   * Maneja conexión establecida y restaura suscripciones
   * @private
   */
  private async manejarConexionEstablecida(): Promise<void> {
    console.log(`[RabbitMQ:${this.nombreServicio}] Conexión establecida`);
    this.emit('conectado');
    this.intentosReconexion = 0;
    this.reconectando = false;
    
    // Restaurar suscripciones
    await this.restaurarSuscripciones();
    
    // Configurar monitoreo de conexión
    this.configurarPing();
    
    // Marcar como iniciado
    this.iniciado = true;
  }

  /**
   * Maneja el evento de cierre de conexión
   * 
   * @param {Error} error - Error que causó el cierre (si aplica)
   * @private
   */
  private manejarCierreConexion(error?: Error): void {
    // Si ya estamos reconectando, no hacemos nada
    if (this.reconectando) {
      return;
    }
    
    // Verificar si el error es un 404 relacionado con colas que no existen
    const errorObj = error as any;
    if (errorObj?.code === 404 && errorObj?.message?.includes('no queue')) {
      console.warn(`[RabbitMQ:${this.nombreServicio}] Conexión cerrada por error 404 (cola no existe): ${errorObj.message}`);
      console.log(`[RabbitMQ:${this.nombreServicio}] Este error es esperado y será manejado automáticamente`);
    } else {
      console.warn(`[RabbitMQ:${this.nombreServicio}] Conexión cerrada${error ? `: ${error.message}` : ''}`);
    }
    
    // Limpiar referencias a conexión y canal
    this.conexion = null;
    this.canal = null;
    
    this.emit('desconectado');
    
    // Programar reconexión con un retraso para evitar intentos demasiado frecuentes
    setTimeout(() => {
      this.programarReconexion();
    }, 1000);
  }

  /**
   * Maneja errores en la conexión
   * 
   * @param {Error} error - Error ocurrido
   * @private
   */
  private manejarErrorConexion(error: Error): void {
    console.error(`[RabbitMQ:${this.nombreServicio}] Error en conexión:`, error);
    this.emit('error', error);
    
    // No cerramos la conexión aquí porque el evento 'close' se encargará
  }

  /**
   * Detiene gracefully la conexión cuando se recibe una señal de terminación
   * 
   * @private
   */
  private async detenerGracefully(): Promise<void> {
    console.log(`[RabbitMQ:${this.nombreServicio}] Recibida señal de terminación, cerrando conexión...`);
    await this.detener();
    process.exit(0);
  }

  /**
   * Programa un intento de reconexión con retraso exponencial
   * 
   * @private
   */
  private programarReconexion(): void {
    if (this.reconectando) {
      return;
    }
    
    this.reconectando = true;
    this.intentosReconexion++;
    
    // Retraso exponencial con jitter (variación aleatoria)
    const retrasoBase = Math.min(
      30000, // Máximo 30 segundos
      RABBITMQ_RETRY_DELAY * Math.pow(1.5, this.intentosReconexion - 1)
    );
    
    // Añadir jitter (±20%)
    const jitter = 0.2;
    const retraso = Math.floor(retrasoBase * (1 + jitter * (Math.random() * 2 - 1)));
    
    console.log(`[RabbitMQ:${this.nombreServicio}] Intentando reconexión ${this.intentosReconexion}/${RABBITMQ_MAX_RECONNECT} en ${retraso}ms...`);
    this.emit('reconectando', this.intentosReconexion, retraso);
    
    setTimeout(async () => {
      try {
        await this.conectar();
      } catch (error) {
        // Error en la reconexión
        console.error(`[RabbitMQ:${this.nombreServicio}] Error en reconexión:`, error);
        
        // Si alcanzamos el límite de intentos, notificar y detener
        if (this.intentosReconexion >= RABBITMQ_MAX_RECONNECT) {
          console.error(`[RabbitMQ:${this.nombreServicio}] Agotados los intentos de reconexión`);
          this.emit('reconexionFallida');
          return;
        }
        
        // Programar siguiente intento
        this.reconectando = false;
        this.programarReconexion();
      }
    }, retraso);
  }

  /**
   * Restaura suscripciones después de una reconexión
   * @private
   */
  private async restaurarSuscripciones(): Promise<void> {
    console.log(`[RabbitMQ:${this.nombreServicio}] Restaurando ${this.suscripciones.size} suscripciones activas...`);
    
    // Primero restauramos las suscripciones ya existentes
    for (const [id, { cola, clavesEnrutamiento }] of this.suscripciones) {
      try {
        if (this.canal) {
          // Configurar cola de mensajes fallidos
          await this.configurarColaMensajesFallidos(cola);
          
          // Restaurar cola
          await this.canal.assertQueue(cola, {
            durable: true,
            deadLetterExchange: RABBITMQ_DLX_EXCHANGE,
            deadLetterRoutingKey: 'fallidos'
          });
          
          // Restaurar bindings
          for (const claveEnrutamiento of clavesEnrutamiento) {
            await this.canal.bindQueue(cola, RABBITMQ_EXCHANGE, claveEnrutamiento);
          }
          
          console.log(`[RabbitMQ:${this.nombreServicio}] Cola ${cola} restaurada con éxito`);
        }
      } catch (error) {
        console.error(`[RabbitMQ:${this.nombreServicio}] Error al restaurar cola ${cola}:`, error);
      }
    }
    
    // Luego procesamos suscripciones pendientes
    console.log(`[RabbitMQ:${this.nombreServicio}] Procesando ${this.suscripcionesPendientes.length} suscripciones pendientes...`);
    
    const pendientes = [...this.suscripcionesPendientes];
    this.suscripcionesPendientes = [];
    
    for (const suscripcion of pendientes) {
      try {
        const id = await this.suscribirse(
          suscripcion.nombreCola,
          suscripcion.clavesEnrutamiento,
          suscripcion.callback,
          suscripcion.opciones
        );
        suscripcion.resolve(id);
      } catch (error) {
        suscripcion.reject(error as Error);
      }
    }
  }

  /**
   * Inicia un ping periódico para verificar la conexión
   * 
   * @private
   */
  private configurarPing(): void {
    if (this.intervaloPing) {
      clearInterval(this.intervaloPing);
    }
    
    this.intervaloPing = setInterval(async () => {
      try {
        // Verificar la conexión y publicar ping
        const resultado = await this.verificarConexion();
        if (!resultado) {
          console.warn(`[RabbitMQ:${this.nombreServicio}] Conexión perdida durante ping, intentando reconectar...`);
        }
      } catch (error) {
        console.warn(`[RabbitMQ:${this.nombreServicio}] Error en ping:`, error);
      }
    }, 30000); // Ping cada 30 segundos
  }

  /**
   * Verifica la conexión y publica un mensaje de ping
   * 
   * @private
   * @returns {Promise<boolean>} - Indica si la conexión es exitosa
   */
  private async verificarConexion(): Promise<boolean> {
    if (!this.conexion || !this.canal) {
      console.warn(`[RabbitMQ:${this.nombreServicio}] Conexión perdida durante ping, intentando reconectar...`);
      await this.programarReconexion();
      return false;
    }
    
    try {
      // Simplemente verificamos que el canal esté abierto usando una operación segura
      // En lugar de crear/eliminar colas, usamos un método que no puede fallar
      
      // Verificamos que el canal esté abierto
      if (!this.canal || !this.canal.connection) {
        console.warn(`[RabbitMQ:${this.nombreServicio}] Canal cerrado o conexión cerrada durante ping`);
        await this.programarReconexion();
        return false;
      }
      
      // Usamos una operación segura que no puede fallar: publicar en el exchange por defecto
      // Esto verifica que el canal está funcionando sin riesgo de errores 404
      const mensaje = { tipo: 'ping', timestamp: Date.now() };
      const buffer = Buffer.from(JSON.stringify(mensaje));
      
      // Publicamos en el exchange por defecto (vacío) con una routing key que no existe
      // Esto es seguro porque si no hay consumidores, el mensaje simplemente se descarta
      const pingRoutingKey = `ping.${this.nombreServicio}.${Date.now()}`;
      this.canal.publish('', pingRoutingKey, buffer, { expiration: '1000' });
      
      return true;
    } catch (error) {
      console.warn(`[RabbitMQ:${this.nombreServicio}] Error en ping:`, error);
      
      // Intentar reconectar si no estamos en proceso
      if (!this.reconectando) {
        await this.programarReconexion();
      }
      return false;
    }
  }

  /**
   * Publica un evento en el exchange de RabbitMQ
   * 
   * @param {string} tipo - Tipo de evento a publicar
   * @param {any} datos - Datos del evento
   * @param {Object} [opciones] - Opciones adicionales para la publicación
   * @returns {Promise<boolean>} - Indica si la publicación fue exitosa
   * @throws {Error} Si no hay conexión activa o error al publicar
   */
  public async publicarEvento(
    tipo: string | TipoEvento,
    datos: any,
    opciones?: {
      persistente?: boolean;
      expiracion?: number;
      prioridad?: number;
      idCorrelacion?: string;
      headers?: Record<string, any>;
    }
  ): Promise<boolean> {
    // Verificar si tenemos conexión
    if (!this.conexion || !this.canal) {
      console.warn(`[RabbitMQ:${this.nombreServicio}] Intento de publicar sin conexión activa`);
      
      // Intentar reconectar
      if (!this.reconectando) {
        await this.programarReconexion();
      }
      
      throw new Error(`No hay conexión a RabbitMQ para publicar evento ${tipo}`);
    }
    
    try {
      // Crear el mensaje con metadatos
      const mensaje: MensajeEvento = {
        tipo,
        datos,
        metadatos: {
          timestamp: Date.now(),
          servicioOrigen: this.nombreServicio,
          idCorrelacion: opciones?.idCorrelacion || this.generarIdUnico()
        }
      };
      
      // Convertir a formato JSON y luego a Buffer
      const contenido = Buffer.from(JSON.stringify(mensaje));
      
      // Determinar clave de enrutamiento basada en el tipo de evento
      const claveEnrutamiento = typeof tipo === 'string' ? tipo : String(tipo);
      
      // Opciones de publicación
      const opcionesPublicacion: amqplib.Options.Publish = {
        persistent: opciones?.persistente !== false, // Por defecto true
        expiration: opciones?.expiracion?.toString(),
        priority: opciones?.prioridad,
        correlationId: opciones?.idCorrelacion || mensaje.metadatos.idCorrelacion,
        headers: {
          'x-retries': 0,
          ...(opciones?.headers || {})
        }
      };
      
      // Publicar el mensaje en el exchange
      const resultado = this.canal.publish(RABBITMQ_EXCHANGE, claveEnrutamiento, contenido, opcionesPublicacion);
      
      // Incrementar contador de mensajes para métricas
      this.incrementarContadorMensajes('enviados', claveEnrutamiento);
      
      if (resultado) {
        // Evento publicado correctamente
        this.emit('eventoPublicado', tipo, mensaje);
        return true;
      } else {
        // Buffer lleno, no se pudo publicar inmediatamente
        console.warn(`[RabbitMQ:${this.nombreServicio}] Buffer lleno al publicar: ${tipo}`);
        this.emit('bufferLleno', tipo);
        return false;
      }
    } catch (error) {
      console.error(`[RabbitMQ:${this.nombreServicio}] Error al publicar evento ${tipo}:`, error);
      this.emit('errorPublicacion', tipo, error instanceof Error ? error : new Error(String(error)));
      
      // Incrementar contador de errores
      this.incrementarContadorMensajes('errores', typeof tipo === 'string' ? tipo : String(tipo));
      
      throw error;
    }
  }

  /**
   * Elimina una cola para recrearla con diferentes propiedades
   * 
   * @param {string} nombreCola - Nombre de la cola a eliminar
   * @returns {Promise<boolean>} - Si se eliminó correctamente
   * @private
   */
  private async eliminarColaExistente(nombreCola: string): Promise<boolean> {
    if (!this.canal) {
      console.log(`[RabbitMQ:${this.nombreServicio}] No hay canal disponible para eliminar cola ${nombreCola}`);
      return false;
    }

    console.log(`[RabbitMQ:${this.nombreServicio}] Intentando eliminar cola: ${nombreCola}`);
    try {
      await this.canal.deleteQueue(nombreCola);
      console.log(`[RabbitMQ:${this.nombreServicio}] Cola eliminada correctamente: ${nombreCola}`);
    } catch (error: any) {
      if (error.code === 406 || (typeof error.message === 'string' && error.message.includes('PRECONDITION_FAILED'))) {
        console.warn(`[RabbitMQ:${this.nombreServicio}] Error 406 al eliminar cola ${nombreCola}, ignorando precondición fallida.`);
        return true;
      } else if (error.code === 404 || (typeof error.message === 'string' && error.message.includes('NOT_FOUND'))) {
        console.log(`[RabbitMQ:${this.nombreServicio}] La cola ${nombreCola} no existe, no es necesario eliminarla`);
      } else {
        console.warn(`[RabbitMQ:${this.nombreServicio}] Error al eliminar cola ${nombreCola}:`, error);
      }
    }
    return true;
  }

  /**
   * Purga todas las colas temporales del sistema
   * @returns {Promise<boolean>} true si se purgaron las colas, false en caso contrario
   */
  public async purgarColas(): Promise<boolean> {
    console.log(`[RabbitMQ:${this.nombreServicio}] La función purgarColas ha sido deshabilitada`);
    console.log(`[RabbitMQ:${this.nombreServicio}] Utilice los scripts en colasConfig para gestionar las colas`);
    
    // No realizamos ninguna acción de borrado
    // Las colas deben gestionarse mediante los scripts dedicados
    return true;
    
    /*
    if (!this.canal) {
      console.error(`[RabbitMQ:${this.nombreServicio}] No hay canal disponible para purgar colas`);
      return false;
    }
    
    try {
      // Lista de colas a eliminar (colas de monitoreo, ping, etc)
      const colasEliminar = [
        // Colas de monitoreo y ping (siempre se pueden recrear)
        `${RABBITMQ_QUEUE_PREFIX}monitor`,
        `${RABBITMQ_QUEUE_PREFIX}ping`,
        
        // Colas de eventos (se recrearán al suscribirse)
        `${RABBITMQ_QUEUE_PREFIX}eventos_mapas`,
        `${RABBITMQ_QUEUE_PREFIX}eventos_notificaciones`,
        `${RABBITMQ_QUEUE_PREFIX}eventos_sociales`,
        `${RABBITMQ_QUEUE_PREFIX}eventos_usuarios`,
        `${RABBITMQ_QUEUE_PREFIX}eventos_autenticacion`,
        `${RABBITMQ_QUEUE_PREFIX}eventos_todos`
      ];
      
      let contadorEliminadas = 0;
      
      for (const cola of colasEliminar) {
        console.log(`[RabbitMQ:${this.nombreServicio}] Intentando eliminar cola: ${cola}`);
        try {
          await this.eliminarColaPublica(cola);
          contadorEliminadas++;
          
          // También eliminar la DLQ correspondiente
          const colaDLQ = `${RABBITMQ_DLQ_PREFIX}${cola}`;
          console.log(`[RabbitMQ:${this.nombreServicio}] Intentando eliminar cola: ${colaDLQ}`);
          await this.eliminarColaPublica(colaDLQ);
          contadorEliminadas++;
        } catch (error) {
          console.warn(`[RabbitMQ:${this.nombreServicio}] Error al eliminar cola ${cola}: ${(error as Error).message}`);
        }
      }
      
      console.log(`[RabbitMQ:${this.nombreServicio}] Se eliminaron ${contadorEliminadas} colas`);
      return true;
    } catch (error) {
      console.error(`[RabbitMQ:${this.nombreServicio}] Error al purgar colas: ${(error as Error).message}`);
      return false;
    }
    */
  }

  /**
   * Suscribe a eventos de una cola específica
   * 
   * @param nombreCola Nombre de la cola a suscribirse
   * @param clavesEnrutamiento Claves de enrutamiento para los eventos
   * @param callback Función que procesa los mensajes recibidos
   * @param opciones Opciones de suscripción
   * @returns ID único de la suscripción
   */
  public async suscribirse(
    nombreCola: string,
    clavesEnrutamiento: string[],
    callback: CallbackMensaje,
    opciones?: {
      durable?: boolean;
      prefetch?: number;
      autoAck?: boolean;
      requeue?: boolean;
      maxReintentos?: number;
      tiempoEspera?: number;
    }
  ): Promise<string> {
    // Generar ID único para esta suscripción
    const idSuscripcion = this.generarIdUnico();
    
    // Si no hay conexión, encolar la suscripción para cuando se conecte
    if (!this.canal) {
      return new Promise((resolve, reject) => {
        this.suscripcionesPendientes.push({
          nombreCola,
          clavesEnrutamiento,
          callback,
          opciones,
          resolve: (id: string) => resolve(id),
          reject
        });
      });
    }
    
    try {
      // Verificar que la cola existe sin intentar crearla
      try {
        await this.canal.checkQueue(nombreCola);
        console.log(`[RabbitMQ:${this.nombreServicio}] Cola verificada: ${nombreCola}`);
      } catch (error) {
        console.log(`[RabbitMQ:${this.nombreServicio}] Error al verificar cola ${nombreCola}:`, error);
        throw new Error(`La cola ${nombreCola} no existe. Debe crearla primero con los scripts de configuración`);
      }
      
      // Asumimos que las colas ya están enlazadas al exchange con las claves de enrutamiento correctas
      // No intentamos enlazar de nuevo, ya que eso debe haberse hecho en los scripts de configuración
      
      // Configurar prefetch si se especifica
      if (opciones?.prefetch) {
        await this.canal.prefetch(opciones.prefetch);
      }
      
      // Configurar el consumidor
      const { consumerTag } = await this.canal.consume(
        nombreCola,
        async (msg) => {
          if (!msg) return; // Null cuando el consumidor es cancelado
          
          try {
            // Incrementar contador de mensajes recibidos
            this.incrementarContadorMensajes('recibidos', nombreCola);
            
            // Extraer datos del mensaje
            const contenido = msg.content.toString();
            let datos;
            
            try {
              datos = JSON.parse(contenido);
            } catch (error) {
              console.error(`[RabbitMQ:${this.nombreServicio}] Error al parsear mensaje:`, error);
              // Rechazar mensaje mal formateado para que vaya a DLQ
              this.canal?.reject(msg, false);
              return;
            }
            
            // Información del mensaje
            const infoMensaje: InfoMensaje = {
              id: msg.properties.messageId || this.generarIdUnico(),
              exchange: msg.fields.exchange,
              claveEnrutamiento: msg.fields.routingKey,
              cola: nombreCola,
              timestamp: msg.properties.timestamp || Date.now(),
              headers: msg.properties.headers || {},
              propiedades: msg.properties
            };
            
            try {
              // Llamar callback de usuario con los datos y la información del mensaje
              await callback(datos, infoMensaje);
              
              // Confirmar procesamiento exitoso
              this.canal?.ack(msg);
              
              // Incrementar contador de mensajes procesados
              this.incrementarContadorMensajes('procesados', nombreCola);
            } catch (error) {
              console.error(`[RabbitMQ:${this.nombreServicio}] Error al procesar mensaje:`, error);
              
              // Incrementar intentos
              const intentos = (msg.properties.headers?.['x-delivery-count'] || 0) + 1;
              
              // Rechazar mensaje con reintento o enviarlo a DLQ
              if (intentos < RABBITMQ_MAX_INTENTOS) {
                // Rechazar y volver a encolar con información de reintento
                this.canal?.reject(msg, true);
                console.log(`[RabbitMQ:${this.nombreServicio}] Mensaje reencolado para reintento ${intentos}/${RABBITMQ_MAX_INTENTOS}`);
              } else {
                // Enviar a DLQ cuando se superan los reintentos
                this.canal?.reject(msg, false);
                console.log(`[RabbitMQ:${this.nombreServicio}] Mensaje enviado a DLQ después de ${intentos} intentos`);
                
                // Incrementar contador de mensajes fallidos
                this.incrementarContadorMensajes('fallidos', nombreCola);
              }
            }
          } catch (error) {
            console.error(`[RabbitMQ:${this.nombreServicio}] Error crítico al procesar mensaje:`, error);
            // En caso de error crítico, rechazar sin reintento
            this.canal?.reject(msg, false);
          }
        },
        // Opciones de consumidor (noAck: false significa que se requiere confirmación explícita)
        { noAck: false }
      );
      
      // Guardar información de suscripción
      this.suscripciones.set(idSuscripcion, {
        cola: nombreCola,
        clavesEnrutamiento
      });
      
      console.log(`[RabbitMQ:${this.nombreServicio}] Suscripción activada: ${nombreCola}`);
      
      // Activar evento de suscripción
      this.emit('suscripcion', {
        idSuscripcion,
        nombreCola,
        clavesEnrutamiento
      });
      
      return idSuscripcion;
    } catch (error) {
      console.error(`[RabbitMQ:${this.nombreServicio}] Error al suscribirse a ${nombreCola}:`, error);
      throw error;
    }
  }

  /**
   * Incrementa contadores de mensajes por tipo y clave
   * @param tipo Tipo de contador a incrementar
   * @param clave Clave específica del contador
   * @private
   */
  private incrementarContadorMensajes(
    tipo: 'enviados' | 'recibidos' | 'errores' | 'procesados' | 'fallidos',
    clave: string
  ): void {
    const contador = tipo === 'enviados' 
      ? this.contadorMensajesEnviados 
      : tipo === 'recibidos' 
        ? this.contadorMensajesRecibidos 
        : tipo === 'errores' 
          ? this.contadorErrores 
          : tipo === 'procesados' 
            ? this.contadorMensajesRecibidos 
            : this.contadorErrores;
    
    contador.set(clave, (contador.get(clave) || 0) + 1);
  }

  /**
   * Obtiene las métricas de mensajes enviados, recibidos y errores
   * @returns {Object} Objeto con métricas de mensajes
   */
  public obtenerMetricas(): { enviados: Record<string, number>, recibidos: Record<string, number>, errores: Record<string, number> } {
    return {
      enviados: Object.fromEntries(this.contadorMensajesEnviados.entries()),
      recibidos: Object.fromEntries(this.contadorMensajesRecibidos.entries()),
      errores: Object.fromEntries(this.contadorErrores.entries())
    };
  }

  /**
   * Maneja errores no capturados en el conector
   * 
   * @param {Error} error - Error ocurrido
   * @private
   */
  private manejarErrorNoCapturado(error: Error): void {
    // Verificar si el error es relacionado con una cola que no existe (404)
    const errorObj = error as any;
    if (errorObj?.code === 404 && errorObj?.message?.includes('no queue')) {
      console.warn(`[RabbitMQ:${this.nombreServicio}] Error 404 controlado (cola no existe):`, errorObj.message);
      
      // Para estos errores, no cerramos la conexión ni hacemos reconexión
      // ya que son esperados cuando las colas son eliminadas automáticamente
      return;
    }
    
    // Para otros errores no esperados, los registramos y consideramos reconectar
    console.error(`[RabbitMQ:${this.nombreServicio}] Error no capturado:`, error);
    
    // Si es un error crítico de conexión, programamos reconexión
    if (errorObj?.code === 'ECONNREFUSED' || 
        errorObj?.code === 'ECONNRESET' || 
        errorObj?.code === 320 || // Conexión forzada a cerrarse
        errorObj?.code === 501    // Error en el canal
    ) {
      this.programarReconexion();
    }
  }

  /**
   * Detiene la conexión con RabbitMQ
   * 
   * @returns {Promise<void>}
   */
  public async detener(): Promise<void> {
    // Detener intervalo de ping
    if (this.intervaloPing) {
      clearInterval(this.intervaloPing);
      this.intervaloPing = null;
    }
    
    // Limpiar mapa de suscripciones
    this.suscripciones.clear();
    
    // Cerrar canal y conexión
    try {
      if (this.canal) {
        await this.canal.close();
        this.canal = null;
      }
      
      if (this.conexion) {
        await this.conexion.close();
        this.conexion = null;
      }
      
      this.iniciado = false;
      console.log(`[RabbitMQ:${this.nombreServicio}] Conexión cerrada correctamente`);
      this.emit('detenido');
    } catch (error) {
      console.error(`[RabbitMQ:${this.nombreServicio}] (X) Error al detener conexión:`, error);
      this.emit('errorAlDetener', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Genera un identificador único
   * @returns {string} Identificador único
   * @private
   */
  private generarIdUnico(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  /**
   * Método público que envuelve el método privado eliminarColaExistente
   * para permitir su uso fuera de la clase.
   * @param {string} cola - Nombre de la cola a eliminar
   * @returns {Promise<boolean>} Indica si se eliminó la cola
   */
  public async eliminarColaPublica(cola: string): Promise<boolean> {
    return this.eliminarColaExistente(cola);
  }

  /**
   * Verifica que todas las colas DLQ existan y estén correctamente configuradas
   */
  public async verificarColasDLQ(colasEventos: string[] = []): Promise<void> {
    if (!this.canal) {
      throw new Error('Canal no inicializado');
    }

    // Si no se proporcionan colas, usar las colas de eventos estándar
    const colasVerificar = colasEventos.length > 0 ? colasEventos : [
      'api-gateway_eventos_auth',
      'api-gateway_eventos_mapas',
      'api-gateway_eventos_notificaciones',
      'api-gateway_eventos_sociales',
      'api-gateway_eventos_usuarios'
    ];

    for (const cola of colasVerificar) {
      try {
        // Construir el nombre de la cola fallida
        const nombreColaOriginal = cola.startsWith(RABBITMQ_QUEUE_PREFIX) 
          ? cola 
          : `${RABBITMQ_QUEUE_PREFIX}${cola}`;
        
        const baseQueueName = nombreColaOriginal.startsWith(RABBITMQ_QUEUE_PREFIX) 
          ? nombreColaOriginal.substring(RABBITMQ_QUEUE_PREFIX.length) 
          : nombreColaOriginal;
        
        const nombreColaFallidos = `${RABBITMQ_QUEUE_PREFIX}${baseQueueName.replace('_eventos_', '_fallidos_eventos_')}`;
        
        // Verificar la cola DLQ
        await this.canal.checkQueue(nombreColaFallidos);
        console.log(`[RabbitMQ:${this.nombreServicio}] ✅ Cola DLQ verificada y lista: ${nombreColaFallidos}`);
      } catch (error: any) {
        console.error(`[RabbitMQ:${this.nombreServicio}] ❌ Error al verificar cola DLQ para ${cola}: ${error.message}`);
      }
    }
  }
}

// Registro de conectores para reutilización
const conectores = new Map<string, ConectorRabbitMQ>();

/**
 * Obtiene o crea un conector RabbitMQ para un servicio
 * 
 * @param {string} nombreServicio - Nombre del servicio
 * @returns {ConectorRabbitMQ} - Instancia del conector
 */
export function obtenerConectorRabbitMQ(nombreServicio: string): ConectorRabbitMQ {
  if (!conectores.has(nombreServicio)) {
    conectores.set(nombreServicio, new ConectorRabbitMQ(nombreServicio));
  }
  return conectores.get(nombreServicio)!;
}

/**
 * Inicializa la conexión a RabbitMQ para un servicio
 * @param {string} nombreServicio - Nombre del servicio que se conecta
 * @returns {Promise<ConectorRabbitMQ>} Instancia del conector inicializado
 */
export async function inicializarRabbitMQ(nombreServicio: string): Promise<ConectorRabbitMQ> {
  try {
    // Obtener o crear la instancia del conector
    const conector = obtenerConectorRabbitMQ(nombreServicio);
    
    // Iniciar la conexión si no está iniciada
    if (!conector['iniciado']) {
      await conector.iniciar();
      console.log(`[RabbitMQ] Conector para ${nombreServicio} inicializado correctamente`);
    }

    // Verificar que el exchange principal existe (no intentamos crear colas)
    const canal = conector['canal'];
    if (canal) {
      try {
        await canal.checkExchange(RABBITMQ_EXCHANGE);
        console.log(`[RabbitMQ] ✅ Exchange ${RABBITMQ_EXCHANGE} verificado correctamente`);
      } catch (error) {
        console.error(`[RabbitMQ] El exchange ${RABBITMQ_EXCHANGE} no existe, se creará`);
        // Crear el exchange si no existe (esto es necesario para el funcionamiento básico)
        await canal.assertExchange(RABBITMQ_EXCHANGE, 'topic', {
          durable: true,
          autoDelete: false
        });
      }
    }
    
    return conector;
  } catch (error) {
    console.error(`[RabbitMQ] Error al inicializar RabbitMQ para ${nombreServicio}:`, error);
    throw error;
  }
}

/**
 * Publica un evento en RabbitMQ
 * 
 * @param {string} tipo - Tipo de evento a publicar
 * @param {any} datos - Datos del evento
 * @param {string} [nombreServicio='api-gateway'] - Nombre del servicio que publica
 * @param {Object} [opciones] - Opciones adicionales para la publicación
 * @returns {Promise<boolean>} - Indica si la publicación fue exitosa
 */
export async function publicarEvento(
  tipo: string | TipoEvento,
  datos: any,
  nombreServicio: string = 'api-gateway',
  opciones?: {
    persistente?: boolean;
    expiracion?: number;
    prioridad?: number;
    idCorrelacion?: string;
    headers?: Record<string, any>;
  }
): Promise<boolean> {
  const conector = obtenerConectorRabbitMQ(nombreServicio);
  return await conector.publicarEvento(tipo, datos, opciones);
}

/**
 * Suscribe a eventos específicos
 * 
 * @param {string} nombreCola - Nombre de la cola donde recibir eventos
 * @param {string[]} clavesEnrutamiento - Claves de enrutamiento para filtrar eventos
 * @param {CallbackMensaje} callback - Función a ejecutar cuando se recibe un mensaje
 * @param {string} nombreServicio - Nombre del servicio que se suscribe
 * @param {Object} [opciones] - Opciones adicionales para la suscripción
 * @returns {Promise<string>} - Identificador único de la suscripción
 */
export async function suscribirseEventos(
  nombreCola: string,
  clavesEnrutamiento: string[],
  callback: CallbackMensaje,
  nombreServicio: string = 'api-gateway',
  opciones?: {
    durable?: boolean;
    prefetch?: number;
    autoAck?: boolean;
    requeue?: boolean;
    maxReintentos?: number;
    tiempoEspera?: number;
  }
): Promise<string> {
  const conector = await inicializarRabbitMQ(nombreServicio);
  
  // Si el nombre de la cola no incluye 'api-gateway', se formatea como 'api-gateway_eventos_<nombreCola>'
  const colaFormateada = nombreCola.includes('api-gateway') ? nombreCola : `api-gateway_eventos_${nombreCola}`;
  const nombreColaCompleto = obtenerNombreColaCompleto(colaFormateada);
  
  return conector.suscribirse(nombreColaCompleto, clavesEnrutamiento, callback, opciones);
}

/**
 * Detiene la conexión con RabbitMQ
 * 
 * @param {string} [nombreServicio='api-gateway'] - Nombre del servicio
 * @returns {Promise<void>}
 */
export async function detenerRabbitMQ(nombreServicio: string = 'api-gateway'): Promise<void> {
  if (conectores.has(nombreServicio)) {
    const conector = conectores.get(nombreServicio)!;
    await conector.detener();
    conectores.delete(nombreServicio);
  }
}

/**
 * Obtiene métricas de RabbitMQ para un servicio específico
 * 
 * @param {string} [nombreServicio='api-gateway'] - Nombre del servicio
 * @returns {Object} Objeto con métricas
 */
export function obtenerMetricasRabbitMQ(nombreServicio: string = 'api-gateway'): any {
  if (conectores.has(nombreServicio)) {
    const conector = conectores.get(nombreServicio)!;
    return conector.obtenerMetricas();
  }
  return { enviados: {}, recibidos: {}, errores: {} };
}

/**
 * Suscribe a todos los eventos de una categoría específica.
 * 
 * @param {string} nombreServicio - Nombre del servicio que se suscribe
 * @param {string} nombreCola - Nombre de la cola donde recibir eventos
 * @param {string} categoria - Categoría de eventos a la que suscribirse (auth, mapas, notificaciones, sociales, usuarios)
 * @param {CallbackMensaje} callback - Función a ejecutar cuando se recibe un mensaje
 * @param {Object} [opciones] - Opciones adicionales para la suscripción
 * @returns {Promise<string>} - Identificador único de la suscripción
 */
export async function suscribirseACategoria(
  nombreServicio: string,
  nombreCola: string,
  categoria: string,
  callback: CallbackMensaje,
  opciones?: {
    durable?: boolean;
    prefetch?: number;
    autoAck?: boolean;
    requeue?: boolean;
    maxReintentos?: number;
    tiempoEspera?: number;
  }
): Promise<string> {
  const conector = await inicializarRabbitMQ(nombreServicio);
  
  // Asegurar que se use una cola con el formato correcto (con el prefijo del servicio)
  const nombreColaCompleto = obtenerNombreColaCompleto(nombreCola);
  
  // No permitir crear colas desde aquí, solo usar colas existentes
  return conector.suscribirse(
    nombreColaCompleto,
    [`${categoria}.*`],
    callback,
    {
      ...opciones
    }
  );
}

/**
 * Suscribe a todos los eventos del sistema
 * 
 * @param {string} nombreServicio - Nombre del servicio que se suscribe
 * @param {string} nombreCola - Nombre de la cola donde recibir eventos
 * @param {CallbackMensaje} callback - Función a ejecutar cuando se recibe un mensaje
 * @param {Object} [opciones] - Opciones adicionales para la suscripción
 * @returns {Promise<string>} - Identificador único de la suscripción
 */
export async function suscribirseTodosEventos(
  nombreServicio: string,
  nombreCola: string,
  callback: CallbackMensaje,
  opciones?: {
    durable?: boolean;
    prefetch?: number;
    autoAck?: boolean;
    requeue?: boolean;
    maxReintentos?: number;
    tiempoEspera?: number;
  }
): Promise<string> {
  const conector = await inicializarRabbitMQ(nombreServicio);
  
  // Asegurar que se use una cola con el formato correcto (con el prefijo del servicio)
  // Si solo se pasa un nombre simple como "notificaciones", formatearlo como "api-gateway_eventos_notificaciones"
  let colaFormateada = nombreCola;
  if (!nombreCola.includes('api-gateway') && !nombreCola.includes('eventos')) {
    colaFormateada = `api-gateway_eventos_${nombreCola}`;
  }
  const nombreColaCompleto = obtenerNombreColaCompleto(colaFormateada);
  
  // No permitir crear colas desde aquí, solo usar colas existentes
  return conector.suscribirse(
    nombreColaCompleto,
    ['#'], // Patrón comodín que suscribe a todos los eventos
    callback,
    {
      ...opciones
    }
  );
}

/**
 * Purga todas las colas conocidas, excluyendo aquellas que se desean mantener.
 * Borra tanto la cola principal como su cola de mensajes fallidos asociada.
 * @returns {Promise<void>}
 */
export async function purgarColasExcluyendo(): Promise<void> {
  console.log('[RabbitMQ] La función purgarColasExcluyendo ha sido deshabilitada');
  console.log('[RabbitMQ] Utilice los scripts en colasConfig para gestionar las colas');
  
  // No realizamos ninguna acción de borrado
  // Las colas deben gestionarse mediante los scripts dedicados
  return;

  // El código siguiente está comentado para evitar borrar colas no deseadas
  /*
  // Lista de colas permitidas (se mantendrán)
  const colasPermitidas = [
    'mapyourworld_api-gateway_eventos_auth',
    'mapyourworld_api-gateway_eventos_mapas',
    'mapyourworld_api-gateway_eventos_notificaciones',
    'mapyourworld_api-gateway_eventos_sociales',
    'mapyourworld_api-gateway_eventos_usuarios',
    'mapyourworld_api-gateway_fallidos_eventos_auth',
    'mapyourworld_api-gateway_fallidos_eventos_mapas',
    'mapyourworld_api-gateway_fallidos_eventos_notificaciones',
    'mapyourworld_api-gateway_fallidos_eventos_sociales',
    'mapyourworld_api-gateway_fallidos_eventos_usuarios',
    'mapyourworld_api-gateway_fallidos_notificaciones',
    'mapyourworld_api-gateway_notificaciones'
  ];

  // Lista de colas conocidas en el sistema
  const colasConocidas = [
    `${RABBITMQ_QUEUE_PREFIX}eventos_auth`,
    `${RABBITMQ_QUEUE_PREFIX}eventos_mapas`,
    `${RABBITMQ_QUEUE_PREFIX}eventos_notificaciones`,
    `${RABBITMQ_QUEUE_PREFIX}eventos_sociales`,
    `${RABBITMQ_QUEUE_PREFIX}eventos_usuarios`,
    `${RABBITMQ_QUEUE_PREFIX}fallidos_eventos_auth`,
    `${RABBITMQ_QUEUE_PREFIX}fallidos_eventos_mapas`,
    `${RABBITMQ_QUEUE_PREFIX}fallidos_eventos_notificaciones`,
    `${RABBITMQ_QUEUE_PREFIX}fallidos_eventos_sociales`,
    `${RABBITMQ_QUEUE_PREFIX}fallidos_eventos_usuarios`,
    `${RABBITMQ_QUEUE_PREFIX}fallidos_notificaciones`,
    `${RABBITMQ_QUEUE_PREFIX}notificaciones`
  ];

  // Obtener instancia del conector (usamos 'api-gateway' como nombre de servicio)
  const conector = obtenerConectorRabbitMQ('api-gateway');

  for (const cola of colasConocidas) {
    if (!colasPermitidas.includes(cola)) {
      console.log(`[purga] Eliminando cola: ${cola}`);
      await conector.eliminarColaPublica(cola);
      const colaDLQ = `${RABBITMQ_DLQ_PREFIX}${cola}`;
      console.log(`[purga] Eliminando cola DLQ: ${colaDLQ}`);
      await conector.eliminarColaPublica(colaDLQ);
    } else {
      console.log(`[purga] Conservando cola permitida: ${cola}`);
    }
  }
  */
}

// Agrego helper para evitar duplicar el prefijo
function obtenerNombreColaCompleto(nombreCola: string): string {
  return nombreCola.startsWith(RABBITMQ_QUEUE_PREFIX) ? nombreCola : `${RABBITMQ_QUEUE_PREFIX}${nombreCola}`;
}

// Exportar la clase y funciones
export default ConectorRabbitMQ; 