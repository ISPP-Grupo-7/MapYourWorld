import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_URL } from '../../constants/config';
import { useAuth } from '@/contexts/AuthContext';
import PricingTable from '../UI/PricingTable';
import styles from '../../assets/styles/pricingStyle'; // Importando los estilos

const stripePromise = loadStripe('pk_test_51R4l53COc5nj88VcYd6SLzaAhHazLwG2eu4s7HcQOqYB7H1BolfivjPrFzeedbiZuJftKEZYdozfe6Dmo7wCP5lA00rN9xJSro');

type SubscriptionPlan = 'PREMIUM' | 'BASIC' | null;

type RootStackParamList = {
  Map: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Map'>;

type CheckoutFormProps = {
  setLoading: (loading: boolean) => void;
  loading: boolean;
};

const SubscriptionScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>(null);
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchActualPlan = async () => {
      try {
        const response = await fetch(`${API_URL}/api/subscriptions/active/${user?.id}`);
        if (!response.ok) throw new Error('Error en la solicitud');
        const data = await response.json();
        setSubscriptionPlan(data?.plan || null);
      } catch (error) {
        console.error('Error al obtener el plan:', error);
      }
    };
    if (user) fetchActualPlan();
  }, [user]);

  return (
    <Elements stripe={stripePromise}>
      <div style={styles.screenContainer}>
        {subscriptionPlan === 'PREMIUM' ? (
          <div style={styles.premiumContainer}>
            <h2 style={styles.premiumTitle}>Enhorabuena, ya eres miembro Premium</h2>
            <p style={styles.premiumDescription}>Ahora puedes disfrutar de todas las características exclusivas, incluyendo acceso ilimitado a mapas y estadísticas avanzadas. ¡Gracias por ser parte de nuestra comunidad Premium!
            </p>
            <button
              style={styles.button}
              onClick={() => navigation.navigate('Map')}
            >
              Ir a mi mapa
            </button>
          </div>
        ) : (
          <>
            <PricingTable />
            <h2 style={styles.title}>Suscríbete a Premium</h2>
            <CheckoutForm setLoading={setLoading} loading={loading} />
          </>
        )}
      </div>
    </Elements>
  );
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({ setLoading, loading }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Hacer la solicitud al backend para crear el PaymentIntent
      const response = await fetch(`${API_URL}/api/stripe/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 550 })  // Aquí defines el monto en centavos
      });

      if (!response.ok) throw new Error('Error al crear el PaymentIntent');
      const { paymentIntent } = await response.json();

      // Si no hay stripe o elements, retornamos
      if (!stripe || !elements) return;

      // Confirmar el pago con el PaymentIntent generado
      const result = await stripe.confirmCardPayment(paymentIntent, {
        payment_method: { card: elements.getElement(CardElement)! }
      });

      // Si hay un error en la confirmación
      if (result.error) {
        console.error(result.error.message);
        alert('Hubo un error al procesar el pago');
      } else {
        // Si el pago es exitoso, actualizamos la suscripción del usuario a "Premium"
        if (result.paymentIntent.status === 'succeeded') {
          console.log('Pago exitoso!');

          // Ahora actualiza la suscripción del usuario a "Premium"
          const updateResponse = await fetch(`${API_URL}/api/subscriptions/upgrade/${user?.id}`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!updateResponse.ok) {
            console.error('Error al actualizar la suscripción');
            return;
          }

          // Redirigir al mapa si todo ha ido bien
          navigation.navigate('Map');
        }
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Hubo un error, por favor intenta nuevamente');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} >
      <CardElement className="card-element" />
      <button
        type="submit"
        style={styles.button}
        disabled={!stripe || loading}
      >
        {loading ? 'Cargando...' : 'Pagar con Stripe'}
      </button>
    </form>
  );
};

export default SubscriptionScreen;
