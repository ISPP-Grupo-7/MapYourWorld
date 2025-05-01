// Mock global para styled-components/native
jest.mock('styled-components/native', () => ({
  __esModule: true,
  default: {
    View: jest.fn().mockImplementation((props) => props),
    Text: jest.fn().mockImplementation((props) => props),
    TouchableOpacity: jest.fn().mockImplementation((props) => props),
    create: jest.fn().mockImplementation((component) => component)
  }
}));

// Mock para @expo/vector-icons
jest.mock('@expo/vector-icons/Feather', () => 'MockedFeatherIcon');

// Mock para react-native
jest.mock('react-native/Libraries/Components/Touchable/TouchableOpacity', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return ({ children, testID, onPress, ...props }) => 
    React.createElement(View, { testID, onPress, ...props }, children);
});

// Mock para evitar errores con Image
jest.mock('react-native/Libraries/Image/Image', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return (props) => React.createElement(View, props);
});

// Mock para ImageBackground
jest.mock('react-native/Libraries/Image/ImageBackground', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return ({ children, ...props }) => React.createElement(View, props, children);
});

// Mock para react-native-maps
jest.mock('react-native-maps', () => {
  const MockMapView = jest.fn().mockImplementation((props) => ({
    ...props,
    testID: props.testID || 'map-view',
  }));
  
  MockMapView.Marker = jest.fn().mockImplementation((props) => ({
    ...props,
    testID: props.testID || 'map-marker',
  }));
  
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMapView.Marker,
  };
});

// Mock para react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn((success) => {
    success({
      coords: {
        latitude: 37.3892,
        longitude: -5.9828,
        accuracy: 5,
      },
    });
  }),
  requestAuthorization: jest.fn(() => Promise.resolve(true)),
}));

// Mock para react-leaflet
jest.mock('react-leaflet', () => {
  const MapContainer = jest.fn().mockImplementation((props) => ({
    ...props,
    testID: props.testID || 'map-container',
  }));
  
  const Marker = jest.fn().mockImplementation((props) => ({
    ...props,
    testID: props.testID || 'map-marker',
  }));
  
  const TileLayer = jest.fn().mockImplementation((props) => ({
    ...props,
    testID: props.testID || 'tile-layer',
  }));
  
  const Popup = jest.fn().mockImplementation((props) => ({
    ...props,
    testID: props.testID || 'map-popup',
  }));
  
  return {
    MapContainer,
    Marker,
    TileLayer,
    Popup,
    useMap: jest.fn().mockReturnValue({
      setView: jest.fn(),
      locate: jest.fn(),
    }),
  };
}); 