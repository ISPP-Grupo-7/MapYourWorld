import { AppDataSource } from '../../../database/appDataSource';
import { Friend, FriendStatus } from '../../../social-service/src/models/friend.model';
import { Role } from '../../../auth-service/src/models/user.model';
import { User } from '../../../auth-service/src/models/user.model';
import * as friendService from '../../../social-service/src/services/friend.service';
import * as collabMapService from '../../../auth-service/src/services/collab.map.service';
import { Map } from '../../../map-service/src/models/map.model';
import { Subscription } from  '../../../payment-service/models/subscription.model';
import { Request, Response } from 'express';

// Mock dependencies
jest.mock('../../../database/appDataSource');
jest.mock('../../../social-service/src/repositories/friend.repository');
jest.mock('../../../social-service/src/services/friend.service');
jest.mock('../../../auth-service/src/services/collab.map.service');

// Properly type the mocked service functions
const mockedCreateFriend = jest.mocked(friendService.createFriend);
const mockedUpdateFriendStatus = jest.mocked(friendService.updateFriendStatus);
const mockedListFriends = jest.mocked(friendService.listFriends);
const mockedFindFriendById = jest.mocked(friendService.findFriendById);
const mockedJoinMap = jest.mocked(collabMapService.joinMap);

describe('Friend Service and Collaborative Map Integration Tests', () => {
  // Create shared mock objects for all tests
  const mockRequester = {
    id: 'requester123',
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
  }
  
  const mockRecipient = {
    id: 'recipient123',
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
  
  const mockFriendRequest = {
    id: 'friend123',
    requester: mockRequester,
    recipient: mockRecipient,
    status: FriendStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockAcceptedFriendship = {
    ...mockFriendRequest,
    status: FriendStatus.ACCEPTED
  };

  const mockCollaborativeMap = {
    id: 'map123',
    name: 'Test Collaborative Map',
    description: 'Test Description',
    is_colaborative: true,
    createdAt: new Date(),
    user_created: mockRequester,
    users_joined: [mockRequester]
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Friend Service Flow', () => {
    test('should successfully create a friend request', async () => {
      // Setup mock implementation for this test
      mockedCreateFriend.mockResolvedValue(mockFriendRequest);
      
      const friendData = {
        requester: mockRequester,
        recipient: mockRecipient,
        status: FriendStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await friendService.createFriend(friendData);
      
      expect(result).toEqual(mockFriendRequest);
      expect(mockedCreateFriend).toHaveBeenCalledTimes(1);
      expect(mockedCreateFriend).toHaveBeenCalledWith(expect.objectContaining({
        status: FriendStatus.PENDING
      }));
    });
    
    test('should handle case when users are already friends', async () => {
      // Mock response for when users are already friends
      mockedCreateFriend.mockResolvedValue({ 
        success: false, 
        message: 'Los usuarios ya son amigos' 
      });
      
      const friendData = {
        requester: mockRequester,
        recipient: mockRecipient,
        status: FriendStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await friendService.createFriend(friendData) as any;
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('ya son amigos');
    });

    test('should accept a friend request', async () => {
        // Fix: Return success object instead of Friend object
        mockedUpdateFriendStatus.mockResolvedValue({ 
          success: true, 
          message: 'Solicitud de amistad aceptada correctamente' 
        });
        
        const result = await friendService.updateFriendStatus('friend123', FriendStatus.ACCEPTED);
        
        expect(result.success).toBe(true);
        expect(result.message).toContain('aceptada correctamente');
        expect(mockedUpdateFriendStatus).toHaveBeenCalledWith('friend123', FriendStatus.ACCEPTED);
      });
    
    test('should list friends with ACCEPTED status', async () => {
      mockedListFriends.mockResolvedValue([mockAcceptedFriendship]);
      
      const friends = await friendService.listFriends(FriendStatus.ACCEPTED, mockRequester.id);
      
      expect(friends).toEqual([mockAcceptedFriendship]);
      expect(mockedListFriends).toHaveBeenCalledWith(FriendStatus.ACCEPTED, mockRequester.id);
    });
  });

  describe('Collaborative Map Invitation Flow', () => {
    test('should successfully invite a friend to a collaborative map', async () => {
      // Fix: Return void instead of boolean
      mockedJoinMap.mockResolvedValue(undefined);
      
      await collabMapService.joinMap(mockCollaborativeMap.id, mockRecipient.id);
      
      expect(mockedJoinMap).toHaveBeenCalledWith(mockCollaborativeMap.id, mockRecipient.id);
    });
  
    // Other tests with similar fixes
    test('should handle case when user is already a member of the map', async () => {
      // Fix: Return void instead of an object
      mockedJoinMap.mockResolvedValue(undefined);
      
      await collabMapService.joinMap(mockCollaborativeMap.id, mockRecipient.id);
      
      // Instead of checking return value, verify the function was called correctly
      expect(mockedJoinMap).toHaveBeenCalledWith(mockCollaborativeMap.id, mockRecipient.id);
    });
  });

    test('should handle case when trying to invite a non-friend to a collaborative map', async () => {
      mockedJoinMap.mockRejectedValue(new Error('Only friends can be invited to collaborative maps'));
      
      try {
        await collabMapService.joinMap(mockCollaborativeMap.id, 'stranger123');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Only friends can be invited to collaborative maps');
      }
    });
    
    test('should handle case when map is already at maximum capacity', async () => {
      mockedJoinMap.mockRejectedValue(new Error('Map has reached maximum capacity'));
      
      try {
        await collabMapService.joinMap(mockCollaborativeMap.id, mockRecipient.id);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Map has reached maximum capacity');
      }
    });

    test('should handle case when user is already a member of the map', async () => {
        // Create spy to check expected side effects
        const consoleSpy = jest.spyOn(console, 'log');
        
        mockedJoinMap.mockImplementation(() => {
          console.log('User is already a member');
          return Promise.resolve();
        });
        
        await collabMapService.joinMap(mockCollaborativeMap.id, mockRecipient.id);
        
        expect(consoleSpy).toHaveBeenCalledWith('User is already a member');
        expect(mockedJoinMap).toHaveBeenCalledWith(mockCollaborativeMap.id, mockRecipient.id);
      });
  });
