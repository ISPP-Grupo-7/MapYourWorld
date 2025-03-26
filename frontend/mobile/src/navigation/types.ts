/**
 * Tipos para la navegación en la aplicación
 */

export type RootStackParamList = {
  // Pantallas de autenticación
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // Pantallas principales
  Home: undefined;
  Map: undefined;
  Profile: { userId: string };
  MapList: undefined;
  SocialScreen: undefined;

  // Pantallas de mapas
  MapDetail: { mapId: string };
  CollaborativeMapListScreen: undefined;
  CollaborativeMapScreen: { mapId: string; userId: string };

  // Otras pantallas
  POIDetail: { poiId: string };
  Settings: undefined;
  AdvertisementForm: undefined;
  Payment: undefined;
  UserAchievementsScreen: undefined;

  // Pantallas de administración
  DashboardAdmin: undefined;
}; 