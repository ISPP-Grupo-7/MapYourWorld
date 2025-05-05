import { API_URL } from '@/constants/config';

// Modelo de logros según plantilla
export interface AchievementTemplate {
  id: string;
  name: string;
  description: string;
  points: number;
  iconUrl: string;
}

// Modelo de estadísticas de usuario
export interface Stats {
  achievements: number;
  friends: number;
  createdPOI: number;
  unlockedDistricts: number;
  collabMaps: number;
  loginStreak: number;  // días consecutivos
}

// Lista estática de plantillas de logros
const allAchievements: AchievementTemplate[] = [
  { id: "0e6bfcb2-350a-4c98-9195-9ec6b516e390", name: "Explorador Novato", description: "Crea tu primer punto de interés.", points: 10, iconUrl: "https://images.pexels.com/photos/1051077/pexels-photo-1051077.jpeg" },
  { id: "288930cb-27c2-4340-910b-3f2ffcc914dd", name: "Cartógrafo Aficionado", description: "Crea 10 puntos de interés.", points: 50, iconUrl: "https://images.pexels.com/photos/8869349/pexels-photo-8869349.jpeg" },
  { id: "8693fa93-723b-45c5-8392-662f73566787", name: "Maestro del Mapa", description: "Crea 50 puntos de interés.", points: 250, iconUrl: "https://images.pexels.com/photos/7634707/pexels-photo-7634707.jpeg" },
  { id: "c1339ed7-60d5-4027-9220-42df6d30d3f8", name: "Conector Social", description: "Haz tu primer amigo.", points: 15, iconUrl: "https://images.pexels.com/photos/9353433/pexels-photo-9353433.jpeg" },
  { id: "96bbe1f5-3e3c-4277-8113-9cdf8c8eaf2b", name: "Círculo de Amigos", description: "Haz 10 amigos.", points: 75, iconUrl: "https://images.pexels.com/photos/7968883/pexels-photo-7968883.jpeg" },
  { id: "295f40ea-bca7-4e35-911c-b217b6dec467", name: "Red Social", description: "Haz 50 amigos.", points: 400, iconUrl: "https://images.pexels.com/photos/10431338/pexels-photo-10431338.jpeg" },
  { id: "03d762f3-7701-4a87-a4d5-77f37330b506", name: "Primeros pasos", description: "Acumula 1 kilómetro de distancia.", points: 20, iconUrl: "https://images.pexels.com/photos/3601094/pexels-photo-3601094.jpeg" },
  { id: "b1b2d415-69c8-4b73-8e80-94fe825afcc0", name: "Maratonista Urbano", description: "Acumula 50 kilómetros de distancia.", points: 150, iconUrl: "https://images.pexels.com/photos/1526790/pexels-photo-1526790.jpeg" },
  { id: "5e99b4ec-c150-4de3-a83c-f1573d77b4de", name: "Explorador Incansable", description: "Acumula 200 kilómetros de distancia.", points: 750, iconUrl: "https://images.pexels.com/photos/421160/pexels-photo-421160.jpeg" },
  { id: "3cec81ea-6160-4188-9ffc-6610ba90e9a1", name: "Racha Inicial", description: "Inicia sesión 3 días consecutivos.", points: 25, iconUrl: "https://images.pexels.com/photos/4350099/pexels-photo-4350099.jpeg" },
  { id: "d17553e9-5308-4fa0-9b04-be015186ff9f", name: "Racha Semanal", description: "Inicia sesión 7 días consecutivos.", points: 100, iconUrl: "https://images.pexels.com/photos/2265488/pexels-photo-2265488.jpeg" },
  { id: "238e196c-bd6e-4413-9329-71e7a9753a70", name: "Racha Mensual", description: "Inicia sesión 30 días consecutivos.", points: 500, iconUrl: "https://images.pexels.com/photos/31525462/pexels-photo-31525462.jpeg" },
  { id: "d2158135-5532-4f84-a00a-30b80a140e0d", name: "Pinta tu barrio", description: "Desbloquea 5 distritos", points: 10, iconUrl: "https://images.pexels.com/photos/833317/pexels-photo-833317.jpeg" },
  { id: "63cfb5ab-521b-4cf5-8b85-2621cc66e6a1", name: "Pinta tu ciudad", description: "Desbloquea 10 distritos", points: 100, iconUrl: "https://images.pexels.com/photos/17184744/pexels-photo-17184744/free-photo-of-paisaje-punto-de-referencia-direccion-viaje.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" },
  { id: "c143e814-f717-45f7-83d3-ceed567e8d05", name: "Colorea el mundo", description: "Desbloquea 50 distritos", points: 500, iconUrl: "https://images.pexels.com/photos/7235908/pexels-photo-7235908.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" },
  { id: "3c5728a0-de4b-4c51-8d9d-636b36f69618", name: "Todo es mas facil en grupo", description: "Participa en un mapa colaborativo", points: 50, iconUrl: "https://images.pexels.com/photos/9292812/pexels-photo-9292812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" },
  
];

const logroDesbloquea10logros= { id: "7d0ff8fc-cb93-4c5b-a02b-9a1bafcdd33d", name: "Campeon", description: "Desbloquea 10 logros", points: 500, iconUrl: "https://images.pexels.com/photos/3813341/pexels-photo-3813341.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" }  

// Resultado final que el Screen consumirá
export interface TransformedAchievement {
  name: string;
  description: string;
  points: number;
  iconUrl: string;
}

export class AchievementUtils {
  /**
   * Devuelve la lista de logros desbloqueados para un usuario
   * @param userId ID del usuario
   */
  static async getUnlockedAchievements(userId: string): Promise<TransformedAchievement[]> {
    // 1️⃣ Obtener estadísticas
    const res = await fetch(`${API_URL}/api/userStat/${userId}`, {
      method: 'GET', headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`Error fetching stats: ${res.statusText}`);
    const d = await res.json();

    const stats: Stats = {
      achievements: d.numeroLogros || 0,
      friends: d.numeroAmigos || 0,
      createdPOI: d.numeroPoisCreados || 0,
      unlockedDistricts: d.numeroDistritosDesbloqueados || 0,
      collabMaps: d.numeroMapasColaborativos || 0,
      loginStreak: d.numeroDiasConsecutivos || 0,
    };

    // 2️⃣ Calcular distancia recorrida (2 km por distrito)
    const km = stats.unlockedDistricts * 2;
         // 3) Filtrar logros desbloqueados
         const unlocked = allAchievements.filter((ach) => {
          const m = ach.description.match(/(\d+)/);
          const threshold = m ? parseInt(m[1], 10) : 1;
          const desc = ach.description.toLowerCase();
        
          if (desc.includes('punto')) return stats.createdPOI >= threshold;
          if (desc.includes('amigo')) return stats.friends >= threshold;
          if (desc.includes('kilómetro')) return km >= threshold;
          if (desc.includes('distrito')) return stats.unlockedDistricts >= threshold;
          if (desc.includes('colaborativo') || desc.includes('grupo')) return stats.collabMaps >= 1;
        
          return false;
    });
    if(unlocked.length>=10){
      unlocked.push(logroDesbloquea10logros)
    }

    // 4️⃣ Transformar al formato esperado
    return unlocked.map((item) => ({
      name: item.name,
      description: item.description,
      points: item.points,
      iconUrl: item.iconUrl,
    }));
  }
}