import { API_URL } from '../constants/config';

/**
 * Servicio centralizado para realizar peticiones HTTP
 */
export const api = {
  /**
   * Realiza una petición GET
   */
  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  /**
   * Realiza una petición POST
   */
  async post(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  /**
   * Realiza una petición PUT
   */
  async put(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  },

  /**
   * Realiza una petición DELETE
   */
  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },

  /**
   * Función base para realizar peticiones HTTP
   */
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    console.log(`📡 ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`❌ Error en fetch a ${endpoint}:`, error);
      throw error;
    }
  }
};

export default api;