module.exports = {
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
}; 