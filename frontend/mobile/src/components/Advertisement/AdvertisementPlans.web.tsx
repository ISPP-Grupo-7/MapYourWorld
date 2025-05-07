import React from 'react';
import { CSSProperties } from 'react';

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

const renderFeature = (label: string, value: string | boolean) => {
  if (typeof value === 'boolean') {
    return (
      <div style={styles.feature} key={label}>
        {value ? '✅' : '❌'} {label}
      </div>
    );
  }
  return (
    <div style={styles.feature} key={label}>
      {label}: <span style={styles.detail}>{value}</span>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    margin: '20px',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: '8px',
  },
  price: {
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#0019FF',
    marginBottom: '4px',
  },
  perMonth: {
    fontSize: '16px',
    color: '#666666',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888888',
    marginBottom: '16px',
    textAlign: 'center',
  },
  feature: {
    fontSize: '16px',
    margin: '4px 0',
    textAlign: 'left',
    width: '100%',
  },
  detail: {
    fontWeight: '500',
    color: '#555555',
  },
};

const AdvertisementPlans = () => (
  <div style={styles.container}>
    {plans.map((plan) => (
      <div key={plan.name} style={styles.card}>
        <div style={styles.title}>{plan.name}</div>
        <div style={styles.price}>
          {plan.price}
          <span style={styles.perMonth}>€/mes</span>
        </div>
        <div style={styles.subtitle}>{plan.description}</div>

        {renderFeature('Puntos de interés', `Hasta ${plan.poi} marcador en el mapa`)}
        {renderFeature('Logo y descripción', plan.logo)}
        {renderFeature('Galería de fotos', plan.gallery)}
        {renderFeature('Anuncio', plan.add)}
        {renderFeature('Beneficios extra', plan.extra)}
      </div>
    ))}
  </div>
);

export default AdvertisementPlans;
