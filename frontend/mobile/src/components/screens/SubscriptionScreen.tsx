import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Pressable } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_URL } from '../../constants/config';
import { useAuth } from '@/contexts/AuthContext';
import PricingTable from '../UI/PricingTable';
import { RootStackParamList } from '../../navigation/types';

type PaymentScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Payment'>;

const SubscriptionScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<PaymentScreenNavigationProp>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [loading, setLoading] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [isPricingTableOpen, setIsPricingTableOpen] = useState(false);

  // Obtiene el plan actual del usuario
  const fetchActualPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/active/${user?.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Error en la solicitud');
      const data = await response.json();
      setSubscriptionPlan(data?.plan || null);
    } catch (error) {
      console.error('Error al obtener el plan:', error);
      setSubscriptionPlan(null);
    }
  };

  // Solicita la creación de un PaymentIntent en el servidor para el PaymentSheet
  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stripe/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 550 }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en la respuesta del servidor:', errorData);
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      const { paymentIntent } = await response.json();
      return paymentIntent;
    } catch (error) {
      console.error('Error al obtener PaymentIntent:', error);
    }
  };

  // Actualiza el plan del usuario a PREMIUM
  const updateSubscriptionPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/upgrade/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'PREMIUM' }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al actualizar la suscripción:', errorData);
      } else {
        console.log('Suscripción actualizada a PREMIUM');
        fetchActualPlan();
      }
    } catch (error) {
      console.error('Error al actualizar el plan:', error);
    }
  };

  // Abre el PaymentSheet para que el usuario realice el pago
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

    if (error) {
      console.log('Error al inicializar PaymentSheet:', error);
      setLoading(false);
      return;
    }

    const { error: paymentError } = await presentPaymentSheet();
    if (paymentError) {
      Alert.alert('Error al procesar el pago', paymentError.message);
    } else {
      await updateSubscriptionPlan();
      Alert.alert(
        '¡Pago realizado con éxito!',
        'Tu pago se ha procesado correctamente.',
        [{ text: 'Continuar', onPress: () => navigation.navigate('Map') }]
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchActualPlan();
    }
  }, [user]);

  return (
    <StripeProvider publishableKey="pk_test_51R4l53COc5nj88VcYd6SLzaAhHazLwG2eu4s7HcQOqYB7H1BolfivjPrFzeedbiZuJftKEZYdozfe6Dmo7wCP5lA00rN9xJSro">
      {subscriptionPlan === 'PREMIUM' ? (
        <View style={styles.premiumContainer}>
          <Text style={styles.premiumTitle}>Enhorabuena, ya eres miembro Premium</Text>
          <Text style={styles.premiumDescription}>
            Ahora puedes disfrutar de todas las características exclusivas, incluyendo acceso ilimitado a mapas y estadísticas avanzadas. ¡Gracias por ser parte de nuestra comunidad Premium!
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.buttonText}>Ir a mi mapa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.subscriptionContainer}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setIsPricingTableOpen((prev) => !prev)}
          >
            <Text style={styles.collapsibleHeaderText}>
              {isPricingTableOpen ? 'Ocultar planes' : 'Ver planes'}
            </Text>
          </TouchableOpacity>
          {isPricingTableOpen && (
            <View style={styles.pricingTableWrapper}>
              <PricingTable />
            </View>
          )}
          <Text style={styles.title}>Hazte Premium Ahora</Text>
          <Pressable style={styles.button} onPress={openPaymentSheet} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Pagar con Stripe'}</Text>
          </Pressable>
        </View>
      )}
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  premiumContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    margin: 16,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  subscriptionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  pricingTableWrapper: {
    height: 250,
    width: '100%',
    marginBottom: 16,
  },
  collapsibleHeader: {
    backgroundColor: '#14b8a6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  collapsibleHeaderText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: 16,
    textAlign: 'center',
    marginTop: 80,
  },
  button: {
    backgroundColor: '#14b8a6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SubscriptionScreen;
