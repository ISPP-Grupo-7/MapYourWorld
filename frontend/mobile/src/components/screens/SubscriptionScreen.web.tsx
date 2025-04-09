import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { API_URL } from '../../constants/config';
import { useAuth } from '@/contexts/AuthContext';
import PricingTableWeb from '../UI/PricingTableWeb';
import AlertModal from '../UI/Alert';

const stripePromise = loadStripe('pk_test_51R4l53COc5nj88VcYd6SLzaAhHazLwG2eu4s7HcQOqYB7H1BolfivjPrFzeedbiZuJftKEZYdozfe6Dmo7wCP5lA00rN9xJSro');

type SubscriptionPlan = 'PREMIUM' | 'BASIC' | null;

type RootStackParamList = {
  Map: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Map'>;

type CheckoutFormProps = {
  setLoading: (loading: boolean) => void;
  loading: boolean;
  updateSubscription: () => Promise<void>;
};

const SubscriptionScreen: React.FC<{ updateSubscription: () => Promise<void> }> = ({ updateSubscription }) => {
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
      <div
        style={{
          backgroundColor: '#f9fafb',
          margin: '16px auto',
          padding: '16px',
          minWidth: '60%',
          maxWidth: '800px',
          boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
          gap: '16px',
          maxHeight: '80vh', // Altura máxima relativa a la ventana
          overflowY: 'auto', // Habilita el scroll vertical cuando es necesario
        }}
      >
        {subscriptionPlan === 'PREMIUM' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#0d9488',
                marginBottom: '16px',
              }}
            >
              Enhorabuena, ya eres miembro Premium
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              Ahora puedes disfrutar de todas las características exclusivas, incluyendo acceso ilimitado a mapas y estadísticas avanzadas. ¡Gracias por ser parte de nuestra comunidad Premium!
            </p>
            <button
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                backgroundColor: '#14b8a6',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              onClick={() => navigation.navigate('Map')}
            >
              Ir a mi mapa
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', gap: '16px' }}>
              <PricingTableWeb />
            </div>
            <h2
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#0d9488',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              Suscríbete a Premium (5,50€ al mes)
            </h2>
            <CheckoutForm setLoading={setLoading} loading={loading} updateSubscription={updateSubscription} />
          </>
        )}
      </div>
    </Elements>
  );
};

const CheckoutForm: React.FC<CheckoutFormProps> = ({ setLoading, loading, updateSubscription }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const [alertTitle, setAlertTitle] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertActionText, setAlertActionText] = useState<string>('');
  const [alertOnAction, setAlertOnAction] = useState<(() => void) | undefined>(undefined);

  const showAlert = (
    title: string,
    message: string,
    onAction?: () => void,
    actionText?: string
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertActionText(actionText || '');
    setAlertOnAction(() => onAction);
    setAlertVisible(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/stripe/${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 550 }),
      });

      if (!response.ok) throw new Error('Error al crear el PaymentIntent');
      const { paymentIntent } = await response.json();

      if (!stripe || !elements) return;

      const result = await stripe.confirmCardPayment(paymentIntent, {
        payment_method: { card: elements.getElement(CardElement)! },
      });

      if (result.error) {
        console.error(result.error.message);
        alert('Hubo un error al procesar el pago');
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          const updateResponse = await fetch(`${API_URL}/api/subscriptions/upgrade/${user?.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          });
          if (!updateResponse.ok) {
            console.error('Error al actualizar la suscripción');
            return;
          }

          // Llamar a updateSubscription para actualizar el estado en el componente padre
          await updateSubscription();

          showAlert(
            '¡Pago realizado con éxito!',
            'Tu pago se ha procesado correctamente.',
            () => {
              setAlertVisible(false);
              navigation.navigate('Map');
            },
            'Continuar'
          );
        }
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Hubo un error, por favor intenta nuevamente');
    }

    setLoading(false);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          marginTop: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ width: '60%' }}>
            <CardElement
              options={{
                style: {
                  base: {
                    color: '#0d9488',
                    fontSize: '16px',
                    fontFamily: 'sans-serif',
                    '::placeholder': {
                      color: '#94a3b8',
                    },
                    iconColor: '#0d9488',
                  },
                  invalid: {
                    color: '#dc2626',
                    iconColor: '#dc2626',
                  },
                },
                hidePostalCode: true,
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            backgroundColor: '#14b8a6',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            marginTop: '2em',
            width: '50%',
            alignSelf: 'center',
          }}
          disabled={!stripe || loading}
        >
          {loading ? 'Cargando...' : 'Pagar con Stripe'}
        </button>
      </form>

      <AlertModal
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => {}}
        onAction={alertOnAction}
        actionText={alertActionText}
        singleButton={true}
      />
    </>
  );
};

export default SubscriptionScreen;
