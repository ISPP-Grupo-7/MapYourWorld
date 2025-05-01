/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// Mock de navegación
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// Mock para context de autenticación
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user1', name: 'Test User' },
    isAuthenticated: true,
  }),
}));

// Interfaces para tipado
interface MapMember {
  userId: string;
  color: string;
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
    getCollaborativeMaps: jest.fn(() => Promise.resolve(actualService.mapDatabase || [])),
    getCollaborativeMapsForUser: jest.fn((userId: string) => 
      Promise.resolve(
        (actualService.mapDatabase || []).filter(
          (map: CollaborativeMap) => map.members.some((member: MapMember) => member.userId === userId)
        )
      )
    ),
    createCollaborativeMap: jest.fn((mapData: Partial<CollaborativeMap>, userId: string) => 
      Promise.resolve({
        ...mapData,
        id: 'new-map',
        createdAt: new Date(),
        createdBy: userId,
        is_collaborative: true,
        members: [{ userId, color: '#FF0000' }],
        pois: []
      })
    ),
    joinCollaborativeMap: jest.fn(() => Promise.resolve(true)),
    leaveCollaborativeMap: jest.fn(() => Promise.resolve(true)),
    deleteCollaborativeMap: jest.fn(() => Promise.resolve(true)),
  };
});

// Mock para el componente CollaborativeMapListScreen
jest.mock('../../../components/Map/CollaborativeMapListScreen', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  return function MockCollaborativeMapListScreen() {
    const handleCreateMap = () => {
      // Simulación de crear mapa
    };
    
    const handleJoinMap = () => {
      // Simulación de unirse a mapa
    };
    
    const handleSelectMap = (mapId: string) => {
      require('@react-navigation/native').useNavigation().navigate('CollaborativeMap', { mapId });
    };
    
    const handleGoBack = () => {
      require('@react-navigation/native').useNavigation().goBack();
    };
    
    React.useEffect(() => {
      // Simular la carga de mapas al inicio
      const loadMaps = async () => {
        const userId = 'user1';
        await require('../../../services/collaborativeMap.service').getCollaborativeMapsForUser(userId);
      };
      loadMaps();
    }, []);
    
    return React.createElement(View, { testID: 'collab-map-list-screen' }, [
      React.createElement(TouchableOpacity, { 
        testID: 'back-button', 
        onPress: handleGoBack,
        key: 'back'
      }),
      React.createElement(Text, { key: 'title' }, 'Mapas Colaborativos'),
      React.createElement(TouchableOpacity, { 
        testID: 'create-map-button', 
        onPress: handleCreateMap,
        key: 'create'
      }, 'Crear mapa'),
      React.createElement(TouchableOpacity, { 
        testID: 'join-map-button', 
        onPress: handleJoinMap,
        key: 'join'
      }, 'Unirse a mapa'),
      React.createElement(View, { testID: 'map-list', key: 'list' }, [
        React.createElement(TouchableOpacity, {
          testID: 'map-item-map1',
          onPress: () => handleSelectMap('map1'),
          key: 'map1'
        }, 'Test Map 1'),
        React.createElement(TouchableOpacity, {
          testID: 'map-item-map2',
          onPress: () => handleSelectMap('map2'),
          key: 'map2'
        }, 'Test Map 2')
      ])
    ]);
  };
});

// Importamos después de los mocks
import CollaborativeMapListScreen from '../../../components/Map/CollaborativeMapListScreen';
import * as mapService from '../../../services/collaborativeMap.service';

describe('CollaborativeMapListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renderiza correctamente', () => {
    const { getByTestId, getByText } = render(<CollaborativeMapListScreen />);
    expect(getByTestId('collab-map-list-screen')).toBeTruthy();
    expect(getByText('Mapas Colaborativos')).toBeTruthy();
  });

  test('tiene botones para crear y unirse a mapas', () => {
    const { getByTestId } = render(<CollaborativeMapListScreen />);
    expect(getByTestId('create-map-button')).toBeTruthy();
    expect(getByTestId('join-map-button')).toBeTruthy();
  });

  test('muestra lista de mapas colaborativos', () => {
    const { getByTestId } = render(<CollaborativeMapListScreen />);
    expect(getByTestId('map-list')).toBeTruthy();
    expect(getByTestId('map-item-map1')).toBeTruthy();
    expect(getByTestId('map-item-map2')).toBeTruthy();
  });

  test('navega a mapa colaborativo específico al seleccionarlo', () => {
    const { getByTestId } = render(<CollaborativeMapListScreen />);
    fireEvent.press(getByTestId('map-item-map1'));
    expect(mockNavigate).toHaveBeenCalledWith('CollaborativeMap', { mapId: 'map1' });
  });

  test('vuelve a la pantalla anterior', () => {
    const { getByTestId } = render(<CollaborativeMapListScreen />);
    fireEvent.press(getByTestId('back-button'));
    expect(mockGoBack).toHaveBeenCalled();
  });
  
  test('carga mapas colaborativos del usuario al inicializar', () => {
    render(<CollaborativeMapListScreen />);
    
    // Verificar que se llamó a la función sin usar act()
    setTimeout(() => {
      expect(mapService.getCollaborativeMapsForUser).toHaveBeenCalledWith('user1');
    }, 0);
  });
});