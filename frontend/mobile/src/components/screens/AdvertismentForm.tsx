import { RootStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ImageBackground, View, TouchableOpacity, StyleSheet, Text, Platform, ScrollView } from "react-native";
import TextInput from '../UI/TextInput';
import { styles as globalStyles } from '../../assets/styles/styles';
import React, { useState } from 'react';

type AdvertisementFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdvertisementForm'>;

interface AdvertisementPoint {
    email: string,
    name: string,
    description?: string,
    longitude: string,
    latitude: string,
}

const AdvertisementForm = () => {
    const [ point, setPoint ] = useState<AdvertisementPoint>({
        email:'',
        name:'',
        description:undefined,
        longitude:'',
        latitude:''
        })
    const [errors, setErrors] = useState({
        email: '',
        name:'',
        description:'',
        longitude:'',
        latitude:'',
        });
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = { ...errors };
        let isValid = true;

        // validación del correo
        if (!point.email.trim()) {
            newErrors.email = 'El correo electrónico es obligatorio';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(point.email)) {
            newErrors.email = 'Introduce un correo electrónico válido';
            isValid = false;
        }

        // validación del nombre
        if (!point.name.trim()) {
            newErrors.name = 'El nombre es obligatorio';
            isValid = false;
        }

        // validación de la longitud y la latitud
        if (!point.longitude.trim()) {
            newErrors.longitude = 'La longitud es obligatoria';
            isValid = false;
        } else if (/[a-zA-Z]/.test(point.longitude)) {
            newErrors.longitude = 'La longitud debe ser un número'
            isValid = false;
        } else if (Math.abs(Number(point.longitude))>180) {
            newErrors.longitude = 'La longitud debe estar entre -180º y 180º'
            isValid = false;
        }

        if (!point.latitude.trim()) {
            newErrors.latitude = 'La latitud es obligatoria';
            isValid = false;
        } else if (/[a-zA-Z]/.test(point.latitude)) {
            newErrors.latitude = 'La latitud debe ser un número'
            isValid = false;
        } else if (Math.abs(Number(point.longitude))>90) {
            newErrors.latitude = 'La latitud debe estar entre -90º y 90º'
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    }

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        const subject = `Solicitud de punto publicitario: ${point.name}`
        const body = `Solicitud de punto publicitario con los siguientes datos:`
            + `\nNombre del punto: ${point.name}`
            + `\n${point.description ?? `Descripción del punto: ${point.description}`}`
            + `\nCoordenadas del punto (longitud, latitud): ${point.longitude}, ${point.latitude}`
            + `\nEmail de contacto: ${point.email}`
            + `\nFecha de registro de la solicitud: ${new Date(Date.now()).toLocaleString()}`;

        try {
            
        }  catch (error: unknown) {
            console.error('Error al registrarse:', error);

            let errorMessage: string = 'Ocurrió un error inesperado';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = (error as { message: string }).message;
            }

        } finally {
            setLoading(false);
        }
        
    };
    
    return (
        <ImageBackground
        source={require('../../assets/images/login_background.webp')}
        style={styles.background}
        resizeMode="cover"
        >
        <View style={globalStyles.semi_transparent_overlay} />
        <ScrollView style={styles.container}>
            {/* Content */}
            <View style={styles.content}>
            <View style={styles.contentContainer}>
                <Text style={styles.title}>
                    <Text style={styles.titleHighlight}>Publicítate</Text>
                <Text style={styles.titleMain}> con nosotros</Text>
                </Text>
                
                <Text style={styles.description}>
                Si quieres aparecer en nuestro mapa, ponte en contacto con nuestro equipo rellenando el siguiente formulario.
                </Text>
                
                {/* Form */}
                <View>
                    <Text>Email</Text>
                    <TextInput
                    placeholder="Email de contacto"
                    value={point.email}
                    error={errors.email}
                    onChangeText={(text) =>
                        setPoint({ ...point, email: text })
                    }
                    />
                </View>
                <View>
                    <Text>Nombre</Text>
                    <TextInput
                    placeholder="Nombre"
                    value={point.name}
                    error={errors.name}
                    onChangeText={(text) =>
                        setPoint({ ...point, name: text })
                    }
                    />
                </View>
                <View>
                    <Text>Descripción</Text>
                    <TextInput
                    placeholder="Descripción"
                    value={point.description}
                    error={errors.description}
                    multiline
                    onChangeText={(text) =>
                        setPoint({ ...point, description: text })
                    }
                    />
                </View>
                <Text>Coordenadas</Text>
                <View style={styles.coordinatesInput}>
                    <View style={styles.coordinateInput}>
                        <Text style={styles.secondaryText}>Longitud</Text>
                        <TextInput
                        placeholder="Longitud"
                        keyboardType = 'numeric'
                        value={point.longitude}
                        error={errors.longitude}
                        onChangeText={(text) =>
                            setPoint({ ...point, longitude: text })
                        }
                        />
                    </View>
                    <View style={styles.coordinateInput}>
                        <Text style={styles.secondaryText}>Latitud</Text>
                        <TextInput
                        placeholder="Latitud"
                        keyboardType = 'numeric'
                        value={point.latitude}
                        error={errors.latitude}
                        onChangeText={(text) =>
                            setPoint({ ...point, latitude: text })
                        }
                        />
                    </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    style={styles.primaryButton}
                >
                    <Text className="text-white text-base font-semibold">Enviar</Text>
                </TouchableOpacity>
            </View>
            </View>
        </ScrollView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 50,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 36,
    lineHeight: 46,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  titleMain: {
    color: '#1e293b',
  },
  titleHighlight: {
    color: '#2bbbad',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#64748b',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#2bbbad',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coordinatesInput: {
    flexDirection: 'row',
    gap: 5,
  },
  coordinateInput: {
    width: '50%',
  },
  secondaryText: {
    color: '#64748b',
  },
});

export default AdvertisementForm; 