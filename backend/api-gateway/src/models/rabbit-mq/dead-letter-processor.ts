/**
 * @fileoverview Procesador de colas de mensajes fallidos para RabbitMQ
 * 
 * Este módulo proporciona herramientas para monitorear y procesar mensajes
 * que han sido redirigidos a las colas de mensajes fallidos (DLQ).
 * 
 * @module DeadLetterProcessor
 */

import * as amqplib from 'amqplib';
import { 
  obtenerConectorRabbitMQ, 
  inicializarRabbitMQ,
  publicarEvento
} from './rabbit-mq';

import {
  TipoEvento,
  MensajeEvento,
  CallbackMensaje,
  CallbackError,
  DatosEventoError
} from './rabbit-mq.types';

// Prefijos configurados en el conector RabbitMQ
const RABBITMQ_DLQ_PREFIX = process.env.RABBITMQ_DLQ_PREFIX || 'mapyourworld_dlq_';
const RABBITMQ_EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'mapyourworld';
const RABBITMQ_DLX_EXCHANGE = `${RABBITMQ_EXCHANGE}.dlx`;

/**
 * Opciones para el procesamiento de colas de mensajes fallidos
 */
export interface OpcionesProcesadorDLQ {
  nombreServicio?: string;
  limiteProcesamiento?: number;
  intervaloMonitoreo?: number;
  habilitarRepublicacion?: boolean;
  callbackErrorPersonalizado?: CallbackError;
  logNivel?: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Clase para procesar colas de mensajes fallidos
 */
export class ProcesadorDeadLetter {
  private nombreServicio: string;
  private limiteProcesamiento: number;
  private intervaloMonitoreo: number;
  private habilitarRepublicacion: boolean;
  private callbackErrorPersonalizado?: CallbackError;
  private logNivel: 'error' | 'warn' | 'info' | 'debug';
  private intervalID?: NodeJS.Timeout;
  private procesando: boolean = false;
  
  /**
   * Crea una instancia del ProcesadorDeadLetter
   * @param {OpcionesProcesadorDLQ} opciones - Opciones de configuración
   */
  constructor(opciones?: OpcionesProcesadorDLQ) {
    this.nombreServicio = opciones?.nombreServicio || 'api-gateway';
    this.limiteProcesamiento = opciones?.limiteProcesamiento || 100;
    this.intervaloMonitoreo = opciones?.intervaloMonitoreo || 300000; // 5 minutos
    this.habilitarRepublicacion = opciones?.habilitarRepublicacion !== false;
    this.callbackErrorPersonalizado = opciones?.callbackErrorPersonalizado;
    this.logNivel = opciones?.logNivel || 'info';
  }
  
  /**
   * Inicia el monitoreo automático de las colas de mensajes fallidos
   * @returns {Promise<void>}
   */
  public async iniciar(): Promise<void> {
    this.log('Iniciando monitoreo de colas de mensajes fallidos', 'info');
    
    // Procesar inmediatamente al iniciar
    await this.procesarColasPendientes();
    
    // Configurar intervalo de monitoreo
    this.intervalID = setInterval(() => {
      // Usar una IIFE para poder usar async/await dentro del callback
      (async () => {
        try {
          await this.procesarColasPendientes();
        } catch (error) {
          this.log(`Error en monitoreo de DLQ: ${error}`, 'error');
        }
      })();
    }, this.intervaloMonitoreo);
    
    this.log(`Monitoreo de DLQ configurado cada ${this.intervaloMonitoreo / 1000} segundos`, 'info');
  }
  
  /**
   * Detiene el monitoreo automático
   */
  public detener(): void {
    if (this.intervalID) {
      clearInterval(this.intervalID);
      this.intervalID = undefined;
      this.log('Monitoreo de colas de mensajes fallidos detenido', 'info');
    }
  }
  
  /**
   * Lista todas las colas de mensajes fallidos disponibles
   * @returns {Promise<string[]>} Lista de nombres de colas
   */
  public async listarColasDLQ(): Promise<string[]> {
    try {
      // Asegurar que tenemos una conexión activa
      const conector = obtenerConectorRabbitMQ(this.nombreServicio);
      
      if (!conector || !conector['canal']) {
        await inicializarRabbitMQ(this.nombreServicio);
      }
      
      const canal = conector['canal'];
      if (!canal) {
        throw new Error('No hay canal disponible para listar colas DLQ');
      }
      
      // Obtener información de todas las colas
      // Esta es una implementación simplificada; en entornos reales se debe usar
      // la API HTTP de gestión de RabbitMQ para obtener esta información
      
      // Por ahora, recopilamos manualmente las colas con prefijo DLQ
      const colasPosibles = await this.obtenerColasConPrefijo(RABBITMQ_DLQ_PREFIX);
      
      return colasPosibles;
    } catch (error) {
      this.log(`Error al listar colas DLQ: ${error}`, 'error');
      return [];
    }
  }
  
  /**
   * Procesa los mensajes pendientes en todas las colas de mensajes fallidos
   * @returns {Promise<void>}
   */
  public async procesarColasPendientes(): Promise<void> {
    if (this.procesando) {
      this.log('Ya hay un procesamiento de DLQ en curso', 'info');
      return;
    }
    
    this.procesando = true;
    
    try {
      // Listar colas de mensajes fallidos
      const colasDLQ = await this.listarColasDLQ();
      
      if (colasDLQ.length === 0) {
        this.log('No se encontraron colas de mensajes fallidos', 'info');
        this.procesando = false;
        return;
      }
      
      // Procesar cada cola secuencialmente
      for (const nombreCola of colasDLQ) {
        await this.procesarColaDLQ(nombreCola);
      }
    } catch (error) {
      this.log(`Error al procesar colas pendientes: ${error}`, 'error');
    } finally {
      this.procesando = false;
    }
  }
  
  /**
   * Procesa una cola de mensajes fallidos específica
   *
   * @param {string} nombreCola - Nombre de la cola de mensajes fallidos a procesar
   * @returns {Promise<void>}
   */
  public async procesarColaDLQ(nombreCola: string): Promise<void> {
    if (this.procesando) {
      this.log(`Ya hay un procesamiento en curso, no se iniciará uno nuevo para ${nombreCola}`, 'warn');
      return;
    }

    try {
      this.procesando = true;
      const conector = obtenerConectorRabbitMQ(this.nombreServicio);
      
      // Verificar que el conector esté inicializado
      if (!conector) {
        throw new Error(`No se pudo obtener el conector RabbitMQ para ${this.nombreServicio}`);
      }
      
      // Conectar si es necesario
      if (!conector['conexion'] || !conector['canal']) {
        await conector['iniciar']();
      }
      
      const canal = conector['canal'];
      if (!canal) {
        throw new Error('No se pudo obtener el canal para procesar la cola DLQ');
      }
      
      // Verificar que la cola existe en lugar de intentar crearla
      try {
        const infoQueue = await canal.checkQueue(nombreCola);
        const cantidadMensajes = infoQueue.messageCount;
        
        if (cantidadMensajes === 0) {
          this.log(`La cola ${nombreCola} no tiene mensajes para procesar`, 'info');
          this.procesando = false;
          return;
        }
        
        this.log(`Iniciando procesamiento de ${cantidadMensajes} mensajes en ${nombreCola}`, 'info');
        
        // Notificar el inicio del procesamiento de la cola
        if (conector && typeof conector.emit === 'function') {
          conector.emit('procesandoDLQ', nombreCola, cantidadMensajes);
        }
        
        // Configurar consumidor con prefetch
        await canal.prefetch(this.limiteProcesamiento);
        
        // Consumir mensajes uno por uno
        await new Promise<void>((resolve, reject) => {
          let mensajesProcesados = 0;
          let consumerTag = '';
          
          canal.consume(nombreCola, async (msg) => {
            if (!msg) {
              return;
            }
            
            try {
              // Procesar el mensaje
              await this.procesarMensajeIndividual(msg, canal);
              mensajesProcesados++;
              
              // Si alcanzamos el límite, cerrar el consumidor
              if (mensajesProcesados >= this.limiteProcesamiento && consumerTag) {
                canal.cancel(consumerTag)
                  .then(() => resolve())
                  .catch(err => reject(err));
              }
            } catch (error: any) {
              this.log(`Error al procesar mensaje de ${nombreCola}: ${error.message}`, 'error');
              // Rechazar el mensaje y continuar
              canal.nack(msg, false, false);
            }
          }, { noAck: false })
          .then(result => {
            consumerTag = result.consumerTag;
          })
          .catch(err => {
            reject(err);
          });
          
          // Si no hay mensajes o consumidor, resolver después de un tiempo
          setTimeout(() => {
            if (mensajesProcesados === 0) {
              if (consumerTag) {
                canal.cancel(consumerTag)
                  .then(() => resolve())
                  .catch(() => resolve()); // Resolvemos de todas formas, incluso si hay error al cancelar
              } else {
                resolve();
              }
            }
          }, 5000); // Espera 5 segundos y resuelve si no hay actividad
        });
        
        this.log(`Finalizado el procesamiento de mensajes en ${nombreCola}`, 'info');
      } catch (error) {
        throw new Error(`La cola ${nombreCola} no existe. Debe crearla primero con los scripts de configuración`);
      }
      
    } catch (error: any) {
      this.log(`Error al procesar cola DLQ ${nombreCola}: ${error.message}`, 'error');
      throw error;
    } finally {
      this.procesando = false;
    }
  }
  
  /**
   * Procesa un mensaje individual de la cola de mensajes fallidos
   * @param {any} mensaje - Mensaje a procesar (debe ser del tipo amqplib.GetMessage)
   * @param {amqplib.Channel} canal - Canal de RabbitMQ
   * @returns {Promise<void>}
   * @private
   */
  private async procesarMensajeIndividual(
    mensaje: any,
    canal: amqplib.Channel
  ): Promise<void> {
    try {
      // Extraer información del mensaje
      const contenido = mensaje.content.toString();
      const datos = JSON.parse(contenido);
      const { tipo, metadatos } = datos as MensajeEvento;
      const headers = mensaje.properties.headers || {};
      const claveOriginal = mensaje.fields.routingKey.replace('.dlq', '');
      const intentos = (headers['x-retries'] || 0) as number;
      const razonRechazo = headers['x-reason'] || 'Desconocida';
      
      // Crear evento de error con los datos
      const datosError: DatosEventoError = {
        tipoError: 'procesamiento_fallido',
        mensaje: `Error al procesar mensaje tipo ${tipo}`,
        fechaError: new Date().toISOString(),
        intentos,
        eventoOriginal: {
          tipo: typeof tipo === 'string' ? tipo : String(tipo),
          datos: datos.datos
        }
      };
      
      // Invocar callback personalizado si existe
      if (this.callbackErrorPersonalizado) {
        const error = new Error(`Mensaje en DLQ: ${razonRechazo}`);
        await this.callbackErrorPersonalizado(datos, error);
      }
      
      // Publicar evento de error para monitoreo
      if (this.habilitarRepublicacion) {
        try {
          // Republicar el evento original a la cola principal
          // Incrementar contador de reintentos
          headers['x-retries'] = intentos + 1;
          headers['x-recovered'] = true;
          headers['x-recovery-time'] = Date.now();
          
          const resultado = canal.publish(
            RABBITMQ_EXCHANGE,
            claveOriginal,
            mensaje.content,
            {
              ...mensaje.properties,
              headers
            }
          );
          
          if (resultado) {
            this.log(`Mensaje de ${claveOriginal} republicado con ${intentos + 1} intentos`, 'info');
            // Notificar que el mensaje fue procesado de la DLQ
            const conector = obtenerConectorRabbitMQ(this.nombreServicio);
            conector.emit('mensajeProcesadoDeDLQ', datos, intentos + 1);
          } else {
            this.log(`Error al republicar mensaje de ${claveOriginal}`, 'error');
            // Publicar evento de error
            await publicarEvento(
              TipoEvento.ERROR_PROCESAMIENTO,
              datosError,
              this.nombreServicio
            );
          }
        } catch (error) {
          this.log(`Error al republicar: ${error}`, 'error');
        }
      } else {
        // Si no está habilitada la republicación, solo registrar
        await publicarEvento(
          TipoEvento.ERROR_PROCESAMIENTO,
          datosError,
          this.nombreServicio
        );
      }
      
      // Confirmar procesamiento del mensaje
      canal.ack(mensaje);
    } catch (error) {
      this.log(`Error al procesar mensaje DLQ: ${error}`, 'error');
      
      // Rechazar mensaje (volver a la cola)
      canal.nack(mensaje, false, true);
    }
  }
  
  /**
   * Obtiene las colas existentes que coinciden con un prefijo
   * @param {string} prefijo - Prefijo para filtrar colas
   * @returns {Promise<string[]>} Lista de nombres de colas encontradas
   * @private
   */
  private async obtenerColasConPrefijo(prefijo: string): Promise<string[]> {
    // En una implementación real, se usaría la API HTTP de gestión de RabbitMQ
    // Para este ejercicio, usamos una aproximación simplificada
    
    // Lista de posibles colas basadas en las suscripciones activas
    const conector = obtenerConectorRabbitMQ(this.nombreServicio);
    const suscripciones = conector['suscripciones'] || new Map();
    
    const colasPosibles: string[] = [];
    
    for (const [_, datos] of suscripciones.entries()) {
      if (datos.cola) {
        const nombreDLQ = `${prefijo}${datos.cola}`;
        colasPosibles.push(nombreDLQ);
      }
    }
    
    // Añadir cola de monitoreo
    colasPosibles.push(`${prefijo}mapyourworld_${this.nombreServicio}_monitor`);
    
    // Añadir cola de ping
    colasPosibles.push(`${prefijo}mapyourworld_${this.nombreServicio}_ping`);
    
    // Filtrar las colas que realmente existen
    const colasConfirmadas: string[] = [];
    
    if (conector['canal']) {
      for (const cola of colasPosibles) {
        try {
          await conector['canal'].checkQueue(cola);
          colasConfirmadas.push(cola);
        } catch (error) {
          // Cola no existe, omitir
        }
      }
    }
    
    return colasConfirmadas;
  }
  
  /**
   * Función para loguear mensajes según el nivel configurado
   * @param {string} mensaje - Mensaje a loguear
   * @param {'error' | 'warn' | 'info' | 'debug'} nivel - Nivel de log
   * @private
   */
  private log(mensaje: string, nivel: 'error' | 'warn' | 'info' | 'debug'): void {
    const nivelConfig = this.logNivel || 'info';
    
    // Mapeo de niveles a valores numéricos para comparar
    const niveles = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Solo loguear si el nivel es menor o igual al configurado
    if (niveles[nivel] <= niveles[nivelConfig]) {
      const prefijo = `[DLQ:${this.nombreServicio}]`;
      
      switch (nivel) {
        case 'error':
          console.error(`${prefijo} ${mensaje}`);
          break;
        case 'warn':
          console.warn(`${prefijo} ${mensaje}`);
          break;
        case 'info':
          console.log(`${prefijo} ${mensaje}`);
          break;
        case 'debug':
          console.debug(`${prefijo} ${mensaje}`);
          break;
      }
    }
  }
}

// Instancia singleton para uso general
let procesadorGlobal: ProcesadorDeadLetter | null = null;

/**
 * Obtiene o crea el procesador global de DLQ
 * @param {OpcionesProcesadorDLQ} [opciones] - Opciones para el procesador
 * @returns {ProcesadorDeadLetter} Instancia del procesador
 */
export function obtenerProcesadorDLQ(opciones?: OpcionesProcesadorDLQ): ProcesadorDeadLetter {
  if (!procesadorGlobal) {
    procesadorGlobal = new ProcesadorDeadLetter(opciones);
  }
  return procesadorGlobal;
}

/**
 * Inicia el monitoreo automático de colas de mensajes fallidos
 * @param {OpcionesProcesadorDLQ} [opciones] - Opciones para el procesador
 * @returns {Promise<ProcesadorDeadLetter>} Instancia del procesador iniciado
 */
export async function iniciarMonitoreoDLQ(
  opciones?: OpcionesProcesadorDLQ
): Promise<ProcesadorDeadLetter> {
  const procesador = obtenerProcesadorDLQ(opciones);
  await procesador.iniciar();
  return procesador;
}

/**
 * Procesa manualmente las colas de mensajes fallidos
 * @param {string} [nombreCola] - Nombre específico de la cola a procesar (opcional)
 * @param {OpcionesProcesadorDLQ} [opciones] - Opciones para el procesador
 * @returns {Promise<void>}
 */
export async function procesarDLQ(
  nombreCola?: string,
  opciones?: OpcionesProcesadorDLQ
): Promise<void> {
  const procesador = obtenerProcesadorDLQ(opciones);
  
  if (nombreCola) {
    await procesador.procesarColaDLQ(nombreCola);
  } else {
    await procesador.procesarColasPendientes();
  }
} 