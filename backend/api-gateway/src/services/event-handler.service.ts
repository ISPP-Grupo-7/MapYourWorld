/**
 * @fileoverview Servicio de gestión de eventos para el API Gateway
 * 
 * Este servicio centraliza la recepción y procesamiento de eventos
 * de todos los microservicios del sistema utilizando RabbitMQ.
 * 
 * @module EventHandlerService
 */

import {
  suscribirseACategoria,
  suscribirseTodosEventos,
  detenerRabbitMQ,
  TipoEvento,
  MensajeEvento,
  obtenerConectorRabbitMQ
} from '../models/rabbit-mq';
import { logger } from '../utils/logger';
import { eventSecurityService } from './event-security.service';

/**
 * Clase para manejar los eventos recibidos de los diferentes microservicios
 */
export class EventHandlerService {
  private readonly NOMBRE_SERVICIO = 'api-gateway';
  private readonly NOMBRE_COLA_EVENTOS = 'eventos';
  private readonly COLAS_REQUERIDAS = [
    'mapyourworld_api-gateway_eventos_auth',
    'mapyourworld_api-gateway_eventos_mapas',
    'mapyourworld_api-gateway_eventos_notificaciones',
    'mapyourworld_api-gateway_eventos_sociales',
    'mapyourworld_api-gateway_eventos_usuarios',
    'mapyourworld_api-gateway_eventos_notificaciones'
  ];
  private readonly MAPEO_COLAS = {
    mapas: 'mapyourworld_api-gateway_eventos_mapas',
    notificaciones: 'mapyourworld_api-gateway_eventos_notificaciones',
    sociales: 'mapyourworld_api-gateway_eventos_sociales',
    usuarios: 'mapyourworld_api-gateway_eventos_usuarios',
    autenticacion: 'mapyourworld_api-gateway_eventos_auth'
  };
  private suscripciones: string[] = [];
  private iniciado = false;

  /**
   * Inicializa el servicio de eventos y establece las suscripciones
   */
  public async iniciar(): Promise<void> {
    if (this.iniciado) {
      logger.info('Servicio de eventos ya se encuentra iniciado');
      return;
    }

    try {
      logger.info('Iniciando servicio de gestión de eventos...');

      // Suscribirse a eventos específicos por categoría
      await this.suscribirseAEventosMapas();
      await this.suscribirseAEventosNotificaciones();
      await this.suscribirseAEventosSociales();
      await this.suscribirseAEventosUsuarios();
      await this.suscribirseAEventosAutenticacion();

      // Verificar colas DLQ
      try {
        const conector = obtenerConectorRabbitMQ(this.NOMBRE_SERVICIO);
        await conector.verificarColasDLQ();
        logger.info('Colas DLQ verificadas correctamente');
      } catch (error: any) {
        logger.warn('Error al verificar colas DLQ:', error);
      }

      // También podemos suscribirnos a todos los eventos si es necesario
      // const idTodos = await this.suscribirseATodosLosEventos();
      // this.suscripciones.push(idTodos);

      this.iniciado = true;
      logger.info('Servicio de gestión de eventos iniciado correctamente');
    } catch (error: any) {
      logger.error('Error al iniciar el servicio de eventos:', error);
      throw error;
    }
  }

  /**
   * Suscribe a eventos relacionados con mapas
   */
  private async suscribirseAEventosMapas(): Promise<void> {
    try {
      const conector = obtenerConectorRabbitMQ(this.NOMBRE_SERVICIO);
      await conector.suscribirse(
        this.MAPEO_COLAS.mapas,
        ['mapas.*'],
        (mensaje, claveEnrutamiento) => this.procesarEventoMapa(mensaje, claveEnrutamiento)
      );
      logger.info('Suscripción a eventos de mapas establecida');
    } catch (error: any) {
      logger.error('Error al suscribirse a eventos de mapas:', error);
    }
  }

  /**
   * Suscribe a eventos relacionados con notificaciones
   */
  private async suscribirseAEventosNotificaciones(): Promise<void> {
    try {
      const conector = obtenerConectorRabbitMQ(this.NOMBRE_SERVICIO);
      await conector.suscribirse(
        this.MAPEO_COLAS.notificaciones,
        ['notificaciones.*'],
        (mensaje, claveEnrutamiento) => this.procesarEventoNotificacion(mensaje, claveEnrutamiento)
      );
      logger.info('Suscripción a eventos de notificaciones establecida');
    } catch (error: any) {
      logger.error('Error al suscribirse a eventos de notificaciones:', error);
    }
  }

  /**
   * Suscribe a eventos relacionados con interacciones sociales
   */
  private async suscribirseAEventosSociales(): Promise<void> {
    try {
      const conector = obtenerConectorRabbitMQ(this.NOMBRE_SERVICIO);
      await conector.suscribirse(
        this.MAPEO_COLAS.sociales,
        ['social.*'],
        (mensaje, claveEnrutamiento) => this.procesarEventoSocial(mensaje, claveEnrutamiento)
      );
      logger.info('Suscripción a eventos sociales establecida');
    } catch (error: any) {
      logger.error('Error al suscribirse a eventos sociales:', error);
    }
  }

  /**
   * Suscribe a eventos relacionados con usuarios
   */
  private async suscribirseAEventosUsuarios(): Promise<void> {
    try {
      const conector = obtenerConectorRabbitMQ(this.NOMBRE_SERVICIO);
      await conector.suscribirse(
        this.MAPEO_COLAS.usuarios,
        ['usuarios.*'],
        (mensaje, claveEnrutamiento) => this.procesarEventoUsuario(mensaje, claveEnrutamiento)
      );
      logger.info('Suscripción a eventos de usuarios establecida');
    } catch (error: any) {
      logger.error('Error al suscribirse a eventos de usuarios:', error);
    }
  }

  /**
   * Suscribe a eventos relacionados con autenticación
   */
  private async suscribirseAEventosAutenticacion(): Promise<void> {
    try {
      // Para eventos de autenticación usamos los mismos que de usuario
      // pero filtramos solo los relacionados con sesión
      const tiposAutenticacion = [
        TipoEvento.USUARIO_INICIADO_SESION,
        TipoEvento.USUARIO_CERRADO_SESION,
        TipoEvento.USUARIO_CAMBIO_PASSWORD
      ];

      const conector = obtenerConectorRabbitMQ(this.NOMBRE_SERVICIO);
      await conector.suscribirse(
        this.MAPEO_COLAS.autenticacion,
        ['autenticacion.*'],
        (mensaje, claveEnrutamiento) => this.procesarEventoAutenticacion(mensaje, claveEnrutamiento)
      );
      logger.info('Suscripción a eventos de autenticación establecida');
    } catch (error: any) {
      logger.error('Error al suscribirse a eventos de autenticación:', error);
    }
  }

  /**
   * Suscribe a todos los eventos del sistema (opcional)
   */
  private async suscribirseATodosLosEventos(): Promise<string> {
    try {
      // Agregamos una propiedad para esta cola específica
      const COLA_TODOS_EVENTOS = 'mapyourworld_api-gateway_eventos_todos';
      
      const conector = obtenerConectorRabbitMQ(this.NOMBRE_SERVICIO);
      const idSuscripcion = await conector.suscribirse(
        this.NOMBRE_COLA_EVENTOS,
        ['#'], // Comodín para todos los eventos
        (mensaje, claveEnrutamiento) => this.procesarEvento(mensaje, claveEnrutamiento)
      );

      logger.info('Suscripción a todos los eventos establecida');
      return idSuscripcion;
    } catch (error: any) {
      logger.error('Error al suscribirse a todos los eventos:', error);
      throw error;
    }
  }

  /**
   * Verifica y procesa un mensaje de evento recibido
   * 
   * @param mensaje Mensaje de evento recibido
   * @param claveEnrutamiento Clave de enrutamiento del mensaje
   * @returns true si el mensaje fue procesado correctamente
   */
  private verificarYProcesarMensaje(mensaje: MensajeEvento, claveEnrutamiento: string): boolean {
    // Verificar integridad y validez del mensaje
    if (!eventSecurityService.validarMensaje(mensaje)) {
      logger.warn(`Mensaje de evento inválido rechazado: ${mensaje.tipo}`, {
        claveEnrutamiento,
        servicio: mensaje.metadatos?.servicioOrigen
      });
      return false;
    }

    // Registrar recepción del evento
    logger.info(`Evento recibido y validado: ${mensaje.tipo}`, {
      servicio: mensaje.metadatos.servicioOrigen,
      timestamp: new Date(mensaje.metadatos.timestamp).toISOString()
    });

    return true;
  }

  /**
   * Procesa un evento de mapa
   */
  private async procesarEventoMapa(mensaje: MensajeEvento, claveEnrutamiento: string): Promise<void> {
    // Verificar evento antes de procesar
    if (!this.verificarYProcesarMensaje(mensaje, claveEnrutamiento)) {
      return;
    }

    logger.info(`Procesando evento de mapa: ${mensaje.tipo}`, {
      tipoEvento: mensaje.tipo,
      metadatos: mensaje.metadatos
    });

    // Implementar lógica específica según el tipo de evento
    switch (mensaje.tipo.toString()) {
      case TipoEvento.MAPA_CREADO:
        // Lógica para mapa creado
        break;
      case TipoEvento.MAPA_ACTUALIZADO:
        // Lógica para mapa actualizado
        break;
      case TipoEvento.MAPA_VISUALIZADO:
        // Lógica para mapa visualizado (ej. actualizar estadísticas)
        break;
      default:
        // Lógica por defecto para otros eventos de mapas
        break;
    }
  }

  /**
   * Procesa un evento de notificación
   */
  private async procesarEventoNotificacion(mensaje: MensajeEvento, claveEnrutamiento: string): Promise<void> {
    // Verificar evento antes de procesar
    if (!this.verificarYProcesarMensaje(mensaje, claveEnrutamiento)) {
      return;
    }

    logger.info(`Procesando evento de notificación: ${mensaje.tipo}`, {
      tipoEvento: mensaje.tipo,
      metadatos: mensaje.metadatos
    });

    // Implementar lógica específica según el tipo de evento
    switch (mensaje.tipo.toString()) {
      case TipoEvento.NOTIFICACION_CREADA:
        // Lógica para notificación creada (ej. enviar al cliente)
        break;
      case TipoEvento.NOTIFICACION_ENVIADA:
        // Lógica para notificación enviada
        break;
      default:
        // Lógica por defecto para otros eventos de notificaciones
        break;
    }
  }

  /**
   * Procesa un evento social
   */
  private async procesarEventoSocial(mensaje: MensajeEvento, claveEnrutamiento: string): Promise<void> {
    // Verificar evento antes de procesar
    if (!this.verificarYProcesarMensaje(mensaje, claveEnrutamiento)) {
      return;
    }

    logger.info(`Procesando evento social: ${mensaje.tipo}`, {
      tipoEvento: mensaje.tipo,
      metadatos: mensaje.metadatos
    });

    // Implementar lógica específica según el tipo de evento
    switch (mensaje.tipo.toString()) {
      case TipoEvento.SOCIAL_COMENTARIO_CREADO:
        // Lógica para comentario creado
        break;
      case TipoEvento.SOCIAL_ME_GUSTA_CREADO:
        // Lógica para me gusta
        break;
      default:
        // Lógica por defecto para otros eventos sociales
        break;
    }
  }

  /**
   * Procesa un evento de usuario
   */
  private async procesarEventoUsuario(mensaje: MensajeEvento, claveEnrutamiento: string): Promise<void> {
    // Verificar evento antes de procesar
    if (!this.verificarYProcesarMensaje(mensaje, claveEnrutamiento)) {
      return;
    }

    logger.info(`Procesando evento de usuario: ${mensaje.tipo}`, {
      tipoEvento: mensaje.tipo,
      metadatos: mensaje.metadatos
    });

    // Implementar lógica específica según el tipo de evento
    switch (mensaje.tipo.toString()) {
      case TipoEvento.USUARIO_CREADO:
        // Lógica para usuario creado
        break;
      case TipoEvento.USUARIO_ACTUALIZADO:
        // Lógica para usuario actualizado
        break;
      default:
        // Lógica por defecto para otros eventos de usuarios
        break;
    }
  }

  /**
   * Procesa un evento de autenticación
   */
  private async procesarEventoAutenticacion(mensaje: MensajeEvento, claveEnrutamiento: string): Promise<void> {
    // Verificar evento antes de procesar
    if (!this.verificarYProcesarMensaje(mensaje, claveEnrutamiento)) {
      return;
    }

    logger.info(`Procesando evento de autenticación: ${mensaje.tipo}`, {
      tipoEvento: mensaje.tipo,
      metadatos: mensaje.metadatos
    });

    // Implementar lógica específica según el tipo de evento
    switch (mensaje.tipo.toString()) {
      case TipoEvento.USUARIO_INICIADO_SESION:
        // Lógica para inicio de sesión
        break;
      case TipoEvento.USUARIO_CERRADO_SESION:
        // Lógica para cierre de sesión
        break;
      case TipoEvento.USUARIO_CAMBIO_PASSWORD:
        // Lógica para cambio de contraseña
        break;
      default:
        // Lógica por defecto para otros eventos de autenticación
        break;
    }
  }

  /**
   * Procesa cualquier tipo de evento (genérico)
   */
  private async procesarEvento(mensaje: MensajeEvento, claveEnrutamiento: string): Promise<void> {
    // Verificar evento antes de procesar
    if (!this.verificarYProcesarMensaje(mensaje, claveEnrutamiento)) {
      return;
    }

    logger.info(`Procesando evento genérico: ${mensaje.tipo}`, {
      tipoEvento: mensaje.tipo,
      claveEnrutamiento,
      metadatos: mensaje.metadatos
    });

    // Derivar a procesadores específicos según la categoría
    const tipoEvento = mensaje.tipo.toString();
    
    if (tipoEvento.startsWith('mapa.')) {
      await this.procesarEventoMapa(mensaje, claveEnrutamiento);
    } else if (tipoEvento.startsWith('notificacion.')) {
      await this.procesarEventoNotificacion(mensaje, claveEnrutamiento);
    } else if (tipoEvento.startsWith('social.')) {
      await this.procesarEventoSocial(mensaje, claveEnrutamiento);
    } else if (tipoEvento.startsWith('usuario.')) {
      await this.procesarEventoUsuario(mensaje, claveEnrutamiento);
    } else if (tipoEvento.startsWith('auth.')) {
      await this.procesarEventoAutenticacion(mensaje, claveEnrutamiento);
    } else {
      logger.debug(`Evento de tipo desconocido: ${tipoEvento}`, {
        datos: mensaje.datos
      });
    }
  }

  /**
   * Detiene el servicio de eventos y cierra las conexiones
   */
  public async detener(): Promise<void> {
    if (!this.iniciado) return;

    try {
      logger.info('Deteniendo servicio de gestión de eventos...');
      
      // Desconectar RabbitMQ
      await detenerRabbitMQ(this.NOMBRE_SERVICIO);
      
      this.suscripciones = [];
      this.iniciado = false;
      logger.info('Servicio de eventos detenido correctamente');
    } catch (error: any) {
      logger.error('Error al detener el servicio de eventos:', error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
export const eventHandlerService = new EventHandlerService(); 