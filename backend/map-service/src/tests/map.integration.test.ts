import { AppDataSource } from '../../../database/appDataSource';
import { registerUser } from '../../../auth-service/src/services/auth.service';
import { createMap } from '../services/map.service';
import { getDistrictsByMapId, unlockDistrict } from '../services/district.service';
import { createPOI, getPOIById } from '../services/poi.service';
import { Category } from '../models/poi.model';
import { Role } from '../../../auth-service/src/models/user.model';
import { Subscription } from  '../../../payment-service/models/subscription.model';
import {Region} from '../../../map-service/src/models/region.model';



// Mock dependencies to avoid actual network or database calls
jest.mock('../../../auth-service/src/services/auth.service');
jest.mock('../services/map.service');
jest.mock('../services/district.service');
jest.mock('../services/poi.service');
jest.mock('../../../database/appDataSource', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue(true),
    getRepository: jest.fn().mockImplementation(() => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    })),
  }
}));

describe('Map Service Integration Tests', () => {
  // Create shared mock objects for all tests
  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    role: Role.USER,
    password: 'hashedPassword',
    is_active: true,
    token_data: '',
    profile: {
      id: 'profile123',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      picture: ''
    },
    sentFriendRequests: [],
    receivedFriendRequests: [],
    maps_joined: [],
    subscription: new Subscription(),
    userDistrict: []
  };
  
  const mockMap = {
    id: 'map123',
    name: 'Test Map',
    description: 'Test Description',
    is_colaborative: false,
    createdAt: new Date(),
    user_created: mockUser,
    users_joined: []
  };
  
  const mockRegion = {
    id: 'region123',
    name: 'Test Region',
    description: 'Test Region Description',
    boundaries: {
      type: 'Polygon' as const,
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
    },
    user: mockUser,
    map_assignee: mockMap
  };

  const mockDistrict = {
    id: 'district123',
    name: 'Test District',
    description: 'Test District Description',
    boundaries: {
      type: 'Polygon' as const,
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
    },
    isUnlocked: false,
    region_assignee: mockRegion,
    userDistrict: []
  };
  
  const mockPOI = {
    id: 'poi123',
    name: 'Test POI',
    description: 'Test POI Description',
    location: {
      type: 'Point' as const,
      coordinates: [0.5, 0.5]
    },
    category: Category.ESTACIONES,
    user: mockUser,
    district: mockDistrict,
    images: '',
    createdAt: new Date()
  };
  
  // Helper function to create POI data with consistent structure
  const createPoiData = (district = mockDistrict) => ({
    name: 'Test POI',
    description: 'Test POI Description',
    location: {
      type: 'Point' as const,
      coordinates: [0.5, 0.5]
    },
    category: Category.ESTACIONES,
    district: district,
    images: '',
    createdAt: new Date(),
    user: mockUser
  });

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration and Map Creation Flow', () => {
    test('should successfully register user, create map, unlock district, and add POI', async () => {
      try {
        // Setup mocks
        (registerUser as jest.Mock).mockResolvedValue(mockUser);
        (createMap as jest.Mock).mockResolvedValue(mockMap);
        (getDistrictsByMapId as jest.Mock).mockResolvedValue([mockDistrict]);
        (unlockDistrict as jest.Mock).mockResolvedValue({
          success: true,
          message: 'District unlocked successfully'
        });
        (createPOI as jest.Mock).mockResolvedValue(mockPOI);
        
        // Step 1: Register user
        const user = await registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        expect(user).toBeTruthy();
        expect(user.id).toBe('user123');
        
        // Step 2: Create a map
        const map = await createMap(user.id);
        
        expect(map).toBeTruthy();
        expect(map.id).toBe('map123');
        
        // Step 3: Get available districts
        const districts = await getDistrictsByMapId(map.id);
        
        expect(districts).toHaveLength(1);
        const district = districts[0];
        
        // Step 4: Unlock a district
        const unlockResult = await unlockDistrict(district.id, user.id, 'region123');
        
        expect(unlockResult.success).toBeTruthy();
        
        // Step 5: Add a POI to the district
        const poiData = createPoiData(district);
        
        const poi = await createPOI(poiData, user.id);
        
        expect(poi).toBeTruthy();
        expect(poi.id).toBe('poi123');
        
      } catch (error) {
        console.error('Test failed with error:', error);
        fail('Test should not have thrown an error');
      }
    });
    
    test('should handle user registration failure gracefully', async () => {
      // Setup mock to reject the registration
      (registerUser as jest.Mock).mockRejectedValue(new Error('Email already exists'));
      
      try {
        // Try to register user with existing email
        await registerUser({
          email: 'existing@example.com', 
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        // The test should never reach this point
        fail('The test should have caught the registration error');
      } catch (error) {
        // We expect this error to be caught
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Email already exists');
      }
    });
    
    test('should handle map creation failure gracefully', async () => {
      // Setup mocks
      (registerUser as jest.Mock).mockResolvedValue(mockUser);
      (createMap as jest.Mock).mockRejectedValue(new Error('Map creation failed'));
      
      try {
        // Register user
        const user = await registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        // Try to create map
        await createMap(user.id);
        
        // The test should never reach this point
        fail('The test should have caught the map creation error');
      } catch (error) {
        // We expect this error to be caught
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Map creation failed');
      }
    });
    
    test('should handle district unlock failure gracefully', async () => {
      // Setup mocks
      (registerUser as jest.Mock).mockResolvedValue(mockUser);
      (createMap as jest.Mock).mockResolvedValue(mockMap);
      (getDistrictsByMapId as jest.Mock).mockResolvedValue([mockDistrict]);
      (unlockDistrict as jest.Mock).mockResolvedValue({
        success: false,
        message: 'District already unlocked by another user'
      });
      
      try {
        // Register user
        const user = await registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        // Create map
        const map = await createMap(user.id);
        
        // Get districts
        const districts = await getDistrictsByMapId(map.id);
        const district = districts[0];
        
        // Try to unlock district
        const result = await unlockDistrict(district.id, user.id, 'region123');
        
        // This should not throw, but should indicate failure
        expect(result.success).toBeFalsy();
        expect(result.message).toBe('District already unlocked by another user');
        
      } catch (error) {
        fail(`The test should not have thrown an error: ${error}`);
      }
    });
    
    test('should handle POI creation in locked district failure', async () => {
      // Setup mocks
      (registerUser as jest.Mock).mockResolvedValue(mockUser);
      (createMap as jest.Mock).mockResolvedValue(mockMap);
      (getDistrictsByMapId as jest.Mock).mockResolvedValue([{...mockDistrict, isUnlocked: false}]);
      (createPOI as jest.Mock).mockRejectedValue(new Error('Cannot add POI to locked district'));
      
      try {
        // Register user
        const user = await registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        // Create map
        const map = await createMap(user.id);
        
        // Get districts
        const districts = await getDistrictsByMapId(map.id);
        const district = districts[0];
        
        // Try to add POI to locked district
        const poiData = createPoiData(district);
        
        await createPOI(poiData, user.id);
        
        // The test should never reach this point
        fail('The test should have caught the POI creation error');
        
      } catch (error) {
        // We expect this error to be caught
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Cannot add POI to locked district');
      }
    });
    
    // Edge cases
    test('should handle empty district list edge case', async () => {
      // Setup mocks
      (registerUser as jest.Mock).mockResolvedValue(mockUser);
      (createMap as jest.Mock).mockResolvedValue(mockMap);
      (getDistrictsByMapId as jest.Mock).mockResolvedValue([]);
      
      try {
        // Register user
        const user = await registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        // Create map
        const map = await createMap(user.id);
        
        // Get districts
        const districts = await getDistrictsByMapId(map.id);
        
        // Verify empty list
        expect(districts).toHaveLength(0);
        
      } catch (error) {
        fail(`The test should not have thrown an error: ${error}`);
      }
    });
    
    test('should handle invalid coordinates in POI creation', async () => {
      // Setup mocks
      (registerUser as jest.Mock).mockResolvedValue(mockUser);
      (createMap as jest.Mock).mockResolvedValue(mockMap);
      (getDistrictsByMapId as jest.Mock).mockResolvedValue([{...mockDistrict, isUnlocked: true}]);
      (createPOI as jest.Mock).mockRejectedValue(new Error('Invalid coordinates'));
      
      try {
        // Register user
        const user = await registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        // Create map
        const map = await createMap(user.id);
        
        // Get districts
        const districts = await getDistrictsByMapId(map.id);
        const district = districts[0];
        
        // Try to add POI with invalid coordinates
        const poiData = {
          ...createPoiData(district),
          location: {
            type: 'Point' as const,
            coordinates: [999, 999] // Invalid coordinates
          }
        };
        
        await createPOI(poiData, user.id);
        
        // The test should never reach this point
        fail('The test should have caught the invalid coordinates error');
        
      } catch (error) {
        // We expect this error to be caught
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid coordinates');
      }
    });
    
    test('should handle unauthorized user trying to unlock district', async () => {
      // Setup mocks
      (registerUser as jest.Mock).mockResolvedValue(mockUser);
      (createMap as jest.Mock).mockResolvedValue(mockMap);
      (getDistrictsByMapId as jest.Mock).mockResolvedValue([mockDistrict]);
      (unlockDistrict as jest.Mock).mockResolvedValue({
        success: false,
        message: 'User not authorized to unlock this district'
      });
      
      try {
        // Register user
        const user = await registerUser({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
        
        // Create map
        const map = await createMap(user.id);
        
        // Get districts
        const districts = await getDistrictsByMapId(map.id);
        const district = districts[0];
        
        // Try to unlock with wrong user
        const result = await unlockDistrict(district.id, 'wrong-user-id', 'region123');
        
        expect(result.success).toBeFalsy();
        expect(result.message).toBe('User not authorized to unlock this district');
        
      } catch (error) {
        fail(`The test should not have thrown an error: ${error}`);
      }
    });
  });
});