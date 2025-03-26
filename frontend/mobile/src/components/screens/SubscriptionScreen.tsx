import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { API_URL } from '../../constants/config';
import { useAuth } from '@/contexts/AuthContext';
import PricingTable from '../UI/PricingTable';  
import styles from '../../assets/styles/pricingStyle'; 


type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;

const SubscriptionScreen = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null); // Estado para guardar el plan

  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const { user } = useAuth();

  const fetchActualPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/active/${user?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en la respuesta del servidor:', errorData);
        throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      // Verificar si la respuesta tiene la propiedad 'plan'
      if (data && data.plan) {
        const { plan } = data;
        console.log('PLAN:', plan);
        setSubscriptionPlan(plan); // Establecer el plan en el estado
      } else {
        console.error('La respuesta no contiene un plan válido');
        setSubscriptionPlan(null); // Establecer a null si no es un plan válido
      }
    } catch (error) {
      console.error('Error al hacer el fetch:', error);
      setSubscriptionPlan(null); // En caso de error, poner el plan a null
    }
  };

  useEffect(() => {
    // Llamamos al fetch para obtener el plan cuando el componente se monta
    fetchActualPlan();
  }, [user]);

  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/${user?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 550 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en la respuesta del servidor:', errorData);
        throw new Error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
      }

      const { paymentIntent } = await response.json();
      console.log('Client Secret:', paymentIntent);
      return paymentIntent;
    } catch (error) {
      console.error('Error al hacer el fetch:', error);
    }
  };

  const updateSubscriptionPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/upgrade/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: 'PREMIUM' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al actualizar la suscripción:', errorData);
      } else {
        console.log('Suscripción actualizada a PREMIUM');
        fetchActualPlan(); // Volver a obtener el plan actualizado
      }
    } catch (error) {
      console.error('Error al actualizar el plan:', error);
    }
  };



  const openPaymentSheet = async () => {
    setLoading(true);
    const clientSecret = await fetchPaymentSheetParams();

    if (!clientSecret) {
      console.error('Error: clientSecret no recibido');
      setLoading(false);
      return;
    }

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'Mi Empresa',
    });

    if (!error) {
      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        console.log('Error al procesar el pago:', paymentError);
      } else {
        console.log('Pago exitoso!');
        await updateSubscriptionPlan();
        navigation.navigate('Map');
      }
    } else {
      console.log('Error al abrir PaymentSheet:', error);
    }
    setLoading(false);
  };

  return (
    <StripeProvider publishableKey="pk_test_51R4l53COc5nj88VcYd6SLzaAhHazLwG2eu4s7HcQOqYB7H1BolfivjPrFzeedbiZuJftKEZYdozfe6Dmo7wCP5lA00rN9xJSro">
      <View style={styles.screenContainer}>
        {/* Si ya es Premium, mostramos un mensaje */}
        {subscriptionPlan === 'PREMIUM' ? (
          <View style={styles.premiumContainer}>
            <Text style={styles.premiumTitle}>Enhorabuena, ya eres miembro Premium</Text>
            <Text style={styles.premiumDescription}>
              Ahora puedes disfrutar de todas las características exclusivas, incluyendo acceso ilimitado a mapas y estadísticas avanzadas. ¡Gracias por ser parte de nuestra comunidad Premium!
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Map')}
            >
              <Text style={styles.buttonText}>Ir a mi mapa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <PricingTable />
            <Text style={styles.title}>Suscríbete a Premium</Text>
            <TouchableOpacity style={styles.button} onPress={openPaymentSheet} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Pagar con Stripe'}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </StripeProvider>
  );
};


export default SubscriptionScreen;
