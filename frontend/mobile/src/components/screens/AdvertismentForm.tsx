import { RootStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from '@/constants/config';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ImageBackground, View, TouchableOpacity, StyleSheet, Text, ScrollView, Alert, Modal } from "react-native";
import TextInput from '../UI/TextInput';
import { styles as globalStyles } from '../../assets/styles/styles';
import React, { useState } from 'react';

type AdvertisementFormNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdvertisementForm'>;

interface AdvertisementPoint {
    email: string,
    name: string,
    description: string,
    address: string,
    city: string,
    postalcode: string,
    country: string,
    comments: string
}

const MAIL_ADDRESS = 'mapyourworld.group7@gmail.com'

const AdvertisementForm = () => {
    const [ point, setPoint ] = useState<AdvertisementPoint>({
        email:'',
        name:'',
        description:'',
        address:'',
        city: '',
        postalcode: '',
        country: '',
        comments: ''
        })
    const [errors, setErrors] = useState({
        email: '',
        name:'',
        description:'',
        address:'',
        city: '',
        postalcode: '',
        country: '',
        comments: ''
        });
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const navigation = useNavigation<AdvertisementFormNavigationProp>();

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

        // validación de la dirección
        if (!point.address.trim()) {
            newErrors.address = 'La dirección es obligatoria';
            isValid = false;
        }
        if (!point.city.trim()) {
            newErrors.city = 'La ciudad es obligatoria';
            isValid = false;
        }
        if (!point.postalcode.trim()) {
            newErrors.postalcode = 'El código postal es obligatorio';
            isValid = false;
        } else if (!/\d/.test(point.postalcode)) {
            newErrors.postalcode = 'Código postal no válido';
            isValid = false;
        }
        if (!point.country.trim()) {
            newErrors.country = 'El país es obligatorio';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    }

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);

        const subject = `Solicitud de punto publicitario: ${point.name}`
        const body = `<h3>Datos del punto</h3><p>Nombre: ${point.name}`
        + `${point.description ? `<br>Descripción: ${point.description}` : ``}`
        + `<br>Dirección: ${point.address}, ${point.city} ${point.postalcode}, ${point.country}</p>`
        + `<h3>Datos de contacto</h3><p>Correo electrónico: ${point.email}`
        + `<br>Fecha de registro de la solicitud: ${new Date(Date.now()).toLocaleString()}`
        + `${point.comments ? `<br>Comentarios: ${point.comments}</p>` : `</p>`}`;

        const response = await fetch(`${API_URL}/api/email/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: MAIL_ADDRESS,
                to: MAIL_ADDRESS,
                subject: subject,
                html: body,
            }),
        });
    
        const data = await response.json();
        
        if (response.ok) {
            setIsSent(true);
        } else {
            Alert.alert('Lo sentimos, no pudimos procesar la solicitud en estos momentos.');
            setLoading(false);
        }
        
    };

    const renderSentModal = () => (
        <Modal visible={isSent} transparent={true} animationType="slide">
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)", }}>
            <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20, width: "85%", maxWidth: 400, elevation: 5, }}>
            <Text style={{ fontSize: 20, marginBottom: 20, textAlign: "center", }}>Solicitud enviada correctamente</Text>
            <Text style={{ fontSize: 16, textAlign: 'center', }}>En breves nos pondremos en contacto con vosotros.</Text>
                <View>
                    <TouchableOpacity 
                        style={{ paddingVertical: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 8, backgroundColor: "#2bbbad", marginTop: 20, }} 
                        onPress={() => navigation.navigate('Welcome')}
                    >
                        <Text style={{ fontWeight: "bold", fontSize: 16, color: "white", }}>Volver al inicio</Text>
                    </TouchableOpacity>
                </View>
            </View>
          </View>
        </Modal>
    );
    
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
                        <Text>Correo electrónico</Text>
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
                        <Text>Nombre del punto</Text>
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
                        onChangeText={(text) =>
                            setPoint({ ...point, description: text })
                        }
                        />
                    </View>
                    <View>
                        <Text>Dirección</Text>
                        <TextInput
                        placeholder="Dirección"
                        value={point.address}
                        error={errors.address}
                        onChangeText={(text) =>
                            setPoint({ ...point, address: text })
                        }
                        />
                    </View>
                    <View style={styles.cityInputs}>
                        <View style={styles.cityInput}>
                            <Text>Ciudad</Text>
                            <TextInput
                            placeholder="Ciudad"
                            value={point.city}
                            error={errors.city}
                            onChangeText={(text) =>
                                setPoint({ ...point, city: text })
                            }
                            />
                        </View>
                        <View style={styles.cityInput}>
                            <Text>Código postal</Text>
                            <TextInput
                            placeholder="Código postal"
                            keyboardType = 'numeric'
                            value={point.postalcode}
                            error={errors.postalcode}
                            onChangeText={(text) =>
                                setPoint({ ...point, postalcode: text })
                            }
                            />
                        </View>
                    </View>
                    <View>
                        <Text>País</Text>
                        <TextInput
                        placeholder="País"
                        value={point.country}
                        error={errors.country}
                        onChangeText={(text) =>
                            setPoint({ ...point, country: text })
                        }
                        />
                    </View>

                    <View>
                        <Text>Comentarios</Text>
                        <TextInput
                        placeholder="Comentarios"
                        value={point.comments}
                        error={errors.comments}
                        onChangeText={(text) =>
                            setPoint({ ...point, comments: text })
                        }
                        />
                    </View>

                    {/* Submit button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={styles.primaryButton}
                    >
                        <Text className="text-white text-base font-semibold">
                            {loading ? 'Cargando...' : 'Enviar'}
                        </Text>
                    </TouchableOpacity>
                </View>
                </View>
            </ScrollView>
            {/* Modales */}
            {renderSentModal()}
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
  cityInputs: {
    flexDirection: 'row',
    gap: 5,
  },
  cityInput: {
    width: '50%',
  },
  secondaryText: {
    color: '#64748b',
  },
  noBottomMargin: {
    marginBottom: 0,
  }
});

export default AdvertisementForm; 