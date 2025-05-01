/**
 * profile.mocks.ts
 * 
 * Archivo de pruebas para el servicio de perfil, usando mocks.
 * Para ejecutarlo: 
 *   npx ts-node -r tsconfig-paths/register src/tests/profile.mocks.ts
 */

import {
  getUserProfile,
  updateUserProfile,
  updateUserPicture,
  searchUsers,
} from '../services/profile.service';

import { UserProfile } from '../models/userProfile.model';
import { UserProfileRepository } from '../repositories/userProfile.repository';
import { AppDataSource } from '../../../database/appDataSource';

const RabbitMQ = require('../../../../shared/libs/rabbitmq');
RabbitMQ.publishEvent = async (eventName: string, data: any): Promise<void> => {
  console.log(`Mock publishEvent called with event: ${eventName}`);
  console.log(JSON.stringify(data, null, 2));
  return Promise.resolve();
};

AppDataSource.initialize()
  .then(() => {
    console.log('DataSource initialized successfully');
    runAllTests();
  })
  .catch((error) => {
    console.error('Error initializing DataSource:', error);
  });

const mockProfiles: Map<string, UserProfile> = new Map();

const testUserId = '12345';
const testProfile: UserProfile = {
  id: testUserId,
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  picture: 'https://example.com/picture.jpg'
};

mockProfiles.set(testUserId, { ...testProfile });


UserProfileRepository.prototype.findById = async function (id: string): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.findById called with: ${id}`);
  return mockProfiles.get(id) || null;
};

UserProfileRepository.prototype.findByUsername = async function (username: string): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.findByUsername called with: ${username}`);
  const profile = Array.from(mockProfiles.values()).find(p => p.username === username);
  return profile || null;
};

UserProfileRepository.prototype.create = async function (userData: Partial<UserProfile>): Promise<UserProfile> {
  console.log(`Mock UserProfileRepository.create called with data:`, userData);
  const newProfile = { ...userData, id: 'new-id' } as UserProfile;
  mockProfiles.set(newProfile.id, newProfile);
  return newProfile;
};

UserProfileRepository.prototype.update = async function (id: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
  console.log(`Mock UserProfileRepository.update called for id: ${id}`);
  const existing = mockProfiles.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...data };
  mockProfiles.set(id, updated);
  return updated;
};

UserProfileRepository.prototype.search = async function (query: string, limit: number, offset: number): Promise<[UserProfile[], number]> {
  console.log(`Mock UserProfileRepository.search called with query="${query}", limit=${limit}, offset=${offset}`);
  const results = Array.from(mockProfiles.values()).filter(p =>
    p.username.includes(query) ||
    p.firstName.includes(query) ||
    p.lastName.includes(query)
  );
  return [results.slice(offset, offset + limit), results.length];
};

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

async function testUpdateUserProfile() {
  console.log('\n--- Prueba de updateUserProfile ---');
  try {
    const updateData = {
      username: 'updateduser',
      firstName: 'Updated',
      lastName: 'User'
    };
    const updatedProfile = await updateUserProfile(testUserId, updateData);
    console.log('Perfil actualizado:');
    console.log(JSON.stringify(updatedProfile, null, 2));
  } catch (error) {
    console.error('Error en updateUserProfile:', error);
  }
}

async function testUpdateUserPicture() {
  console.log('\n--- Prueba de updateUserPicture ---');
  try {
    const base64Data = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABA...';
    const resultBase64 = await updateUserPicture(testUserId, base64Data);
    console.log('Resultado de actualizar picture (base64):');
    console.log(JSON.stringify(resultBase64, null, 2));
    const urlData = 'https://example.com/new-picture.jpg';
    const resultURL = await updateUserPicture(testUserId, urlData);
    console.log('Resultado de actualizar picture (URL):');
    console.log(JSON.stringify(resultURL, null, 2));
  } catch (error) {
    console.error('Error en testUpdateUserPicture:', error);
  }
}

async function testSearchUsers() {
  console.log('\n--- Prueba de searchUsers ---');
  try {
    mockProfiles.set('user2', {
      id: 'user2',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      picture: 'https://example.com/johndoe.jpg'
    });
    const searchResult = await searchUsers('user', 5, 0);
    console.log('Resultado de búsqueda:');
    console.log(JSON.stringify(searchResult, null, 2));
  } catch (error) {
    console.error('Error en searchUsers:', error);
  }
}

async function runAllTests() {
  try {
    await testGetUserProfile();
    await testUpdateUserProfile();
    await testUpdateUserPicture();
    await testSearchUsers();
    console.log('\n--- Todos los tests completados ---');
  } catch (error) {
    console.error('Error en los tests:', error);
  }
}

export { runAllTests };
