/**
 * Hook para gestionar la funcionalidad del mapa interactivo
 * Proporciona funciones para manejar distritos, POIs y la posición del usuario
 */

import { useState, useEffect, useCallback } from 'react';

interface MapPosition {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface District {
  id: string;
  name: string;
  boundaries: any; // GeoJSON
  unlocked: boolean;
  pointsOfInterest: number;
  discoveryPercentage: number;
}

interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  category: string;
  visited: boolean;
  districtId: string;
}

export const useMap = () => {
  const [position, setPosition] = useState<MapPosition>({
    latitude: 37.389091, // Sevilla por defecto
    longitude: -5.984459,
    zoom: 12,
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Inicializa el mapa y carga los distritos iniciales
   */
  const initializeMap = useCallback(async () => {
    // TODO: Implementar inicialización del mapa
    // 1. Obtener posición del usuario con geolocalización
    // 2. Cargar distritos desde la API
    // 3. Determinar distritos desbloqueados por el usuario
    // 4. Centrar mapa en posición del usuario o posición predeterminada
  }, []);

  /**
   * Actualiza la posición del mapa
   */
  const updateMapPosition = useCallback((newPosition: Partial<MapPosition>) => {
    // TODO: Implementar actualización de posición
    // 1. Actualizar estado de posición con los valores proporcionados
    // 2. Validar límites de zoom
    // 3. Opcionalmente cargar nuevos datos basados en la posición
    setPosition(prev => ({ ...prev, ...newPosition }));
  }, []);

  /**
   * Carga los puntos de interés para un distrito seleccionado
   */
  const loadPointsOfInterest = useCallback(async (districtId: string) => {
    // TODO: Implementar carga de POIs
    // 1. Marcar como cargando
    // 2. Hacer petición a la API
    // 3. Actualizar estado con los POIs recibidos
    // 4. Marcar cuáles han sido visitados por el usuario
  }, []);

  /**
   * Selecciona un distrito y carga sus detalles
   */
  const selectDistrict = useCallback(async (districtId: string) => {
    // TODO: Implementar selección de distrito
    // 1. Buscar distrito en la lista actual
    // 2. Cargar detalles adicionales si es necesario
    // 3. Cargar puntos de interés del distrito
    // 4. Actualizar estado de distrito seleccionado
  }, []);

  /**
   * Registra visita a un punto de interés
   */
  const visitPointOfInterest = useCallback(async (poiId: string) => {
    // TODO: Implementar registro de visita
    // 1. Verificar proximidad del usuario al POI
    // 2. Enviar solicitud a la API para registrar visita
    // 3. Actualizar estado local para marcar como visitado
    // 4. Actualizar porcentaje de descubrimiento del distrito
  }, []);

  /**
   * Actualiza la ubicación actual del usuario
   */
  const updateUserLocation = useCallback(async () => {
    // TODO: Implementar actualización de ubicación
    // 1. Obtener posición actual con navigator.geolocation
    // 2. Actualizar estado con la nueva ubicación
    // 3. Verificar si hay POIs cercanos para notificar
  }, []);

  // Inicialización
  useEffect(() => {
    initializeMap().catch(err => {
      setError('Error al inicializar el mapa');
      console.error(err);
    });

    // Establecer intervalo para actualizar posición del usuario
    const locationInterval = setInterval(updateUserLocation, 30000);
    return () => clearInterval(locationInterval);
  }, [initializeMap, updateUserLocation]);

  return {
    position,
    districts,
    selectedDistrict,
    pointsOfInterest,
    userLocation,
    isLoading,
    error,
    updateMapPosition,
    selectDistrict,
    visitPointOfInterest,
    updateUserLocation
  };
}; 