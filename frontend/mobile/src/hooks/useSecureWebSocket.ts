/**
 * Hook personalizado para gestionar conexiones WebSocket seguras
 * Proporciona cifrado, reconexión automática y manejo de autenticación
 */

import { useState, useEffect, useCallback, useRef } from 'react';
// Importamos socket.io-client utilizando una importación dinámica
import io from 'socket.io-client';
import { encryptAES, decryptAES } from '@frontend/web/src/utils/crypto';

// Definimos un tipo básico para Socket que funcione con nuestra versión
interface SocketType {
  id?: string;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
}

// Opciones para la conexión WebSocket
interface UseSecureWebSocketOptions {
  url: string;                    // URL del servidor WebSocket
  path?: string;                  // Ruta para la conexión (por defecto: /ws)
  autoConnect?: boolean;          // Conectar automáticamente al montar
  reconnectionAttempts?: number;  // Número de intentos de reconexión
  reconnectionDelay?: number;     // Retraso entre intentos de reconexión (ms)
  auth?: {                        // Datos de autenticación
    token?: string;               // Token JWT
  };
}

// Estado de la conexión WebSocket
interface WebSocketState {
  isConnected: boolean;          // Estado de conexión
  isAuthenticated: boolean;      // Estado de autenticación
  isEncrypted: boolean;          // Si la conexión está cifrada
  error: Error | null;           // Error de conexión, si lo hay
  connectionAttempts: number;    // Número de intentos de conexión
  socketId: string | null;       // ID único del socket
}

// Resultado devuelto por el hook
interface UseSecureWebSocketResult {
  socket: SocketType | null;      // Objeto Socket.io
  state: WebSocketState;          // Estado actual de la conexión
  connect: () => void;            // Función para conectar manualmente
  disconnect: () => void;         // Función para desconectar manualmente
  send: (event: string, data: any) => void;  // Enviar mensaje cifrado
  subscribe: (event: string, callback: (data: any) => void) => () => void;  // Suscripción a eventos
}

/**
 * Hook para gestionar conexiones WebSocket seguras con autenticación y cifrado
 * @param options Opciones de configuración del WebSocket
 * @returns Estado y métodos para interactuar con el WebSocket
 */
export function useSecureWebSocket(options: UseSecureWebSocketOptions): UseSecureWebSocketResult {
  // Referencias para mantener objetos entre renderizados
  const socketRef = useRef<SocketType | null>(null);
  const encryptionKeyRef = useRef<string | null>(null);
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  
  // Estado de la conexión
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isAuthenticated: false,
    isEncrypted: false,
    error: null,
    connectionAttempts: 0,
    socketId: null
  });

  // Función para conectar al WebSocket
  const connect = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      return; // Ya está conectado
    }

    // Crear nueva conexión
    try {
      const socket = io(options.url, {
        path: options.path || '/ws',
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: options.reconnectionAttempts || 5,
        reconnectionDelay: options.reconnectionDelay || 3000,
        auth: options.auth
      });

      // Manejar evento de conexión
      socket.on('connect', () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          socketId: socket.id || null
        }));
        
        // Si hay un token, enviar para autenticación
        if (options.auth?.token) {
          socket.emit('authenticate', { token: options.auth.token });
        }
      });
      
      // Manejar evento de desconexión
      socket.on('disconnect', (reason: string) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isAuthenticated: false,
          isEncrypted: false
        }));
      });
      
      // Manejar errores de conexión
      socket.on('connect_error', (error: Error) => {
        setState(prev => ({
          ...prev,
          isConnected: false,
          error,
          connectionAttempts: prev.connectionAttempts + 1
        }));
      });
      
      // Recibir clave de cifrado
      socket.on('encryption:key', (data: { key: string }) => {
        encryptionKeyRef.current = data.key;
        
        setState(prev => ({
          ...prev,
          isEncrypted: true
        }));
      });
      
      // Confirmar conexión exitosa
      socket.on('connection:success', (data: { user: any }) => {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          error: null
        }));
      });

      // Guardar referencia y conectar
      socketRef.current = socket;
      socket.connect();
      
      // Actualizar número de intento
      setState(prev => ({
        ...prev,
        connectionAttempts: prev.connectionAttempts + 1
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
        connectionAttempts: prev.connectionAttempts + 1
      }));
    }
  }, [options]);

  // Función para desconectar del WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      
      setState({
        isConnected: false,
        isAuthenticated: false,
        isEncrypted: false,
        error: null,
        connectionAttempts: 0,
        socketId: null
      });
    }
  }, []);

  // Función para enviar mensajes cifrados
  const send = useCallback((event: string, data: any) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn('No hay conexión WebSocket activa');
      return;
    }

    try {
      // Cifrar datos si está habilitado el cifrado
      if (state.isEncrypted && encryptionKeyRef.current) {
        const encryptedData = encryptAES(JSON.stringify(data), encryptionKeyRef.current);
        socketRef.current.emit(event, { encrypted: true, data: encryptedData });
      } else {
        socketRef.current.emit(event, data);
      }
    } catch (error) {
      console.error('Error al enviar mensaje por WebSocket:', error);
    }
  }, [state.isEncrypted]);

  // Función para suscribirse a eventos
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!socketRef.current) {
      return () => { 
        // Función vacía para cancelar la suscripción cuando no hay socket
        console.debug('No hay socket activo para cancelar suscripción');
      };
    }

    // Obtener o crear conjunto de listeners para este evento
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
      
      // Establecer handler del socket para este evento
      socketRef.current.on(event, (rawData: any) => {
        let processedData = rawData;
        
        // Descifrar datos si es necesario
        if (rawData && rawData.encrypted && encryptionKeyRef.current) {
          try {
            const decryptedString = decryptAES(rawData.data, encryptionKeyRef.current);
            processedData = JSON.parse(decryptedString);
          } catch (error) {
            console.error(`Error al descifrar datos del evento ${event}:`, error);
            return;
          }
        }
        
        // Notificar a todos los listeners
        const listeners = listenersRef.current.get(event);
        if (listeners) {
          listeners.forEach(listener => {
            try {
              listener(processedData);
            } catch (error) {
              console.error(`Error en listener del evento ${event}:`, error);
            }
          });
        }
      });
    }
    
    // Agregar callback al conjunto de listeners
    const listeners = listenersRef.current.get(event);
    if (listeners) {
      listeners.add(callback);
    }
    
    // Devolver función para cancelar la suscripción
    return () => {
      const listeners = listenersRef.current.get(event);
      if (listeners) {
        listeners.delete(callback);
        
        // Si no quedan listeners, eliminar el handler
        if (listeners.size === 0 && socketRef.current) {
          socketRef.current.off(event);
          listenersRef.current.delete(event);
        }
      }
    };
  }, []);

  // Conectar automáticamente si está habilitado
  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }
    
    // Limpiar al desmontar
    return () => {
      disconnect();
    };
  }, [connect, disconnect, options.autoConnect]);

  // Devolver estado y métodos
  return {
    socket: socketRef.current,
    state,
    connect,
    disconnect,
    send,
    subscribe
  };
} 