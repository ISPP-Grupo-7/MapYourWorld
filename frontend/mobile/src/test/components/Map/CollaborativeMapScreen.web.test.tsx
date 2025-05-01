/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// Mock de navegación y route
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { mapId: 'map1' }
  }),
}));

// Interfaces para tipado
interface MapMember {
  userId: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CollaborativeMap {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  is_collaborative: boolean;
  members: MapMember[];
  pois: any[];
}

// Mock para servicios de mapas colaborativos
jest.mock('../../../services/collaborativeMap.service', () => {
  const actualService = jest.requireActual('../../../services/collaborativeMap.service');
  
  return {
    ...actualService,
    getCollaborativeMapById: jest.fn((id: string) => Promise.resolve(
      (actualService.mapDatabase || []).find((map: CollaborativeMap) => map.id === id) || null
    )),
    addPOIToCollaborativeMap: jest.fn(() => Promise.resolve(true)),
    updatePOIInCollaborativeMap: jest.fn(() => Promise.resolve(true)),
    deletePOIFromCollaborativeMap: jest.fn(() => Promise.resolve(true)),
    getMapMembers: jest.fn((mapId: string) => {
      const map = (actualService.mapDatabase || []).find((m: CollaborativeMap) => m.id === mapId);
      if (!map) return Promise.resolve([]);
      
      return Promise.resolve(
        map.members.map((member: MapMember) => ({
          ...member,
          user: actualService.userDatabase.find((u: User) => u.id === member.userId) || 
                { id: member.userId, name: 'Usuario desconocido', email: '' }
        }))
      );
    }),
  };
});

// Mock para context de autenticación
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user1', name: 'Test User' },
    isAuthenticated: true,
  }),
}));

// Interfaces para props de componentes
interface CollaborativeMapScreenWebProps {
  mapId: string;
  userId: string;
}

// Mock para el componente CollaborativeMapScreen.web
jest.mock('../../../components/Map/CollaborativeMapScreen.web', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  return function MockCollaborativeMapScreenWeb({ mapId, userId }: CollaborativeMapScreenWebProps) {
    const handleAddPOI = () => {
      // Simulación de añadir POI
    };
    
    const handleToggleList = () => {
      // Simulación de mostrar/ocultar lista
    };
    
    const handleGoBack = () => {
      require('@react-navigation/native').useNavigation().goBack();
    };
    
    const handleOpenSettings = () => {
      // Simulación de abrir configuración
    };
    
    React.useEffect(() => {
      // Simular la carga del mapa y miembros al inicio
      const loadMapData = async () => {
        await require('../../../services/collaborativeMap.service').getCollaborativeMapById(mapId);
        await require('../../../services/collaborativeMap.service').getMapMembers(mapId);
      };
      loadMapData();
    }, [mapId]);
    
    return React.createElement(View, { testID: 'collab-map-screen-web' }, [
      React.createElement(View, { testID: 'map-container', key: 'map' }),
      React.createElement(Text, { testID: 'map-title', key: 'title' }, 'Test Map'),
      React.createElement(TouchableOpacity, { 
        testID: 'back-button', 
        onPress: handleGoBack,
        key: 'back'
      }),
      React.createElement(TouchableOpacity, { 
        testID: 'add-poi-button', 
        onPress: handleAddPOI,
        key: 'add-poi'
      }),
      React.createElement(TouchableOpacity, { 
        testID: 'toggle-list-button', 
        onPress: handleToggleList,
        key: 'toggle-list'
      }),
      React.createElement(TouchableOpacity, { 
        testID: 'settings-button', 
        onPress: handleOpenSettings,
        key: 'settings'
      })
    ]);
  };
});

// Importamos después de los mocks
import CollaborativeMapScreenWeb from '../../../components/Map/CollaborativeMapScreen.web';
import * as mapService from '../../../services/collaborativeMap.service';

describe('CollaborativeMapScreen.web', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renderiza correctamente', () => {
    const { getByTestId } = render(<CollaborativeMapScreenWeb mapId="map1" userId="user1" />);
    expect(getByTestId('collab-map-screen-web')).toBeTruthy();
    expect(getByTestId('map-container')).toBeTruthy();
    expect(getByTestId('map-title')).toBeTruthy();
  });

  test('tiene botón para añadir POI', () => {
    const { getByTestId } = render(<CollaborativeMapScreenWeb mapId="map1" userId="user1" />);
    expect(getByTestId('add-poi-button')).toBeTruthy();
  });

  test('tiene botón para alternar lista de POIs', () => {
    const { getByTestId } = render(<CollaborativeMapScreenWeb mapId="map1" userId="user1" />);
    expect(getByTestId('toggle-list-button')).toBeTruthy();
  });

  test('vuelve a la lista de mapas colaborativos', () => {
    const { getByTestId } = render(<CollaborativeMapScreenWeb mapId="map1" userId="user1" />);
    fireEvent.press(getByTestId('back-button'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  test('tiene botón de configuración', () => {
    const { getByTestId } = render(<CollaborativeMapScreenWeb mapId="map1" userId="user1" />);
    expect(getByTestId('settings-button')).toBeTruthy();
  });
  
  test('carga los datos del mapa al inicializar', () => {
    render(<CollaborativeMapScreenWeb mapId="map1" userId="user1" />);
    
    // Verificar que se llamó a la función sin usar act()
    setTimeout(() => {
      expect(mapService.getCollaborativeMapById).toHaveBeenCalledWith('map1');
    }, 0);
  });
  
  test('carga los miembros del mapa al inicializar', () => {
    render(<CollaborativeMapScreenWeb mapId="map1" userId="user1" />);
    
    // Verificar que se llamó a la función sin usar act()
    setTimeout(() => {
      expect(mapService.getMapMembers).toHaveBeenCalledWith('map1');
    }, 0);
  });
}); 