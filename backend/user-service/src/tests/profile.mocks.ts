/**
 * profile.mocks.ts
 * 
 * Archivo de pruebas para el servicio de perfil, usando mocks.
 * Para ejecutarlo: 
 *   npx ts-node -r tsconfig-paths/register src/tests/profile.mocks.ts
 */

import {
  getUserProfile,
  getPublicUserProfile,
  updateUserProfile,
  updateUserAvatar,
  updateUserPreferences,
  searchUsers,
  deactivateUserAccount,
  reactivateUserAccount,
} from '../services/profile.service';

import { UserProfile } from '../models/userProfile.model';
import { UserProfileRepository } from '../repositories/userProfile.repository';
import { AppDataSource } from '@backend/database/appDataSource';

const RabbitMQ = require('@shared/libs/rabbitmq');
RabbitMQ.publishEvent = async (eventName: string, data: any): Promise<void> => {
  console.log(`Mock publishEvent llamado con evento: ${eventName}`);
  console.log(JSON.stringify(data, null, 2));
  return Promise.resolve();
};

AppDataSource.initialize()
  .then(() => {
    console.log('DataSource inicializado correctamente');
    runAllTests();
  })
  .catch((error) => {
    console.error('Error inicializando DataSource:', error);
  });

const mockProfiles: Map<string, UserProfile> = new Map();

// Perfil de prueba
const testUserId = '12345';
const testProfile: UserProfile = {
  id: testUserId,
  userId: testUserId,
  username: 'testuser',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  bio: 'This is a test user',
  avatar: 'https://example.com/avatar.jpg',
  phone: '+1234567890',
  location: {
    city: 'Test City',
    country: 'Test Country',
    latitude: 40.416775,
    longitude: -3.70379,
  },
  social: {
    instagram: 'testuser',
    twitter: 'testuser',
    facebook: 'testuser',
  },
  preferences: {
    language: 'es',
    theme: 'light',
    notificationsEnabled: true,
    privacySettings: {
      showLocation: true,
      showActivity: true,
      profileVisibility: 'public',
    },
  },
  statistics: {
    totalPoints: 100,
    level: 2,
    districtsUnlocked: 5,
    poisVisited: 10,
    photosUploaded: 5,
    achievements: 3,
    followers: 20,
    following: 15,
  },
  accountStatus: 'active',
  lastActive: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

mockProfiles.set(testUserId, { ...testProfile });

// Sobrescritura de los métodos del UserProfileRepository
UserProfileRepository.prototype.findById = async function (id: string): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.findById llamado con: ${id}`);
  return mockProfiles.get(id) || null;
};

UserProfileRepository.prototype.findByUserId = async function (userId: string): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.findByUserId llamado con: ${userId}`);
  return mockProfiles.get(userId) || null;
};

UserProfileRepository.prototype.findByUsername = async function (username: string): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.findByUsername llamado con: ${username}`);
  const profile = Array.from(mockProfiles.values()).find(p => p.username === username);
  return profile || null;
};

UserProfileRepository.prototype.update = async function (id: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.update llamado para id: ${id}`);
  console.log(JSON.stringify(data, null, 2));
  const existing = mockProfiles.get(id);
  if (!existing) return null;
  // Se conserva userId del registro original
  const updated = { ...existing, ...data, userId: existing.userId, updatedAt: new Date() };
  mockProfiles.set(id, updated);
  return updated;
};

UserProfileRepository.prototype.updateAccountStatus = async function (
  id: string,
  status: 'active' | 'suspended' | 'deactivated'
): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.updateAccountStatus llamado para id: ${id} con estado: ${status}`);
  const existing = mockProfiles.get(id);
  if (!existing) return null;
  const updated = { ...existing, accountStatus: status, updatedAt: new Date() };
  mockProfiles.set(id, updated);
  return updated;
};

UserProfileRepository.prototype.updatePreferences = async function (
  id: string,
  preferences: Partial<UserProfile['preferences']>
): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.updatePreferences llamado para id: ${id}`);
  console.log(JSON.stringify(preferences, null, 2));
  const existing = mockProfiles.get(id);
  if (!existing) return null;
  const updated = { 
    ...existing, 
    preferences: { ...existing.preferences, ...preferences },
    updatedAt: new Date()
  };
  mockProfiles.set(id, updated);
  return updated;
};

UserProfileRepository.prototype.updateAvatar = async function (
  id: string,
  avatarUrl: string
): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.updateAvatar llamado para id: ${id} con URL: ${avatarUrl}`);
  const existing = mockProfiles.get(id);
  if (!existing) return null;
  const updated = { ...existing, avatar: avatarUrl, updatedAt: new Date() };
  mockProfiles.set(id, updated);
  return updated;
};

UserProfileRepository.prototype.search = async function (query: string, limit: number, offset: number): Promise<[UserProfile[], number]> {
  console.log(`Mock UserProfileRepository.search llamado con query="${query}", limit=${limit}, offset=${offset}`);
  const results = Array.from(mockProfiles.values()).filter(p =>
    p.username.includes(query) ||
    p.firstName.includes(query) ||
    p.lastName.includes(query)
  );
  return [results.slice(offset, offset + limit), results.length];
};

// Funciones de test

async function testGetUserProfile() {
  console.log('\n--- Prueba de getUserProfile ---');
  try {
    const profile = await getUserProfile(testUserId);
    console.log('Resultado de getUserProfile:');
    console.log(JSON.stringify(profile, null, 2));
    const nullProfile = await getUserProfile('nonexistent');
    console.log('Resultado con ID inválido:', nullProfile);
  } catch (error) {
    console.error('Error en getUserProfile:', error);
  }
}

async function testGetPublicUserProfile() {
  console.log('\n--- Prueba de getPublicUserProfile ---');
  try {
    const selfView = await getPublicUserProfile(testUserId, testUserId);
    console.log('Perfil visto por uno mismo:');
    console.log(JSON.stringify(selfView, null, 2));
    const publicView = await getPublicUserProfile(testUserId, 'otheruser');
    console.log('\nPerfil público visto por otro usuario:');
    console.log(JSON.stringify(publicView, null, 2));
    // Cambiar la privacidad a "private"
    const current = mockProfiles.get(testUserId)!;
    current.preferences.privacySettings.profileVisibility = 'private';
    mockProfiles.set(testUserId, current);
    const privateView = await getPublicUserProfile(testUserId, 'otheruser');
    console.log('\nPerfil privado visto por otro usuario:');
    console.log(JSON.stringify(privateView, null, 2));
  } catch (error) {
    console.error('Error en getPublicUserProfile:', error);
  }
}

async function testUpdateUserProfile() {
  console.log('\n--- Prueba de updateUserProfile ---');
  try {
    const updateData = {
      username: 'updateduser',
      fullName: 'Updated User',
      bio: 'This is an updated bio',
      location: {
        city: 'New City'
      }
    };
    const updatedProfile = await updateUserProfile(testUserId, updateData);
    console.log('Perfil actualizado:');
    console.log(JSON.stringify(updatedProfile, null, 2));
  } catch (error) {
    console.error('Error en updateUserProfile:', error);
  }
}

async function testUpdateUserPreferences() {
  console.log('\n--- Prueba de updateUserPreferences ---');
  try {
    const newPreferences = {
      theme: 'dark' as 'dark' | 'light' | 'system',
      notificationsEnabled: false,
      privacySettings: {
        showLocation: false,
        showActivity: true,
        profileVisibility: 'public' as 'public' | 'followers' | 'private'
      }
    };
    const updatedPreferences = await updateUserPreferences(testUserId, newPreferences);
    console.log('Preferencias actualizadas:');
    console.log(JSON.stringify(updatedPreferences, null, 2));
  } catch (error) {
    console.error('Error en updateUserPreferences:', error);
  }
}

async function testSearchUsers() {
  console.log('\n--- Prueba de searchUsers ---');
  try {
    // Agregar otro perfil para probar la búsqueda
    mockProfiles.set('user2', {
      ...testProfile,
      id: 'user2',
      userId: 'user2',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe'
    });
    const searchResult = await searchUsers('user', 5, 0);
    console.log('Resultado de búsqueda:');
    console.log(JSON.stringify(searchResult, null, 2));
  } catch (error) {
    console.error('Error en searchUsers:', error);
  }
}

async function testAccountDeactivation() {
  console.log('\n--- Prueba de deactivateUserAccount ---');
  try {
    const deactivated = await deactivateUserAccount(testUserId, 'Usuario solicitó desactivación');
    console.log('Cuenta desactivada:', deactivated);
    const profile = await getUserProfile(testUserId);
    console.log('Estado de la cuenta después de desactivar:', profile?.accountStatus);
    console.log('\n--- Prueba de reactivateUserAccount ---');
    const reactivated = await reactivateUserAccount(testUserId);
    console.log('Cuenta reactivada:', reactivated);
    const updatedProfile = await getUserProfile(testUserId);
    console.log('Estado de la cuenta después de reactivar:', updatedProfile?.accountStatus);
  } catch (error) {
    console.error('Error en pruebas de activación/desactivación:', error);
  }
}

async function testUpdateUserAvatar() {
  console.log('\n--- Prueba de updateUserAvatar ---');
  try {
    const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...';
    const resultBase64 = await updateUserAvatar(testUserId, base64Data);
    console.log('Resultado de actualizar avatar (base64):');
    console.log(JSON.stringify(resultBase64, null, 2));
    const urlData = 'https://example.com/new-avatar.jpg';
    const resultURL = await updateUserAvatar(testUserId, urlData);
    console.log('Resultado de actualizar avatar (URL):');
    console.log(JSON.stringify(resultURL, null, 2));
  } catch (error) {
    console.error('Error en testUpdateUserAvatar:', error);
  }
}

async function runAllTests() {
  try {
    await testGetUserProfile();
    await testGetPublicUserProfile();
    await testUpdateUserProfile();
    await testUpdateUserPreferences();
    await testSearchUsers();
    await testAccountDeactivation();
    await testUpdateUserAvatar();
    console.log('\n--- Todos los tests completados ---');
  } catch (error) {
    console.error('Error en los tests:', error);
  }
}

export { runAllTests };
