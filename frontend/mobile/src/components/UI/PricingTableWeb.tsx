// src/components/PricingTableWeb.jsx
import React from 'react';

const PLANES = [
  { feature: 'Visualización de mapa personal', free: true, premium: true },
  { feature: 'Exploración de zonas no descubiertas', free: true, premium: true },
  { feature: 'Registro de puntos de interés', free: 'Un solo punto por zona', premium: 'Ilimitados' },
  { feature: 'Mapas colaborativos', free: 'Unión de mapas únicamente', premium: 'Creación y unión' },
  { feature: 'Sistema social', free: true, premium: true },
  { feature: 'Logros', free: 'Solo completitud', premium: 'Completitud y creación' },
  { feature: 'Estadísticas', free: false, premium: true },
  { feature: 'Sin anuncios', free: false, premium: true },
];

const renderValue = (value: string | boolean) => {
  if (typeof value === 'boolean') {
    return value ? '✅' : '❌';
  }
  return value;
};

import { CSSProperties } from 'react';

const styles: { [key: string]: CSSProperties } = {
  container: {
    margin: '20px auto',
    maxWidth: '800px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0d9488',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'center',
  },
  td: {
    border: '1px solid #ddd',
    padding: '12px',
    textAlign: 'center',
  },
  featureColumn: {
    textAlign: 'left',
    fontWeight: 'bold',
  },
};

const PricingTableWeb = () => {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Comparativa de Planes</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.featureColumn }}></th>
            <th style={styles.th}>Gratuito</th>
            <th style={styles.th}>Premium</th>
          </tr>
        </thead>
        <tbody>
          {PLANES.map((item) => (
            <tr key={item.feature}>
              <td style={{ ...styles.td, ...styles.featureColumn }}>{item.feature}</td>
              <td style={styles.td}>{renderValue(item.free)}</td>
              <td style={styles.td}>{renderValue(item.premium)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PricingTableWeb;
