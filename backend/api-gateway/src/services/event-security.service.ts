/**
 * @fileoverview Servicio de seguridad para la comunicación de eventos
 * 
 * Este servicio proporciona funciones para validar, cifrar y descifrar
 * mensajes en el sistema de eventos, asegurando la integridad y confidencialidad.
 * 
 * @module EventSecurityService
 */

import crypto from 'crypto';
import { MensajeEvento, TipoEvento } from '../models/rabbit-mq';
import { logger } from '../utils/logger';

// Claves para encriptación (en producción deberían estar en variables de entorno)
const ENCRYPTION_KEY = process.env.EVENT_ENCRYPTION_KEY || 'mapyourworld-event-encryption-key-32b';
const HMAC_KEY = process.env.EVENT_HMAC_KEY || 'mapyourworld-event-hmac-key-2023';

/**
 * Servicio para gestionar la seguridad de los eventos
 */
export class EventSecurityService {
  // Algoritmo de encriptación
  private readonly algorithm = 'aes-256-cbc';
  
  /**
   * Valida que un mensaje de evento sea válido y no haya sido manipulado
   * 
   * @param mensaje - Mensaje a validar
   * @returns true si el mensaje es válido
   */
  public validarMensaje(mensaje: MensajeEvento): boolean {
    try {
      // Verificar que tiene todos los campos requeridos
      if (!mensaje.tipo || !mensaje.datos || !mensaje.metadatos) {
        logger.warn('Mensaje de evento inválido: faltan campos requeridos');
        return false;
      }
      
      // Verificar que el tipo de evento es válido
      if (!this.esTipoEventoValido(mensaje.tipo.toString())) {
        logger.warn(`Tipo de evento inválido: ${mensaje.tipo}`);
        return false;
      }
      
      // Verificar que los metadatos contienen información requerida
      if (!mensaje.metadatos.timestamp || !mensaje.metadatos.servicioOrigen) {
        logger.warn('Metadatos del evento incompletos');
        return false;
      }
      
      // Verificar que el timestamp es razonable (no futuro, no demasiado viejo)
      const ahora = Date.now();
      const tiempoMaximo = 1000 * 60 * 60; // 1 hora
      if (mensaje.metadatos.timestamp > ahora || mensaje.metadatos.timestamp < (ahora - tiempoMaximo)) {
        logger.warn(`Timestamp del evento fuera de rango: ${mensaje.metadatos.timestamp}`);
        return false;
      }
      
      return true;
    } catch (error: any) {
      logger.error('Error al validar mensaje de evento:', error);
      return false;
    }
  }
  
  /**
   * Cifra los datos de un mensaje para su transmisión segura
   * 
   * @param datos - Datos a cifrar
   * @returns Datos cifrados con su vector de inicialización
   */
  public cifrarDatos(datos: any): { contenidoCifrado: string, iv: string } {
    try {
      // Generar vector de inicialización
      const iv = crypto.randomBytes(16);
      
      // Crear cipher con algoritmo, clave y vector
      const cipher = crypto.createCipheriv(
        this.algorithm, 
        Buffer.from(ENCRYPTION_KEY), 
        iv
      );
      
      // Cifrar los datos
      const datosString = JSON.stringify(datos);
      let contenidoCifrado = cipher.update(datosString, 'utf8', 'hex');
      contenidoCifrado += cipher.final('hex');
      
      return {
        contenidoCifrado,
        iv: iv.toString('hex')
      };
    } catch (error: any) {
      logger.error('Error al cifrar datos de evento:', error);
      throw new Error(`Error al cifrar datos: ${error.message}`);
    }
  }
  
  /**
   * Descifra datos de un mensaje
   * 
   * @param contenidoCifrado - Contenido cifrado en hexadecimal
   * @param iv - Vector de inicialización en hexadecimal
   * @returns Datos originales descifrados
   */
  public descifrarDatos(contenidoCifrado: string, iv: string): any {
    try {
      // Crear decipher con algoritmo, clave y vector
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(ENCRYPTION_KEY),
        Buffer.from(iv, 'hex')
      );
      
      // Descifrar los datos
      let contenidoDescifrado = decipher.update(contenidoCifrado, 'hex', 'utf8');
      contenidoDescifrado += decipher.final('utf8');
      
      // Parsear a objeto
      return JSON.parse(contenidoDescifrado);
    } catch (error: any) {
      logger.error('Error al descifrar datos de evento:', error);
      throw new Error(`Error al descifrar datos: ${error.message}`);
    }
  }
  
  /**
   * Genera un firma HMAC para verificar la integridad del mensaje
   * 
   * @param mensaje - Mensaje para el que generar la firma
   * @returns Firma HMAC en hexadecimal
   */
  public generarFirma(mensaje: Omit<MensajeEvento, 'firma'>): string {
    try {
      const contenido = JSON.stringify({
        tipo: mensaje.tipo,
        datos: mensaje.datos,
        metadatos: mensaje.metadatos
      });
      
      const hmac = crypto.createHmac('sha256', HMAC_KEY);
      hmac.update(contenido);
      return hmac.digest('hex');
    } catch (error: any) {
      logger.error('Error al generar firma HMAC:', error);
      throw new Error(`Error al generar firma: ${error.message}`);
    }
  }
  
  /**
   * Verifica la firma HMAC de un mensaje
   * 
   * @param mensaje - Mensaje con firma a verificar
   * @param firma - Firma HMAC a verificar
   * @returns true si la firma es válida
   */
  public verificarFirma(mensaje: Omit<MensajeEvento, 'firma'>, firma: string): boolean {
    try {
      const firmaCalculada = this.generarFirma(mensaje);
      return crypto.timingSafeEqual(
        Buffer.from(firmaCalculada, 'hex'),
        Buffer.from(firma, 'hex')
      );
    } catch (error: any) {
      logger.error('Error al verificar firma HMAC:', error);
      return false;
    }
  }
  
  /**
   * Verifica si un tipo de evento es válido según la enumeración
   * 
   * @param tipo - Tipo de evento a verificar
   * @returns true si es un tipo de evento válido
   */
  private esTipoEventoValido(tipo: string): boolean {
    return Object.values(TipoEvento).includes(tipo as TipoEvento);
  }
}

// Exportar una instancia única del servicio
export const eventSecurityService = new EventSecurityService(); 