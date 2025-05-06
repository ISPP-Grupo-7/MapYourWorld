import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const plans = [
  {
    name: 'Explorador local',
    description: 'Perfecto para pequeñas empresas',
    price: 49,
    poi: 1,
    logo: true,
    gallery: false,
    add: false,
    extra: 'No incluido'
  },
  {
    name: 'Ruta destacada',
    description: 'Señala una ruta que nadie podrá perderse',
    price: 179,
    poi: 5,
    logo: true,
    gallery: true,
    add: false,
    extra: 'Relaciona tus puntos de interés'
  },
  {
    name: 'Destino imperdible',
    description: 'La mejor manera de promocionar tus empresas',
    price: 299,
    poi: 10,
    logo: true,
    gallery: true,
    add: true,
    extra: 'Integra redes y ofertas especiales'
  }
]

const AdvertisementPlans = () => {

  const renderCard = (plan:any) => {
    return (
      <View style={styles.card}>
        <Text style={styles.planTitle}>{plan.name}</Text>
        <Text style={styles.price}>
          <Text style={styles.priceValue}>{plan.price}</Text>€/<Text style={styles.perMonth}>mes</Text>
        </Text>
        <Text style={styles.subtitle}>{plan.description}</Text>
        <View style={styles.featureList}>
          <Text style={styles.feature}>
            ✅ Puntos de interés <Text style={styles.detail}>Hasta {plan.poi} marcador en el mapa</Text>
          </Text>
          <Text style={styles.feature}>{
              plan.logo ? '✅' : '❌'
            } Logo y descripción</Text>
          <Text style={styles.feature}>{
              plan.gallery ? '✅' : '❌'
            } Galería de fotos</Text>
          <Text style={styles.feature}>{
              plan.add ? '✅' : '❌'
            } Anuncio</Text>
          <Text style={styles.feature}>Beneficios extra: {plan.extra}</Text>
      </View>
      </View>
    )
  }

  return (
    <View>
      <Text style={styles.title}>Opciones de inversión</Text>
      {plans.map(p => renderCard(p))}
    </View>
  );
};


const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginBottom: 20,
    borderWidth: 0.25,
    borderRadius: 10,
    borderColor: 'grey'
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10
  },
  planTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 5
  },
  price: {
    textAlign: 'center',
    fontSize: 14,
    color: '#444',
    marginBottom: 4
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0019FF'
  },
  perMonth: {
    fontSize: 18,
    color: '#666'
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    marginBottom: 5
  },
  featureList: {
    margin: 10,
  },
  feature: {
    fontSize: 16,
    marginVertical: 2
  },
  detail: {
    fontSize: 14,
    color: '#888'
  }
});

export default AdvertisementPlans;
