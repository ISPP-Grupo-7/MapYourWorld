/**
 * user.mocks.ts
 * 
 * Archivo de pruebas para el servicio de usuario, usando mocks.
 * Para ejecutarlo:
 *   npx ts-node -r tsconfig-paths/register src/tests/user.mocks.ts
 */

import { subscribeToPremium, updateUserSettings } from '../services/user.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/user.model';

const RabbitMQ = require('@shared/libs/rabbitmq');
RabbitMQ.publishEvent = async (eventName: string, data: any): Promise<void> => {
  console.log(`Mock publishEvent llamado con evento: ${eventName}`);
  console.log(JSON.stringify(data, null, 2));
  return Promise.resolve();
};

const mockUsers: Map<string, any> = new Map();

const testUserId = 'user123';
const testUser = {
  _id: testUserId,
  userId: testUserId,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  plan: 'free',
  active: true,
  bio: 'Este es un usuario de prueba',
  avatarUrl: 'https://example.com/avatar.jpg',
  location: 'Test City',
  preferences: {
    theme: 'light',
    notifications: true,
    privacy: {
      showLocation: true,
      showActivity: true,
    },
  },
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

mockUsers.set(testUserId, { ...testUser });


UserRepository.prototype.findByUserId = async function (userId: string): Promise<any> {
  console.log(`Mock UserRepository.findByUserId llamado con: ${userId}`);
  return mockUsers.get(userId) || null;
};

UserRepository.prototype.updatePlan = async function (userId: string, plan: string): Promise<any> {
  console.log(`Mock UserRepository.updatePlan llamado con: ${userId}, plan: ${plan}`);
  const existing = mockUsers.get(userId);
  if (!existing) return null;
  const updated = { ...existing, plan, updatedAt: new Date() };
  mockUsers.set(userId, updated);
  return updated;
};

UserRepository.prototype.updatePreferences = async function (userId: string, updateData: any): Promise<any> {
  console.log(`Mock UserRepository.updatePreferences llamado con: ${userId}`);
  console.log(JSON.stringify(updateData, null, 2));
  const existing = mockUsers.get(userId);
  if (!existing) return null;

  const updatedPreferences = { ...existing.preferences };

  Object.keys(updateData).forEach(key => {
    if (key.startsWith('preferences.')) {
      const nestedKey = key.substring('preferences.'.length);
      if (nestedKey.includes('.')) {

        const [parentKey, childKey] = nestedKey.split('.');
        updatedPreferences[parentKey] = {
          ...updatedPreferences[parentKey],
          [childKey]: updateData[key]
        };
      } else {

        updatedPreferences[nestedKey] = updateData[key];
      }
    } else {

      updatedPreferences[key] = updateData[key];
    }
  });

  const updated = { ...existing, preferences: updatedPreferences, updatedAt: new Date() };
  mockUsers.set(userId, updated);
  return updated;
};


async function testSubscribeToPremium() {
  console.log('\n--- Prueba de subscribeToPremium ---');
  try {
    const paymentData = {
      cardNumber: '4111111111111111',
      expiry: '12/24',
      cvv: '123'
    };
    const result = await subscribeToPremium(testUserId, 'mensual', paymentData);
    console.log('Resultado subscribeToPremium:', result);
    const updatedUser = mockUsers.get(testUserId);
    console.log('Plan actualizado:', updatedUser.plan);
  } catch (error) {
    console.error('Error en subscribeToPremium:', error);
  }
}

async function testUpdateUserSettings() {
  console.log('\n--- Prueba de updateUserSettings ---');
  try {
    const settings = {
      theme: 'dark',
      notifications: false,
      privacy: {
        showLocation: false,
        showActivity: false,
      },
    };
    const result = await updateUserSettings(testUserId, settings);
    console.log('Resultado updateUserSettings:', result);
    const updatedUser = mockUsers.get(testUserId);
    console.log('Preferencias actualizadas:', updatedUser.preferences);
  } catch (error) {
    console.error('Error en updateUserSettings:', error);
  }
}

async function runAllTests() {
  try {
    await testSubscribeToPremium();
    await testUpdateUserSettings();
    console.log('\n--- Todos los tests completados ---');
  } catch (error) {
    console.error('Error en los tests:', error);
  }
}

runAllTests();
