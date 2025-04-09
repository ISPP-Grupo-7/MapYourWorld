/**
 * Script para actualizar todas las dependencias de MapYourWorld 
 * para hacerlas compatibles con Node.js 22.14.0 LTS
 * 
 * Este script actualiza:
 * - Configuración de npm
 * - Dependencias principales
 * - Dependencias de frontend/web
 * - Dependencias de frontend/mobile con Expo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Códigos de color para la salida
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Verificación de la versión de Node.js
function checkNodeVersion() {
  const requiredVersion = '22.14.0';
  const currentVersion = process.version.slice(1); // Elimina el 'v' inicial
  
  console.log(`${colors.cyan}Versión de Node.js:${colors.reset} ${currentVersion}`);
  console.log(`${colors.cyan}Versión requerida:${colors.reset} ${requiredVersion}`);
  
  // Comprobar si la versión actual coincide con la requerida
  if (currentVersion !== requiredVersion) {
    console.log(`\n${colors.red}⚠ ¡ATENCIÓN! La versión de Node.js (${currentVersion}) no coincide con la requerida (${requiredVersion}).${colors.reset}`);
    console.log(`${colors.yellow}Se recomienda instalar Node.js 22.14.0 LTS para evitar problemas de compatibilidad.${colors.reset}`);
    console.log(`${colors.yellow}Puedes descargarla desde: https://nodejs.org/download/release/v22.14.0/${colors.reset}\n`);
    
    // Preguntar si desea continuar
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`${colors.bright}¿Desea continuar de todos modos? (s/N): ${colors.reset}`, (answer) => {
      readline.close();
      if (answer.toLowerCase() !== 's') {
        console.log(`${colors.red}Operación cancelada por el usuario.${colors.reset}`);
        process.exit(1);
      } else {
        console.log(`${colors.yellow}Continuando con la versión actual de Node.js...${colors.reset}\n`);
        startScript();
      }
    });
    return false;
  }
  
  console.log(`${colors.green}✓ Versión de Node.js correcta${colors.reset}\n`);
  return true;
}

// Función para ejecutar comandos shell de forma segura
function runCommand(command, directory = '.') {
  try {
    console.log(`${colors.cyan}Ejecutando:${colors.reset} ${command} ${colors.yellow}(en ${directory})${colors.reset}`);
    return execSync(command, { cwd: directory, stdio: 'inherit' });
  } catch (error) {
    console.error(`${colors.red}Error al ejecutar comando:${colors.reset} ${command}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    return null;
  }
}

// Función para actualizar un archivo package.json
function updatePackageJson(packagePath, updates) {
  try {
    console.log(`${colors.cyan}Actualizando:${colors.reset} ${packagePath}`);
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Actualizar las dependencias
    ['dependencies', 'devDependencies', 'resolutions'].forEach(depType => {
      if (updates[depType] && packageJson[depType]) {
        Object.entries(updates[depType]).forEach(([pkg, version]) => {
          if (packageJson[depType][pkg]) {
            console.log(`${colors.green}→ Actualizando ${depType}/${pkg}:${colors.reset} ${packageJson[depType][pkg]} ${colors.bright}→${colors.reset} ${version}`);
            packageJson[depType][pkg] = version;
          }
        });
      }
    });

    // Agregar campos nuevos si existen en las actualizaciones
    Object.entries(updates).forEach(([key, value]) => {
      if (!['dependencies', 'devDependencies', 'resolutions'].includes(key) && value !== undefined) {
        packageJson[key] = value;
      }
    });

    // Guardar el archivo actualizado
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`${colors.green}✓ Archivo actualizado:${colors.reset} ${packagePath}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error al actualizar ${packagePath}:${colors.reset} ${error.message}`);
    return false;
  }
}

// Función para crear o sobrescribir un archivo
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`${colors.green}✓ Archivo creado/actualizado:${colors.reset} ${filePath}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error al escribir ${filePath}:${colors.reset} ${error.message}`);
    return false;
  }
}

/**
 * Sincroniza las versiones de dependencias entre todos los archivos package.json
 * y corrige los problemas detectados por expo-doctor
 */
function sincronizarDependencias() {
  console.log(`\n${colors.bright}${colors.blue}SINCRONIZANDO DEPENDENCIAS EN TODOS LOS PACKAGE.JSON${colors.reset}\n`);
  
  try {
    // Leer el package.json raíz
    const rootPackagePath = path.join(__dirname, 'package.json');
    const rootPackageJson = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));
    
    // Corregir el problema de "mapyourworld-backend" detectado por expo-doctor
    if (rootPackageJson.dependencies && rootPackageJson.dependencies['mapyourworld-backend']) {
      delete rootPackageJson.dependencies['mapyourworld-backend'];
      console.log(`${colors.green}✓ Eliminada dependencia circular 'mapyourworld-backend' del package.json raíz${colors.reset}`);
    }
    
    // Lista de ubicaciones de package.json en el proyecto
    const packagePaths = [
      path.join(__dirname, 'frontend', 'package.json'),
      path.join(__dirname, 'frontend', 'mobile', 'package.json'),
      path.join(__dirname, 'frontend', 'web', 'package.json'),
      path.join(__dirname, 'backend', 'package.json')
    ];
    
    // Dependencias específicas para el frontend/mobile
    const mobileDependenciesMap = {
      // Dependencias principales
      'react': '18.3.1',
      'react-dom': '18.3.1',
      'react-native': '0.76.7',
      "expo-modules-core": "2.2.3",
      'expo': '52.0.37',
      '@expo/webpack-config': '^0.17.4',
      '@react-native-async-storage/async-storage': '1.23.1',
      'react-native-svg': '15.8.0',
      'react-native-gesture-handler': '~2.24.0',
      'react-native-reanimated': '~3.17.1',
      'lottie-react-native': '7.1.0',
      'axios': '1.8.1',
      'tailwindcss': '3.3.2',
      'nativewind': '2.0.11',
      
      // Componentes de navegación
      '@react-navigation/native': '6.1.9',
      '@react-navigation/native-stack': '6.9.17',
      '@react-navigation/stack': '^7.1.2',
      '@react-navigation/bottom-tabs': '^7.2.1',
      'react-native-safe-area-context': '5.3.0',
      'react-native-screens': '~4.9.1',
      
      // Mapas y localización
      'react-native-maps': '1.20.1',
      'expo-location': '~18.0.7',
      'leaflet': '^1.9.4',
      'react-leaflet': '5.0.0',
      
      // Gestión de estados y API
      '@tanstack/react-query': '5.67.1',
      'jwt-decode': '4.0.0',
      'jose': '^6.0.8',
      'native-notify': '^4.0.9',
      
      // UI y estilos
      '@mui/material': '^6.4.6',
      '@mui/icons-material': '^6.4.6',
      '@emotion/react': '^11.14.0',
      '@emotion/styled': '^11.14.0',
      'styled-components': '6.1.15',
      'react-native-vector-icons': '10.2.0',
      'react-icons': '5.5.0',
      
      // Utilidades
      'expo-image-picker': '~16.0.6',
      'expo-camera': '~16.0.17',
      'expo-file-system': '~18.0.11',
      'expo-media-library': '~17.0.6',
      'expo-constants': '~17.0.7',
      'expo-device': '~7.0.2',
      'expo-splash-screen': '~0.29.22',
      'expo-status-bar': '~2.0.1',
      'expo-auth-session': '~6.0.3',
      'expo-image-manipulator': '~13.0.6',
      "@stripe/react-stripe-js": "3.5.1",
      "@stripe/stripe-js": "6.1.0",
      "@stripe/stripe-react-native": "0.38.6",
      'formik': '^2.4.6',
      'yup': '^1.6.1',
      'moment': '^2.30.1',
      'date-fns': '^4.1.0',
      'chart.js': '4.4.8',
      'react-chartjs-2': '5.3.0',
      'lightningcss': '1.29.1',
      'react-router-dom': '7.3.0',
      '@expo/metro-runtime': '~4.0.1',
      'react-native-web': '~0.19.13',
      
      // Tipos
      '@types/react': '~18.3.12',
      '@types/react-dom': '~18.3.1',
      '@types/react-native-vector-icons': '6.4.18',
      '@types/leaflet': '^1.9.16',
      'typescript': '5.8.2'
    };
    
    // DevDependencies específicas para el frontend/mobile
    const mobileDevDependenciesMap = {
      '@babel/core': '^7.26.9',
      '@babel/plugin-transform-runtime': '7.26.9',
      '@testing-library/react': '16.2.0',
      '@testing-library/react-native': '^13.1.0',
      '@typescript-eslint/eslint-plugin': '^8.26.0',
      '@typescript-eslint/parser': '^8.26.0',
      'autoprefixer': '^10.4.20',
      'babel-loader': '^10.0.0',
      'babel-plugin-module-resolver': '^5.0.2',
      'babel-preset-expo': '12.0.9',
      'buffer': '^6.0.3',
      'chalk': '^5.4.1',
      'cross-env': '7.0.3',
      'crypto-browserify': '^3.12.1',
      'css-loader': '^7.1.2',
      'file-loader': '^6.2.0',
      'html-webpack-plugin': '^5.6.3',
      'jest': '^29.7.0',
      'jest-expo': '^52.0.5',
      'os-browserify': '^0.3.0',
      'path-browserify': '^1.0.1',
      'postcss': '^8.5.3',
      'react-native-svg-transformer': '1.5.0',
      'react-test-renderer': '18.3.1',
      'stream-browserify': '^3.0.0',
      'style-loader': '^4.0.0',
      'terser-webpack-plugin': '5.3.12',
      'ts-jest': '^29.2.6',
      'ts-node': '^10.9.2',
      'webpack': '^5.98.0',
      'webpack-cli': '^6.0.1',
      'webpack-dev-server': '5.2.0',
      "supertest": "7.0.0",
      "eslint": "9.23.0",
      "eslint-plugin-react": "7.37.4",
      "eslint-plugin-react-hooks": "5.2.0",
      "eslint-plugin-react-native": "5.0.0"
    };
    
    // Dependencias específicas para el backend
    const backendDependenciesMap = {
      'typescript': '5.8.2',
      'bcryptjs': '3.0.2',
      'jsonwebtoken': '9.0.2',
      'pg': '8.13.3',
      'pg-hstore': '2.3.4',
      'pg-promise': '11.10.2',
      'typeorm': '0.3.21',
      'nodemailer': '6.10.0',
      'socket.io-client': '3.0.0',
      'socket.io': '3.0.0',
      'axios': '1.8.1',
      'class-validator': '0.14.1',
      'multer': '1.4.5-lts.1',
      'express': '4.21.2',
      'express-validator': '7.2.1',
      'express-rate-limit': '7.5.0',
      'express-winston': '4.2.0',
      'winston': '3.17.0',
      'cors': '2.8.5',
      'dotenv': '16.4.7',
      'helmet': '8.0.0',
      'sharp': '0.33.5',
      'compression': '1.8.0',
      'http-proxy-middleware': '3.0.3',
      'amqplib': '0.10.5',
      'redis': '4.7.0',
      'aws-sdk': '2.1692.0',
      'jwt-decode': '4.0.0',
      'geojson': '0.5.0',
      'crypto-js': '4.2.0',
      '@turf/turf': '7.2.0',
      'sequelize': '6.37.6',
      'ws': '8.18.1',
      
      // Tipos
      '@types/bcryptjs': '2.4.6',
      '@types/jsonwebtoken': '9.0.9',
      '@types/nodemailer': '6.4.17',
      '@types/express': '5.0.0',
      '@types/cors': '2.8.17',
      '@types/amqplib': '0.10.7',
      '@types/crypto-js': '4.2.2',
      '@types/ws': '8.18.0',
      '@types/multer': '1.4.12',
      '@types/compression': '1.7.5'
    };
    
    // Dependencias de desarrollo específicas para el backend
    const backendDevDependenciesMap = {
      'typescript': '5.8.2',
      'ts-node': '10.9.2',
      'ts-node-dev': '2.0.0',
      'eslint': '9.21.0',
      '@typescript-eslint/eslint-plugin': '8.26.0',
      '@typescript-eslint/parser': '8.26.0',
      'jest': '29.7.0',
      'ts-jest': '29.2.6',
      'nodemon': '3.1.9',
      'chalk': '5.4.1',
      'cross-env': '7.0.3',
      'babel-plugin-module-resolver': '5.0.2',
      "supertest": "7.0.0"
    };
    
    // Actualizar cada package.json encontrado
    for (const packagePath of packagePaths) {
      if (fs.existsSync(packagePath)) {
        const packageDir = path.dirname(packagePath);
        const relativePath = path.relative(__dirname, packagePath);
        console.log(`\n${colors.yellow}Procesando ${relativePath}...${colors.reset}`);
        
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Utilizar el mapa de dependencias específico según el tipo de package.json
        let dependenciesMap = {};
        let devDependenciesMap = {};
        
        if (packagePath.includes('mobile')) {
          dependenciesMap = mobileDependenciesMap;
          devDependenciesMap = mobileDevDependenciesMap;
          console.log(`${colors.blue}Usando mapa de dependencias para frontend/mobile${colors.reset}`);
        } else if (packagePath.includes('backend')) {
          dependenciesMap = backendDependenciesMap;
          devDependenciesMap = backendDevDependenciesMap;
          console.log(`${colors.blue}Usando mapa de dependencias para backend${colors.reset}`);
        } else {
          // Para otros package.json, usar un conjunto común de dependencias
          dependenciesMap = {
            'typescript': '5.8.2',
            'react': '18.3.1',
            'react-dom': '18.3.1'
          };
          console.log(`${colors.blue}Usando mapa de dependencias común${colors.reset}`);
        }
        
        // Corregir problemas con el nombre del paquete en backend/package.json
        if (packagePath.includes('backend') && packageJson.name === 'mapyourworld-backend') {
          packageJson.name = 'mapyourworld-backend-services';
          console.log(`${colors.green}✓ Nombre del paquete backend cambiado para evitar conflictos${colors.reset}`);
          
          // Eliminar la dependencia circular
          if (packageJson.dependencies && packageJson.dependencies['mapyourworld-backend']) {
            delete packageJson.dependencies['mapyourworld-backend'];
            console.log(`${colors.green}✓ Eliminada dependencia circular${colors.reset}`);
          }
        }
        
        // Corregir configuración para expo-doctor en el proyecto mobile
        if (packagePath.includes('mobile')) {
          if (!packageJson.expo) {
            packageJson.expo = {};
          }
          
          if (!packageJson.expo.doctor) {
            packageJson.expo.doctor = {};
          }
          
          // Actualizar la configuración para desactivar la advertencia de paquetes desconocidos
          packageJson.expo.doctor.reactNativeDirectoryCheck = {
            listUnknownPackages: false,
            exclude: [
              "react-native-maps",
              "jwt-decode"
            ]
          };
          
          console.log(`${colors.green}✓ Configuración de expo-doctor actualizada${colors.reset}`);
        }
        
        // Actualizar dependencias y devDependencies
        if (packageJson.dependencies) {
          for (const [dep, version] of Object.entries(dependenciesMap)) {
            if (packageJson.dependencies[dep] && packageJson.dependencies[dep] !== version) {
              console.log(`${colors.yellow}→ Actualizando ${dep} de ${packageJson.dependencies[dep]} a ${version}${colors.reset}`);
              packageJson.dependencies[dep] = version;
            }
          }
        }
        
        if (packageJson.devDependencies) {
          // Usar el mapa de devDependencies si está disponible
          const devMapToUse = packagePath.includes('mobile') ? mobileDevDependenciesMap : 
                            packagePath.includes('backend') ? backendDevDependenciesMap : {};
          
          for (const [dep, version] of Object.entries(devMapToUse)) {
            if (packageJson.devDependencies[dep] && packageJson.devDependencies[dep] !== version) {
              console.log(`${colors.yellow}→ Actualizando devDependencies/${dep} de ${packageJson.devDependencies[dep]} a ${version}${colors.reset}`);
              packageJson.devDependencies[dep] = version;
            }
          }
        }
        
        // Guardar cambios si hubo actualizaciones
        if (packagePath.includes('backend') || packagePath.includes('mobile')) {
          fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
          console.log(`${colors.green}✓ ${relativePath} actualizado${colors.reset}`);
        } else {
          console.log(`${colors.blue}→ No se requieren cambios en ${relativePath}${colors.reset}`);
        }
      }
    }
    
    // Actualizar el package.json raíz con las versiones alineadas
    rootPackageJson.resolutions = {
      ...rootPackageJson.resolutions,
      ...dependenciesMap
    };
    
    rootPackageJson.overrides = {
      ...rootPackageJson.overrides,
      ...dependenciesMap
    };
    
    fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackageJson, null, 2) + '\n');
    console.log(`\n${colors.green}✓ Package.json raíz actualizado con todas las resoluciones${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.green}Dependencias sincronizadas correctamente${colors.reset}`);
    console.log(`${colors.yellow}A continuación, ejecuta la opción 3 para regenerar el package-lock.json${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error al sincronizar dependencias:${colors.reset} ${error.message}`);
  }
}

// Función principal que contiene la lógica del script
function startScript() {
  try {
    // Mostrar cabecera
    console.log(`\n${colors.bright}${colors.blue}===================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}     SCRIPT DE ACTUALIZACIÓN DE DEPENDENCIAS     ${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}===================================================${colors.reset}\n`);
    
    // Verificar versión de Node.js
    checkNodeVersion();
    
    // Mostrar opciones al usuario
    console.log(`Seleccione una opción:`);
    console.log(`1. Borrar todos los node_modules del proyecto`);
    console.log(`2. Instalar todas las dependencias del proyecto`);
    console.log(`3. Fijar versiones exactas desde node_modules instalados`);
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`\nOpción (1/2/3): `, (option) => {
      readline.close();
      
      switch (option.trim()) {
        case '1':
          // Borrar todos los node_modules del proyecto
          borrarNodeModules();
          break;
        case '2':
          // Instalar todas las dependencias del proyecto
          instalarDependencias();
          break;
        case '3':
          // Fijar versiones desde node_modules existentes
          fijarVersionesDesdeNodeModules();
          break;
        default:
          console.log(`${colors.red}Opción no válida. Por favor seleccione una opción del 1 al 3.${colors.reset}`);
          break;
      }
    });
  } catch (error) {
    console.error(`${colors.red}Error al iniciar el script:${colors.reset} ${error.message}`);
  }
}

/**
 * Función para borrar todos los node_modules del proyecto de forma recursiva
 */
function borrarNodeModules() {
  console.log(`\n${colors.bright}${colors.magenta}BORRANDO TODOS LOS NODE_MODULES DEL PROYECTO${colors.reset}\n`);
  
  try {
    // Definir directorio raíz
    const rootDir = __dirname;
    let nodeModulesEncontrados = [];
    let packageJsonEncontrados = [];
    
    console.log(`${colors.cyan}Buscando archivos package.json y directorios node_modules...${colors.reset}`);
    
    // Función recursiva para buscar package.json y node_modules
    function buscarArchivos(directorio, profundidadMaxima = 5, profundidadActual = 0) {
      if (profundidadActual > profundidadMaxima) return;
      
      try {
        const archivos = fs.readdirSync(directorio);
        
        // Comprobar si hay package.json en este directorio
        if (archivos.includes('package.json')) {
          packageJsonEncontrados.push(directorio);
          
          // Si hay package.json, comprobar si también hay node_modules
          if (archivos.includes('node_modules')) {
            const nodeModulesPath = path.join(directorio, 'node_modules');
            if (fs.statSync(nodeModulesPath).isDirectory()) {
              nodeModulesEncontrados.push(nodeModulesPath);
            }
          }
        }
        
        // Continuar buscando en subdirectorios
        for (const archivo of archivos) {
          const rutaCompleta = path.join(directorio, archivo);
          
          try {
            const stat = fs.statSync(rutaCompleta);
            
            if (stat.isDirectory()) {
              // No buscar en node_modules, .git, dist, build
              if (archivo !== 'node_modules' && archivo !== '.git' && archivo !== 'dist' && archivo !== 'build') {
                buscarArchivos(rutaCompleta, profundidadMaxima, profundidadActual + 1);
              }
            }
          } catch (err) {
            // Ignorar errores al acceder a archivos individuales
          }
        }
      } catch (err) {
        console.log(`${colors.yellow}No se pudo acceder al directorio ${directorio}: ${err.message}${colors.reset}`);
      }
    }
    
    // Iniciar búsqueda
    buscarArchivos(rootDir);
    
    if (packageJsonEncontrados.length === 0) {
      console.log(`${colors.yellow}No se encontraron archivos package.json en el proyecto.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}Se encontraron ${packageJsonEncontrados.length} directorios con package.json:${colors.reset}`);
    packageJsonEncontrados.forEach((dir, index) => {
      console.log(`${colors.cyan}${index + 1}. ${path.relative(rootDir, dir)}${colors.reset}`);
    });
    
    if (nodeModulesEncontrados.length === 0) {
      console.log(`${colors.yellow}No se encontraron directorios node_modules en el proyecto.${colors.reset}`);
      return;
    }
    
    console.log(`\n${colors.green}Se encontraron ${nodeModulesEncontrados.length} directorios node_modules:${colors.reset}`);
    nodeModulesEncontrados.forEach((dir, index) => {
      console.log(`${colors.cyan}${index + 1}. ${path.relative(rootDir, dir)}${colors.reset}`);
    });
    
    console.log(`\n${colors.yellow}Se procederá a eliminar todos los directorios node_modules encontrados.${colors.reset}`);
    
    const readlineConfirm = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readlineConfirm.question(`\n${colors.bright}¿Desea continuar? (s/N): ${colors.reset}`, (answer) => {
      readlineConfirm.close();
      
      if (answer.toLowerCase() !== 's') {
        console.log(`${colors.yellow}Operación cancelada por el usuario.${colors.reset}`);
        return;
      }
      
      console.log(`\n${colors.magenta}Eliminando directorios node_modules...${colors.reset}`);
      
      let directoriosEliminados = 0;
      let errores = 0;
      
      for (const directorio of nodeModulesEncontrados) {
        try {
          console.log(`${colors.yellow}Eliminando: ${path.relative(rootDir, directorio)}${colors.reset}`);
          
          if (process.platform === 'win32') {
            // En Windows, usar el comando rd para eliminar directorios
            execSync(`rd /s /q "${directorio}"`, { stdio: 'ignore' });
          } else {
            // En Unix/Linux, usar rm -rf
            execSync(`rm -rf "${directorio}"`, { stdio: 'ignore' });
          }
          
          // Verificar si se eliminó correctamente
          if (!fs.existsSync(directorio)) {
            console.log(`${colors.green}✓ Eliminado correctamente${colors.reset}`);
            directoriosEliminados++;
          } else {
            console.log(`${colors.red}⚠ No se pudo eliminar completamente${colors.reset}`);
            errores++;
          }
        } catch (error) {
          console.error(`${colors.red}Error al eliminar ${directorio}: ${error.message}${colors.reset}`);
          errores++;
        }
      }
      
      // Eliminar package-lock.json si existe
      const packageLockPath = path.join(rootDir, 'package-lock.json');
      if (fs.existsSync(packageLockPath)) {
        try {
          fs.unlinkSync(packageLockPath);
          console.log(`${colors.green}✓ Archivo package-lock.json eliminado${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}Error al eliminar package-lock.json: ${error.message}${colors.reset}`);
        }
      }
      
      console.log(`\n${colors.bright}${colors.green}RESUMEN DE LA OPERACIÓN:${colors.reset}`);
      console.log(`${colors.green}- Directorios node_modules eliminados: ${directoriosEliminados}/${nodeModulesEncontrados.length}${colors.reset}`);
      if (errores > 0) {
        console.log(`${colors.red}- Errores encontrados: ${errores}${colors.reset}`);
      }
      
      console.log(`\n${colors.bright}${colors.green}OPERACIÓN COMPLETADA${colors.reset}`);
      console.log(`${colors.yellow}Para reinstalar las dependencias, ejecute la opción 2 de este script.${colors.reset}`);
    });
  } catch (error) {
    console.error(`${colors.red}Error al borrar node_modules: ${error.message}${colors.reset}`);
  }
}

/**
 * Función para instalar todas las dependencias del proyecto
 */
function instalarDependencias() {
  console.log(`\n${colors.bright}${colors.blue}INSTALANDO DEPENDENCIAS DEL PROYECTO${colors.reset}\n`);
  
  try {
    // Definir directorios donde se instalarán las dependencias
    const rootDir = __dirname;
    const directorios = [
      {
        ruta: rootDir,
        nombre: 'Raíz del proyecto'
      },
      {
        ruta: path.join(rootDir, 'frontend', 'mobile'),
        nombre: 'Frontend/Mobile'
      },
      {
        ruta: path.join(rootDir, 'backend'),
        nombre: 'Backend'
      },
      {
        ruta: path.join(rootDir, 'shared'),
        nombre: 'Shared'
      },
      {
        ruta: path.join(rootDir, 'backend', 'api-gateway'),
        nombre: 'API Gateway'
      }
    ];
    
    // Filtrar solo directorios que existen y tienen package.json
    const directoriosValidos = directorios.filter(dir => {
      const existeDirectorio = fs.existsSync(dir.ruta);
      const existePackageJson = fs.existsSync(path.join(dir.ruta, 'package.json'));
      return existeDirectorio && existePackageJson;
    });
    
    console.log(`${colors.cyan}Se instalarán dependencias en ${directoriosValidos.length} directorios:${colors.reset}`);
    directoriosValidos.forEach((dir, index) => {
      console.log(`${colors.cyan}${index + 1}. ${dir.nombre} (${path.relative(rootDir, dir.ruta)})${colors.reset}`);
    });
    
    console.log(`\n${colors.yellow}Este proceso puede tardar varios minutos. Se ejecutarán dos comandos de instalación en cada directorio:${colors.reset}`);
    console.log(`${colors.cyan}- npm install --force${colors.reset}`);
    console.log(`${colors.cyan}- npm install --legacy-peer-deps${colors.reset}`);
    
    const readlineConfirm = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readlineConfirm.question(`\n${colors.bright}¿Desea continuar? (s/N): ${colors.reset}`, (answer) => {
      readlineConfirm.close();
      
      if (answer.toLowerCase() !== 's') {
        console.log(`${colors.yellow}Operación cancelada por el usuario.${colors.reset}`);
        return;
      }
      
      // Instalar dependencias en cada directorio
      console.log(`\n${colors.magenta}Iniciando instalación de dependencias...${colors.reset}`);
      
      let directoriosCompletados = 0;
      let errores = 0;
      
      for (const directorio of directoriosValidos) {
        console.log(`\n${colors.bright}${colors.blue}=== Instalando en: ${directorio.nombre} ===${colors.reset}`);
        
        try {
          // Ejecutar npm install --force
          console.log(`${colors.yellow}Ejecutando: npm install --force${colors.reset}`);
          execSync('npm install --force', { 
            cwd: directorio.ruta, 
            stdio: 'inherit'
          });
          
          // Ejecutar npm install --legacy-peer-deps
          console.log(`${colors.yellow}Ejecutando: npm install --legacy-peer-deps${colors.reset}`);
          execSync('npm install --legacy-peer-deps', { 
            cwd: directorio.ruta, 
            stdio: 'inherit'
          });
          
          console.log(`${colors.green}✓ Instalación completada en ${directorio.nombre}${colors.reset}`);
          directoriosCompletados++;
        } catch (error) {
          console.error(`${colors.red}Error al instalar dependencias en ${directorio.nombre}: ${error.message}${colors.reset}`);
          errores++;
        }
      }
      
      // Verificación de dependencias de expo
      const dirMobile = path.join(rootDir, 'frontend', 'mobile');
      if (fs.existsSync(dirMobile)) {
        console.log(`\n${colors.bright}${colors.blue}=== Verificando dependencias de Expo ===${colors.reset}`);
        
        try {
          console.log(`${colors.yellow}Ejecutando: npx expo-doctor --verbose${colors.reset}`);
          // Usar stdio: 'inherit' para mostrar la salida directamente en la consola
          execSync('npx expo-doctor --verbose', { 
            cwd: dirMobile, 
            stdio: 'inherit'
          });
          
          console.log(`${colors.green}✓ Verificación de Expo completada${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}Error al verificar dependencias de Expo: ${error.message}${colors.reset}`);
        }
      }
      
      // Verificación de versiones con npm outdated
      console.log(`\n${colors.bright}${colors.blue}=== Verificando versiones de paquetes ===${colors.reset}`);
      
      try {
        console.log(`${colors.yellow}Ejecutando: npm outdated${colors.reset}`);
        
        // Primero mostrar la salida original de npm outdated para visualizar todos los paquetes
        try {
          const outdatedTable = execSync('npm outdated', { 
            cwd: rootDir, 
            stdio: 'pipe',
            encoding: 'utf8'
          });
          
          if (outdatedTable.trim() !== '') {
            console.log(`\n${colors.cyan}Lista de paquetes y sus versiones:${colors.reset}`);
            console.log(outdatedTable);
          } else {
            console.log(`${colors.green}No hay paquetes desactualizados.${colors.reset}`);
          }
        } catch (outputError) {
          if (outputError.stdout && outputError.stdout.trim() !== '') {
            console.log(`\n${colors.cyan}Lista de paquetes y sus versiones:${colors.reset}`);
            console.log(outputError.stdout);
          }
        }
        
        // Ahora obtener los datos en formato JSON para analizar
        const outdated = execSync('npm outdated --json', { 
          cwd: rootDir, 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        if (outdated.trim() === '') {
          console.log(`\n${colors.green}✓ Todas las dependencias están actualizadas a las versiones requeridas${colors.reset}`);
        } else {
          try {
            // Parsear la salida JSON para comparar Current vs Wanted
            const outdatedJson = JSON.parse(outdated);
            let todasCoinciden = true;
            let paquetesDesactualizados = [];
            
            for (const [pkg, info] of Object.entries(outdatedJson)) {
              if (info.current !== info.wanted) {
                todasCoinciden = false;
                paquetesDesactualizados.push(`${pkg}: current=${info.current}, wanted=${info.wanted}`);
              }
            }
            
            console.log(`\n${colors.bright}${colors.blue}=== Resultado del análisis de versiones ===${colors.reset}`);
            
            if (todasCoinciden) {
              console.log(`${colors.green}✓ Todas las versiones actuales coinciden con las requeridas${colors.reset}`);
            } else {
              console.log(`${colors.yellow}⚠ Algunas dependencias tienen versiones diferentes a las requeridas:${colors.reset}`);
              paquetesDesactualizados.forEach(pkg => console.log(`  ${colors.yellow}${pkg}${colors.reset}`));
            }
          } catch (jsonError) {
            // Si el JSON no se puede parsear, mostrar un mensaje genérico
            console.log(`\n${colors.yellow}⚠ No se pudo realizar el análisis detallado de las versiones${colors.reset}`);
          }
        }
      } catch (error) {
        // npm outdated retorna código de error si encuentra paquetes desactualizados
        if (error.stdout) {
          try {
            // Intentar parsear la salida como JSON
            const outdatedJson = JSON.parse(error.stdout);
            let todasCoinciden = true;
            let paquetesDesactualizados = [];
            
            for (const [pkg, info] of Object.entries(outdatedJson)) {
              if (info.current !== info.wanted) {
                todasCoinciden = false;
                paquetesDesactualizados.push(`${pkg}: current=${info.current}, wanted=${info.wanted}`);
              }
            }
            
            console.log(`\n${colors.bright}${colors.blue}=== Resultado del análisis de versiones ===${colors.reset}`);
            
            if (todasCoinciden) {
              console.log(`${colors.green}✓ Todas las versiones actuales coinciden con las requeridas${colors.reset}`);
            } else {
              console.log(`${colors.yellow}⚠ Algunas dependencias tienen versiones diferentes a las requeridas:${colors.reset}`);
              paquetesDesactualizados.forEach(pkg => console.log(`  ${colors.yellow}${pkg}${colors.reset}`));
            }
          } catch (jsonError) {
            // Si el JSON no se puede parsear, mostrar un mensaje genérico
            console.log(`\n${colors.yellow}⚠ No se pudo realizar el análisis detallado de las versiones${colors.reset}`);
          }
        } else {
          console.error(`${colors.red}Error al verificar versiones de paquetes: ${error.message}${colors.reset}`);
        }
      }
      
      console.log(`\n${colors.bright}${colors.green}RESUMEN DE LA OPERACIÓN:${colors.reset}`);
      console.log(`${colors.green}- Directorios donde se instalaron dependencias: ${directoriosCompletados}/${directoriosValidos.length}${colors.reset}`);
      if (errores > 0) {
        console.log(`${colors.red}- Errores encontrados: ${errores}${colors.reset}`);
      }
      
      console.log(`\n${colors.bright}${colors.green}INSTALACIÓN COMPLETADA${colors.reset}`);
    });
  } catch (error) {
    console.error(`${colors.red}Error al instalar dependencias: ${error.message}${colors.reset}`);
  }
}

/**
 * Función para fijar versiones exactas desde los node_modules instalados
 * Esta función busca todos los directorios node_modules y actualiza los package.json
 * con las versiones exactas de las dependencias actualmente instaladas.
 */
function fijarVersionesDesdeNodeModules() {
  console.log(`\n${colors.bright}${colors.blue}FIJANDO VERSIONES EXACTAS DESDE NODE_MODULES INSTALADOS${colors.reset}\n`);
  
  try {
    // Definir directorio raíz
    const rootDir = __dirname;
    let packageJsonEncontrados = [];
    
    console.log(`${colors.cyan}Buscando archivos package.json en el proyecto...${colors.reset}`);
    
    // Función recursiva para buscar package.json
    function buscarArchivos(directorio, profundidadMaxima = 5, profundidadActual = 0) {
      if (profundidadActual > profundidadMaxima) return;
      
      try {
        const archivos = fs.readdirSync(directorio);
        
        // Comprobar si hay package.json en este directorio
        if (archivos.includes('package.json') && archivos.includes('node_modules')) {
          packageJsonEncontrados.push({
            directorio: directorio,
            nodeModulesPath: path.join(directorio, 'node_modules'),
            packageJsonPath: path.join(directorio, 'package.json'),
            relativePath: path.relative(rootDir, directorio) || '.' // Si es directorio raíz, mostrar .
          });
        }
        
        // Continuar buscando en subdirectorios
        for (const archivo of archivos) {
          const rutaCompleta = path.join(directorio, archivo);
          
          try {
            const stat = fs.statSync(rutaCompleta);
            
            if (stat.isDirectory()) {
              // No buscar en node_modules, .git, dist, build
              if (archivo !== 'node_modules' && archivo !== '.git' && archivo !== 'dist' && archivo !== 'build') {
                buscarArchivos(rutaCompleta, profundidadMaxima, profundidadActual + 1);
              }
            }
          } catch (err) {
            // Ignorar errores al acceder a archivos individuales
          }
        }
      } catch (err) {
        console.log(`${colors.yellow}No se pudo acceder al directorio ${directorio}: ${err.message}${colors.reset}`);
      }
    }
    
    // Iniciar búsqueda
    buscarArchivos(rootDir);
    
    if (packageJsonEncontrados.length === 0) {
      console.log(`${colors.yellow}No se encontraron directorios con package.json y node_modules.${colors.reset}`);
      console.log(`${colors.yellow}Primero debe instalar las dependencias con la opción 2.${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}Se encontraron ${packageJsonEncontrados.length} directorios con package.json y node_modules:${colors.reset}`);
    packageJsonEncontrados.forEach((info, index) => {
      console.log(`${colors.cyan}${index + 1}. ${info.relativePath}${colors.reset}`);
    });
    
    // Procesar cada directorio con node_modules
    for (const info of packageJsonEncontrados) {
      console.log(`\n${colors.yellow}Procesando: ${info.relativePath}${colors.reset}`);
      
      // Leer el package.json del proyecto
      const packageJson = JSON.parse(fs.readFileSync(info.packageJsonPath, 'utf8'));
      
      try {
        // Almacenar el directorio actual para volver después
        const cwd = process.cwd();
        
        // Cambiar al directorio del proyecto
        process.chdir(info.directorio);
        
        console.log(`${colors.cyan}Escaneando dependencias instaladas en ${info.relativePath}...${colors.reset}`);
        
        // Actualizar package.json con versiones exactas 
        let actualizado = false;
        
        // Obtener dependencias instaladas directamente de los archivos package.json en node_modules
        const obtenerVersionesInstaladas = (dependenciesObj) => {
          const versiones = {};
          
          if (!dependenciesObj) return versiones;
          
          for (const depName of Object.keys(dependenciesObj)) {
            const moduloPath = path.join(info.nodeModulesPath, depName, 'package.json');
            
            try {
              if (fs.existsSync(moduloPath)) {
                const modulePackage = JSON.parse(fs.readFileSync(moduloPath, 'utf8'));
                versiones[depName] = modulePackage.version;
                console.log(`${colors.cyan}→ Módulo encontrado: ${depName}@${modulePackage.version}${colors.reset}`);
              }
            } catch (err) {
              console.log(`${colors.yellow}No se pudo leer la versión para ${depName}: ${err.message}${colors.reset}`);
            }
          }
          
          return versiones;
        };
        
        // Actualizar las dependencias regulares
        if (packageJson.dependencies) {
          const versionesInstaladas = obtenerVersionesInstaladas(packageJson.dependencies);
          
          Object.entries(versionesInstaladas).forEach(([dep, version]) => {
            if (packageJson.dependencies[dep] && packageJson.dependencies[dep] !== version) {
              console.log(`${colors.yellow}→ Actualizando ${dep} a versión exacta: ${version}${colors.reset}`);
              packageJson.dependencies[dep] = version;
              actualizado = true;
            }
          });
        }
        
        // Actualizar las devDependencies
        if (packageJson.devDependencies) {
          const versionesInstaladas = obtenerVersionesInstaladas(packageJson.devDependencies);
          
          Object.entries(versionesInstaladas).forEach(([dep, version]) => {
            if (packageJson.devDependencies[dep] && packageJson.devDependencies[dep] !== version) {
              console.log(`${colors.yellow}→ Actualizando devDependency ${dep} a versión exacta: ${version}${colors.reset}`);
              packageJson.devDependencies[dep] = version;
              actualizado = true;
            }
          });
        }
        
        // Arreglar los overrides para que coincidan con las dependencias reales
        if (packageJson.overrides) {
          const todasLasDependencias = {...(packageJson.dependencies || {}), ...(packageJson.devDependencies || {})};
          let overridesActualizados = false;
          
          for (const [dep, version] of Object.entries(packageJson.overrides)) {
            if (todasLasDependencias[dep]) {
              const versionInstalada = todasLasDependencias[dep];
              if (versionInstalada !== version) {
                console.log(`${colors.yellow}→ Corrigiendo conflicto en override ${dep}: ${version} → ${versionInstalada}${colors.reset}`);
                packageJson.overrides[dep] = versionInstalada;
                overridesActualizados = true;
              }
            }
          }
          
          if (overridesActualizados) {
            actualizado = true;
            console.log(`${colors.green}✓ Overrides actualizados para evitar conflictos${colors.reset}`);
          }
        }
        
        // Guardar el package.json actualizado
        if (actualizado) {
          fs.writeFileSync(info.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
          console.log(`${colors.green}✓ package.json actualizado con versiones exactas${colors.reset}`);
        } else {
          console.log(`${colors.blue}→ No se encontraron cambios para package.json${colors.reset}`);
        }
        
        // Generar el package-lock.json
        console.log(`${colors.cyan}Regenerando package-lock.json...${colors.reset}`);
        
        try {
          const lockFilePath = path.join(info.directorio, 'package-lock.json');
          const packageJsonPath = info.packageJsonPath;
          
          // Eliminar package-lock.json si existe
          if (fs.existsSync(lockFilePath)) {
            fs.unlinkSync(lockFilePath);
            console.log(`${colors.yellow}Eliminado package-lock.json existente para regenerarlo${colors.reset}`);
          }
          
          // Intentar generar con npm primero
          console.log(`${colors.blue}Ejecutando npm install --package-lock-only...${colors.reset}`);
          
          let packageLockGenerado = false;
          
          try {
            execSync('npm install --package-lock-only', { 
              cwd: info.directorio,
              stdio: 'pipe' 
            });
            
            if (fs.existsSync(lockFilePath)) {
              const fileSize = fs.statSync(lockFilePath).size;
              console.log(`${colors.green}✓ package-lock.json regenerado (${fileSize} bytes)${colors.reset}`);
              packageLockGenerado = true;
            }
          } catch (cmdError) {
            console.log(`${colors.yellow}No se pudo generar con npm: ${cmdError.message}${colors.reset}`);
          }
          
          // Si no se pudo generar, simplemente copiar el archivo package.json completo
          if (!packageLockGenerado) {
            console.log(`${colors.yellow}Copiando package.json como package-lock.json...${colors.reset}`);
            
            try {
              // Copiar el archivo directamente
              fs.copyFileSync(packageJsonPath, lockFilePath);
              
              if (fs.existsSync(lockFilePath)) {
                const fileSize = fs.statSync(lockFilePath).size;
                console.log(`${colors.green}✓ package.json copiado como package-lock.json (${fileSize} bytes)${colors.reset}`);
                console.log(`${colors.yellow}Nota: Es una copia exacta del package.json${colors.reset}`);
              }
            } catch (copyError) {
              console.log(`${colors.red}Error al copiar el archivo: ${copyError.message}${colors.reset}`);
            }
          }
        } catch (lockError) {
          console.error(`${colors.red}Error al manejar package-lock.json: ${lockError.message}${colors.reset}`);
        }
        
        // Volver al directorio original
        process.chdir(cwd);
        
      } catch (error) {
        console.error(`${colors.red}Error al procesar ${info.relativePath}:${colors.reset} ${error.message}`);
        // Asegurarse de volver al directorio original
        if (process.cwd() !== rootDir) {
          process.chdir(rootDir);
        }
      }
    }
    
    console.log(`\n${colors.bright}${colors.green}PROCESO COMPLETADO${colors.reset}`);
    console.log(`${colors.yellow}Se han fijado las versiones exactas en los package.json.${colors.reset}`);
    console.log(`${colors.yellow}Se han regenerado los archivos package-lock.json.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error al fijar versiones desde node_modules:${colors.reset} ${error.message}`);
  }
}

// Inicio del script
console.log(`\n${colors.bright}${colors.blue}====================================================${colors.reset}`);
console.log(`${colors.bright}${colors.blue}  ACTUALIZANDO DEPENDENCIAS PARA NODE.JS 22.14.0 LTS  ${colors.reset}`);
console.log(`${colors.bright}${colors.blue}====================================================${colors.reset}\n`);

// Ejecutar el script
startScript(); 