import { RootStackParamList } from "@/navigation/types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ImageBackground, View, TouchableOpacity, StyleSheet, Text, Platform, TextInput, ScrollView, Alert, Modal } from "react-native";
import { styles } from '../../assets/styles/styles';
import React, { useState } from "react";
import { API_URL } from "@/constants/config";

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

  const handleChange = (field: keyof typeof point, value: string) => {
    setPoint(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const subject = `Solicitud de punto publicitario: ${point.name}`
    const body = `<h3>Datos del punto</h3><p>Nombre: ${point.name}`
        + `${point.description ? `<br>Descripción: ${point.description}` : ``}`
        + `<br>Dirección: ${point.address}, ${point.city} ${point.postalcode}, ${point.country}</p>`
        + `<h3>Datos de contacto</h3><p>Correo electrónico: ${point.email}`
        + `<br>Fecha de registro de la solicitud: ${new Date(Date.now()).toLocaleString()}`
        + `${point.comments ? `<br>Comentarios del solicitante: ${point.comments}</p>` : `</p>`}`;

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
  
  const customInputStyles = `
    .input-container input {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 15px;
      font-size: 16px;
      transition: border-color 0.2s;
      height: 44px;
      box-sizing: border-box;
    }
    
    .input-container input:focus {
      border-color: #2bbbad;
      outline: none;
    }
    
    .input-container {
      margin-bottom: 20px;
    }

    button {
      box-sizing: border-box;
      height: 44px;
    }

    .ad-container {
      margin: 50px;
    }
  `;

  const renderSentModal = () => (
    <Modal visible={isSent} transparent={true} animationType="slide">
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)", }}>
        <View style={{ backgroundColor: "white", borderRadius: 12, padding: 20, width: "85%", maxWidth: 400, elevation: 5, }}>
        <Text style={{ fontSize: 20, marginBottom: 20, textAlign: "center", }}>Solicitud enviada correctamente</Text>
        <Text style={{ fontSize: 16, textAlign: 'center', }}>En breves nos pondremos en contacto con vosotros.</Text>
              <View>
                <TouchableOpacity 
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 8, backgroundColor: "#2bbbad", marginTop: 20, }} 
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
      style={styles.background_image}
            resizeMode="cover"
            className='image-background'
    >
      <View style={styles.semi_transparent_overlay} />
        <ScrollView>
          {/* Content */}
          <View className="flex-1 justify-center items-center min-h-screen ad-container">
            <style dangerouslySetInnerHTML={{ __html: customInputStyles }} />
            <div style={{ 
              backgroundColor: 'white', 
              padding: 40,
              borderRadius: 12, 
              width: '600px',
              maxWidth: '600px', 
              margin: '0 auto',
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <h1><span style={{color: '#2bbbad'}}>Publicítate</span> con nosotros</h1>
              <div style={{ margin: 20, fontSize: 16, color: '#64748b', }}>
                Si quieres aparecer en nuestro mapa, ponte en contacto con nuestro equipo rellenando el siguiente formulario.
              </div>
              
              <div style={{ width: '100%', marginBottom: 20 }}>
                {/* Correo electrónico */}
                <div className="input-container" style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                    Correo electrónico
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={point.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      style={{ 
                        width: '100%',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        height: '44px',
                        borderColor: errors.email ? '#e53e3e' : undefined
                      }}
                    />
                  </div>
                  {errors.email && (
                    <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="input-container" style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                    Nombre del punto
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={point.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      style={{ 
                        width: '100%',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        height: '44px',
                        borderColor: errors.name ? '#e53e3e' : undefined
                      }}
                    />
                  </div>
                  {errors.name && (
                    <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                      {errors.name}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="input-container" style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                    Descripción
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="textarea"
                      placeholder="Descripción"
                      value={point.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      style={{ 
                        width: '100%',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        height: '44px',
                        borderColor: errors.description ? '#e53e3e' : undefined
                      }}
                    />
                  </div>
                  {errors.description && (
                    <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                      {errors.description}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="input-container" style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                    Dirección
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Dirección"
                      value={point.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      style={{ 
                        width: '100%',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        height: '44px',
                        borderColor: errors.address ? '#e53e3e' : undefined
                      }}
                    />
                  </div>
                  {errors.address && (
                    <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                      {errors.address}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 5, }}>
                  {/* City */}
                  <div className="input-container" style={{ width: '50%', }}>
                    <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                      Ciudad
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        placeholder="Ciudad"
                        value={point.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        style={{ 
                          width: '100%',
                          paddingLeft: '10px',
                          paddingRight: '10px',
                          height: '44px',
                          borderColor: errors.city ? '#e53e3e' : undefined
                        }}
                      />
                    </div>
                    {errors.city && (
                      <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                        {errors.city}
                      </div>
                    )}
                  </div>
                  {/* Postal code */}
                  <div className="input-container" style={{ width: '50%', }}>
                    <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                      Código postal
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        placeholder="Código postal"
                        value={point.postalcode}
                        onChange={(e) => handleChange('postalcode', e.target.value)}
                        style={{ 
                          width: '100%',
                          paddingLeft: '10px',
                          paddingRight: '10px',
                          height: '44px',
                          borderColor: errors.postalcode ? '#e53e3e' : undefined
                        }}
                      />
                    </div>
                    {errors.postalcode && (
                      <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                        {errors.postalcode}
                      </div>
                    )}
                  </div>
                </div>
                {/* Country */}
                <div className="input-container" style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                    País
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="País"
                      value={point.country}
                      onChange={(e) => handleChange('country', e.target.value)}
                      style={{ 
                        width: '100%',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        height: '44px',
                        borderColor: errors.country ? '#e53e3e' : undefined
                      }}
                    />
                  </div>
                  {errors.country && (
                    <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                      {errors.country}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div className="input-container" style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500, color: '#333', textAlign: 'left' }}>
                    Comentarios
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="textarea"
                      placeholder="Comentarios"
                      value={point.comments}
                      onChange={(e) => handleChange('comments', e.target.value)}
                      style={{ 
                        width: '100%',
                        paddingLeft: '10px',
                        paddingRight: '10px',
                        height: '44px',
                        borderColor: errors.comments ? '#e53e3e' : undefined
                      }}
                    />
                  </div>
                  {errors.comments && (
                    <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '4px', textAlign: 'left' }}>
                      {errors.comments}
                    </div>
                  )}
                </div>

                {/* Botón */}
                <div style={{ width: '100%' }}>
                  <button 
                    onClick={handleSubmit}
                    style={{
                      width: '100%',
                      backgroundColor: '#2bbbad',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 0',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      height: '44px',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {loading ? 'Cargando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </View>
        </ScrollView>
        {/* Modales */}
        {renderSentModal()}
    </ImageBackground>
  );
};

export default AdvertisementForm; 