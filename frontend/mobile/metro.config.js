// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Encuentra el directorio del workspace
const workspaceRoot = path.resolve(__dirname, '../../');
const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Configuración simplificada para resolver problemas de bundling
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];
config.resolver.resolverMainFields = ['browser', 'main'];

// Agregamos las rutas en workspaceRoot a las watchFolders
config.watchFolders = [workspaceRoot];

// Configuración de assetExts para incluir todos los tipos de archivos necesarios
config.resolver.assetExts = [...config.resolver.assetExts, 'db', 'sqlite', 'json', 'png', 'jpg', 'svg'];

// Incluimos el módulo de shared
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Configuramos resolver para el manejo de alias
config.resolver.extraNodeModules = {
  '@': path.resolve(projectRoot, 'src'),
  '@components': path.resolve(projectRoot, 'src/components'),
  '@screens': path.resolve(projectRoot, 'src/screens'),
  '@assets': path.resolve(projectRoot, 'src/assets'),
  '@utils': path.resolve(projectRoot, 'src/utils'),
  '@hooks': path.resolve(projectRoot, 'src/hooks'),
  '@services': path.resolve(projectRoot, 'src/services'),
  // Agregamos aliases para los módulos compartidos
  'shared': path.resolve(workspaceRoot, 'shared'),
  'react': path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'expo': path.resolve(projectRoot, 'node_modules/expo'),
};

// Aseguramos que Metro encuentre todos los módulos correctamente
config.resolver.disableHierarchicalLookup = false;
config.resolver.enableGlobalPackages = true;

// Configuramos los assetExts y sourceExts
config.resolver.sourceExts = [...config.resolver.sourceExts, 'jsx', 'json', 'js', 'ts', 'tsx', 'cjs', 'mjs'];

// Configuración específica para la transformación
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
  minifierPath: require.resolve('metro-minify-terser'),
  minifierConfig: {
    // Opciones del minimizador
    ecma: 8, // Usar sintaxis ES2017
    compress: {
      // Opciones de compresión
      unused: true,
      dead_code: true,
    },
    mangle: {
      safari10: true, // Para compatibilidad con Safari 10
    },
  },
};

// Configurar el Server
config.server = {
  ...config.server,
  port: 8081, // Puerto por defecto
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Manejo de errores en middleware
      middleware(req, res, next);
    };
  },
};

// Configuración para el manejo de errores en Metro
config.reporter = {
  ...config.reporter,
  update: (event) => {
    // Podemos manejar eventos específicos aquí
    if (event.type === 'bundle_build_failed') {
      console.error('Error al construir el bundle:', event.error);
    }
  },
};

module.exports = config; 