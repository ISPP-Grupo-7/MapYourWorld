// pricingStyle.ts

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    color: '#fff',

  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tableContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginBottom: 20,
  },
  tableTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 15,
    backgroundColor: '#F1F5F9',
    color: '#2B3A67',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E9F0',
    borderBottomWidth: 1,
    borderColor: '#CCC',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#F2F4F7',
    paddingVertical: 12,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCell: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 14,
    color: '#4B5563',
  },
  cellText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#2B3A67',
  },
  premiumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  premiumTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#3B82F6', 
    marginBottom: 20,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  checkoutForm: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardElement: {
    width: '100%',
    marginBottom: 20,
  },
});

export default styles;
