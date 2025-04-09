// src/components/PricingTable.tsx

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import styles from '../../assets/styles/pricingStyle'; 

type Plan = {
  feature: string;
  free: boolean | string;
  premium: boolean | string;
};

const PLANES: Plan[] = [
  { feature: 'Visualización de mapa personal', free: true, premium: true },
  { feature: 'Exploración de zonas no descubiertas', free: true, premium: true },
  { feature: 'Registro de puntos de interés', free: 'Un solo punto por zona', premium: 'Ilimitado' },
  { feature: 'Mapas colaborativos', free: 'Unión de mapas únicamente', premium: 'Creación y unión' },
  { feature: 'Sistema social', free: true, premium: true },
  { feature: 'Logros', free: 'Solo completitud', premium: 'Completitud y creación' },
  { feature: 'Estadísticas', free: false, premium: true },
  { feature: 'Sin anuncios', free: false, premium: true },
];

const PricingTable = () => {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return <Text style={styles.cellText}>{value ? '✅' : '❌'}</Text>;
    }
    return <Text style={styles.cellText}>{value}</Text>;
  };

  return (
    <View style={styles.tableContainer}>
      <Text style={styles.tableTitle}>Planes</Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.cell, styles.headerCell, { flex: 1.5 }]}></Text>
        <Text style={[styles.cell, styles.headerCell]}>Gratuito</Text>
        <Text style={[styles.cell, styles.headerCell]}>Premium</Text>
      </View>
      <FlatList
        data={PLANES}
        keyExtractor={(item) => item.feature}
        nestedScrollEnabled={true}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text style={[styles.cell, { flex: 2, fontSize: 15 }]}>{item.feature}</Text>
            <View style={styles.cell}>{renderValue(item.free)}</View>
            <View style={styles.cell}>{renderValue(item.premium)}</View>
          </View>
        )}
      />
    </View>
  );
};

export default PricingTable;
