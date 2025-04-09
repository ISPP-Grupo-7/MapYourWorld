import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Dimensions, Text, Animated } from 'react-native';

// Importar las imágenes de anuncios
const adImages = [
  require('../../assets/ads/anuncio1.webp'),
  require('../../assets/ads/anuncio2.webp'),
  require('../../assets/ads/anuncio3.webp'),
  require('../../assets/ads/anuncio4.webp'),
  require('../../assets/ads/anuncio5.webp'),
  require('../../assets/ads/anuncio6.webp'),
  require('../../assets/ads/anuncio7.webp'),
];

interface StaticAdProps {
  onClose: () => void;
  autoClose?: boolean;
}

const StaticAd: React.FC<StaticAdProps> = ({ onClose, autoClose = true }) => {
  // Seleccionar una imagen aleatoria
  const [adImage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * adImages.length);
    return adImages[randomIndex];
  });

  // Estado para el contador y progreso de la barra
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [progressAnim] = useState(new Animated.Value(0));

  // Temporizador para cerrar automáticamente después de 10 segundos
  useEffect(() => {
    if (autoClose) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Animación para la barra de progreso
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: false,
      }).start();
      
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [onClose, autoClose, progressAnim]);

  const screenWidth = Dimensions.get('window').width;
  const adWidth = Math.min(screenWidth * 0.8, 800); // 80% del ancho de la pantalla hasta un máximo de 800px

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.adContainer, { width: adWidth }]}>
        <Image 
          source={adImage} 
          style={styles.adImage} 
          resizeMode="contain"
        />
        
        {/* Barra de progreso y contador */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { width: progressWidth }
            ]} 
          />
          <Text style={styles.timeText}>
            {timeRemaining > 0 ? `${timeRemaining}s` : 'Finalizando...'}
          </Text>
        </View>

        {/* Mensaje de contribución */}
        <View style={styles.contributionContainer}>
          <Text style={styles.contributionText}>
            Viendo este anuncio, contribuyes con la aplicación
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  adContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: 600,
  },
  progressContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2bbbad',
    position: 'absolute',
    left: 0,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 8,
    zIndex: 1,
  },
  contributionContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  contributionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default StaticAd; 