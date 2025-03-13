import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  background_image: {
    flex: 1,
    justifyContent: "center",
  },
  semi_transparent_overlay: {
    ...StyleSheet.absoluteFillObject, // Hace que la capa cubra toda la pantalla
    backgroundColor: "rgba(255, 255, 255, 0.6)", // Blanco con 60% de opacidad
  },
});
