import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Constante para activar/desactivar el modo debug
// true = siempre muestra el banner de cookies para debug
// false = comportamiento normal en producción
export const DEBUG_MODE = false;

// Definir nombres de cookies
export const COOKIE_NAMES = {
  cookieConsent: 'mapyourworld_cookie_consent',
  analyticsConsent: 'mapyourworld_analytics_consent',
  marketingConsent: 'mapyourworld_marketing_consent',
  preferencesConsent: 'mapyourworld_preferences_consent',
  // Se pueden añadir más cookies aquí mandriles
  debugMode: 'mapyourworld_debug_mode',
  
};

// Configuración de cookies para web
export const COOKIE_CONFIG = {
  path: '/',
  maxAge: 365 * 24 * 60 * 60, // 1 año en segundos
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

// Tipos de cookies que se pueden seleccionar
export type CookieType = 'essential' | 'analytics' | 'marketing' | 'preferences';

// Opciones de consentimiento de cookies
export type CookieConsentOptions = {
  essential: boolean; // Siempre true, no se puede rechazar
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

// Consentimiento por defecto (sólo cookies esenciales)
export const DEFAULT_CONSENT: CookieConsentOptions = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false
};

/**
 * Establece una cookie (o valor en AsyncStorage para móvil)
 * @param name Nombre de la cookie
 * @param value Valor de la cookie
 * @param options Opciones adicionales para la cookie (solo web)
 */
export const setCookie = async (name: string, value: string, options: any = {}): Promise<void> => {
  if (Platform.OS === 'web') {
    // Configuración para web - usa cookies del navegador
    const cookieOptions = {
      ...COOKIE_CONFIG,
      ...options
    };
    
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (cookieOptions.maxAge) {
      cookieString += `; max-age=${cookieOptions.maxAge}`;
    }
    
    if (cookieOptions.path) {
      cookieString += `; path=${cookieOptions.path}`;
    }
    
    if (cookieOptions.secure) {
      cookieString += '; secure';
    }
    
    if (cookieOptions.sameSite) {
      cookieString += `; samesite=${cookieOptions.sameSite}`;
    }
    
    document.cookie = cookieString;
  } else {
    // Configuración para móvil - usa AsyncStorage
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error('Error al guardar cookie en AsyncStorage:', error);
      throw error;
    }
  }
};

/**
 * Obtiene el valor de una cookie (o valor en AsyncStorage para móvil)
 * @param name Nombre de la cookie
 * @returns Valor de la cookie o null si no existe
 */
export const getCookie = async (name: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    // Para web - usa cookies del navegador
    const nameEQ = `${encodeURIComponent(name)}=`;
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    
    return null;
  } else {
    // Para móvil - usa AsyncStorage
    try {
      return await AsyncStorage.getItem(name);
    } catch (error) {
      console.error('Error al leer cookie de AsyncStorage:', error);
      return null;
    }
  }
};

/**
 * Elimina una cookie (o valor en AsyncStorage para móvil)
 * @param name Nombre de la cookie
 */
export const removeCookie = async (name: string): Promise<void> => {
  if (Platform.OS === 'web') {
    // Para web - elimina cookie del navegador
    document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=/`;
  } else {
    // Para móvil - elimina de AsyncStorage
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('Error al eliminar cookie de AsyncStorage:', error);
      throw error;
    }
  }
};

/**
 * Activa o desactiva el modo debug para las cookies
 * En modo debug, el banner siempre se mostrará independientemente de si se han aceptado o no
 * @param enabled true para activar, false para desactivar
 */
export const setDebugMode = async (enabled: boolean): Promise<void> => {
  await setCookie(COOKIE_NAMES.debugMode, enabled.toString());
};

/**
 * Verifica si el modo debug está activado
 * @returns true si el modo debug está activado, false en caso contrario
 */
export const isDebugMode = async (): Promise<boolean> => {
  return await getCookie(COOKIE_NAMES.debugMode) === 'true';
};

/**
 * Obtiene las opciones de consentimiento de cookies actuales
 * @returns Opciones de consentimiento de cookies o null si no hay consentimiento guardado
 */
export const getCookieConsentOptions = async (): Promise<CookieConsentOptions | null> => {
  const hasConsent = await getCookie(COOKIE_NAMES.cookieConsent);
  
  if (hasConsent === null) {
    return null;
  }
  
  // Las cookies esenciales siempre están activadas
  const options: CookieConsentOptions = {
    essential: true,
    analytics: await getCookie(COOKIE_NAMES.analyticsConsent) === 'true',
    marketing: await getCookie(COOKIE_NAMES.marketingConsent) === 'true',
    preferences: await getCookie(COOKIE_NAMES.preferencesConsent) === 'true'
  };
  
  return options;
};

/**
 * Comprueba si el usuario ha aceptado las cookies
 * @returns true si el usuario ha dado algún consentimiento, false si ha rechazado todo, null si no ha decidido aún
 */
export const hasCookieConsent = async (): Promise<boolean | null> => {
  // En modo debug, actuar como si no hubiera consentimiento todavía
  const debugMode = await isDebugMode();
  if (debugMode) {
    return null;
  }
  
  const consent = await getCookie(COOKIE_NAMES.cookieConsent);
  
  if (consent === null) {
    return null;
  }
  
  return consent === 'true';
};

/**
 * Establece el consentimiento de cookies
 * @param options Opciones de consentimiento de cookies
 */
export const setCookieConsentOptions = async (options: CookieConsentOptions): Promise<void> => {
  // Marcar que el usuario ha tomado una decisión
  await setCookie(COOKIE_NAMES.cookieConsent, 'true');
  
  // Guardar cada tipo de consentimiento
  await setCookie(COOKIE_NAMES.analyticsConsent, options.analytics.toString());
  await setCookie(COOKIE_NAMES.marketingConsent, options.marketing.toString());
  await setCookie(COOKIE_NAMES.preferencesConsent, options.preferences.toString());
};

/**
 * Elimina todas las cookies de consentimiento
 * Útil para testing y debug
 */
export const resetAllCookies = async (): Promise<void> => {
  await removeCookie(COOKIE_NAMES.cookieConsent);
  await removeCookie(COOKIE_NAMES.analyticsConsent);
  await removeCookie(COOKIE_NAMES.marketingConsent);
  await removeCookie(COOKIE_NAMES.preferencesConsent);
};

/**
 * Establece el consentimiento de cookies (versión simple)
 * @param accepted true si se aceptan todas las cookies, false si solo las esenciales
 */
export const setCookieConsent = async (accepted: boolean): Promise<void> => {
  if (accepted) {
    // Aceptar todas
    await setCookieConsentOptions({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  } else {
    // Sólo esenciales
    await setCookieConsentOptions({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  }
}; 