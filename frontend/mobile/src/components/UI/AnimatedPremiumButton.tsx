// AnimatedPremiumButton.tsx
import React, { useRef, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  Image,
  Easing,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';

interface AnimatedPremiumButtonProps {
  onPress: (event: GestureResponderEvent) => void;
}

const AnimatedPremiumButton: React.FC<AnimatedPremiumButtonProps> = ({ onPress }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false, // No se puede animar backgroundColor con native driver
      })
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  // Interpolación del valor animado a varios colores para simular un efecto arcoíris
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.button, { backgroundColor }]}>
        <Text style={styles.text}>Hazte Premium</Text>
        <Image
          source={require('../../assets/images/subscription_icon.png')}
          style={styles.image}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 5,
  },
  image: {
    width: 25,
    height: 25,
  },
});

export default AnimatedPremiumButton;
