const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const appDirectory = path.resolve(__dirname);
const TerserPlugin = require('terser-webpack-plugin');

// Esta es una configuración webpack optimizada para Expo con Node.js 22
module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    app: path.join(appDirectory, 'App.tsx'),
  },
  output: {
    path: path.resolve(appDirectory, 'dist'),
    filename: 'bundle.[contenthash:8].js',
    publicPath: '/',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
          },
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `vendor.${packageName.replace('@', '')}`;
          },
        },
      },
    },
    runtimeChunk: 'single',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        include: [
          path.resolve(appDirectory),
          path.resolve('node_modules/react-native-reanimated'),
          path.resolve('node_modules/react-native-gesture-handler'),
        ],
        exclude: [
          /node_modules\/(?!(react-native-reanimated|react-native-gesture-handler|react-native-vector-icons|@react-navigation|react-native-safe-area-context|react-native-maps|react-native)).*/,
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|webp|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024,
          },
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[hash:8][ext]',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
      'react': path.resolve(appDirectory, 'node_modules/react'),
      'react-dom': path.resolve(appDirectory, 'node_modules/react-dom'),
      '@react': path.resolve(appDirectory, 'node_modules/react'),
      '@react-dom': path.resolve(appDirectory, 'node_modules/react-dom'),
      'scheduler': path.resolve(appDirectory, 'node_modules/scheduler'),
      'react-is': path.resolve(appDirectory, 'node_modules/react-is'),
      'react/jsx-runtime': path.resolve(appDirectory, 'node_modules/react/jsx-runtime'),
      '@': path.resolve(appDirectory, 'src'),
      '@components': path.resolve(appDirectory, 'src/components'),
      '@assets': path.resolve(appDirectory, 'src/assets'),
      '@screens': path.resolve(appDirectory, 'src/screens'),
      '@utils': path.resolve(appDirectory, 'src/utils'),
      '@hooks': path.resolve(appDirectory, 'src/hooks'),
      '@services': path.resolve(appDirectory, 'src/services')
    },
    fallback: {
      'react-native-maps': false,
      'react-native/Libraries/Utilities/codegenNativeCommands': false,
    },
    symlinks: false,
    cacheWithContext: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'index.html'),
      filename: 'index.html',
      inject: true,
      minify: process.env.NODE_ENV === 'production' ? {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      } : false,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      __DEV__: process.env.NODE_ENV !== 'production',
      'registerRootComponent': '(() => {})',
    }),
    new webpack.NormalModuleReplacementPlugin(
      /react-native-maps/,
      path.resolve(appDirectory, 'src/components/Map/MapScreen.web.tsx')
    ),
    new webpack.ids.HashedModuleIdsPlugin(),
  ],
  devServer: {
    historyApiFallback: true,
    hot: true,
    compress: true,
    static: {
      directory: path.join(appDirectory, 'public'),
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  stats: {
    modules: false,
    chunks: false,
    chunkModules: false,
    reasons: false,
    cached: false,
    cachedAssets: false,
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'eval-cheap-module-source-map',
  watchOptions: {
    ignored: /node_modules/,
  },
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
}; 