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

module.exports = {
  MapContainer,
  Marker,
  TileLayer,
  Popup,
  useMap: jest.fn().mockReturnValue({
    setView: jest.fn(),
    locate: jest.fn(),
  }),
}; 