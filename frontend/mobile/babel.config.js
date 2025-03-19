module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin',
      // Configuración simplificada para module-resolver
      ['module-resolver', {
        root: ['.'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src'
        }
      }]
    ]
  };
};