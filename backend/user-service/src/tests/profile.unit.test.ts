import {
    getUserProfile,
    updateUserProfile,
    updateUserPicture,
    searchUsers,
    createUserProfile
  } from '../services/profile.service';
  import { UserProfileRepository } from '../repositories/userProfile.repository';
  
  jest.mock('../repositories/userProfile.repository', () => {
    const mockRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      findByUsername: jest.fn(),
      search: jest.fn(),
      create: jest.fn()
    };
    return {
      UserProfileRepository: jest.fn().mockImplementation(() => mockRepo)
    };
  });
  
  describe('UserProfile Service', () => {
    let repoInstance: any;

    let errorSpy: jest.SpyInstance;

    beforeAll(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });
    
    afterAll(() => {
        errorSpy.mockRestore();
    });
  
    beforeEach(() => {
      jest.clearAllMocks();
      const UserProfileRepositoryMock = UserProfileRepository as jest.Mock;
      new UserProfileRepositoryMock();
      repoInstance = UserProfileRepositoryMock.mock.results[0].value;
    });
  
    describe('getUserProfile', () => {
      it('debe retornar un perfil de usuario para un ID válido', async () => {
        const dummyProfile = {
          id: 'profile1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          picture: 'http://example.com/picture.jpg'
        };
        repoInstance.findById.mockResolvedValue(dummyProfile);
  
        const result = await getUserProfile('profile1');
        expect(result).toEqual(dummyProfile);
        expect(repoInstance.findById).toHaveBeenCalledWith('profile1');
      });
  
      it('debe retornar null si no se encuentra el perfil', async () => {
        repoInstance.findById.mockResolvedValue(null);
  
        const result = await getUserProfile('nonexistent');
        expect(result).toBeNull();
        expect(repoInstance.findById).toHaveBeenCalledWith('nonexistent');
      });
  
      it('debe lanzar error si ocurre un problema al obtener el perfil', async () => {
        repoInstance.findById.mockRejectedValue(new Error('Database error'));
  
        await expect(getUserProfile('profile1')).rejects.toThrow(
          'No se pudo obtener el perfil: Database error'
        );
      });
    });
  
    describe('updateUserProfile', () => {
      const profileId = 'profile1';
      const existingProfile = {
        id: profileId,
        username: 'olduser',
        firstName: 'Old',
        lastName: 'User',
        picture: 'http://example.com/old.jpg'
      };
  
      it('debe actualizar el perfil exitosamente sin cambio de username', async () => {
        repoInstance.findById.mockResolvedValue(existingProfile);
        repoInstance.update.mockResolvedValue({
          ...existingProfile,
          firstName: 'New'
        });
  
        const result = await updateUserProfile(profileId, { firstName: 'New' });
        expect(result).toEqual({
          ...existingProfile,
          firstName: 'New'
        });
        expect(repoInstance.findById).toHaveBeenCalledWith(profileId);
        expect(repoInstance.update).toHaveBeenCalledWith(profileId, { firstName: 'New' });
      });
  
      it('debe lanzar error si el nuevo username ya está en uso', async () => {
        const newUsername = 'newuser';
        const existingOtherProfile = { id: 'profile2', username: newUsername };
  
        repoInstance.findById.mockResolvedValue(existingProfile);
        repoInstance.findByUsername.mockResolvedValue(existingOtherProfile);
  
        await expect(
          updateUserProfile(profileId, { username: newUsername })
        ).rejects.toThrow('El nombre de usuario ya está en uso');
      });
  
      it('debe retornar null si el perfil no existe', async () => {
        repoInstance.findById.mockResolvedValue(null);
  
        const result = await updateUserProfile(profileId, { firstName: 'New' });
        expect(result).toBeNull();
        expect(repoInstance.findById).toHaveBeenCalledWith(profileId);
      });
  
      it('debe lanzar error si ocurre un problema al actualizar el perfil', async () => {
        repoInstance.findById.mockResolvedValue(existingProfile);
        repoInstance.update.mockResolvedValue(null);
  
        await expect(
          updateUserProfile(profileId, { firstName: 'New' })
        ).rejects.toThrow('Error al actualizar el perfil');
      });
    });
  
    describe('updateUserPicture', () => {
      const profileId = 'profile1';
      const existingProfile = {
        id: profileId,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        picture: 'http://example.com/old.jpg'
      };
  
      it('debe actualizar la imagen usando base64', async () => {
        repoInstance.findById.mockResolvedValue(existingProfile);
        const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
        repoInstance.update.mockResolvedValue({
          ...existingProfile,
          picture: expect.stringContaining(`https://storage.example.com/pictures/${profileId}-`)
        });
  
        const result = await updateUserPicture(profileId, base64Image);
        expect(result.success).toBe(true);
        expect(result.pictureUrl).toContain(`https://storage.example.com/pictures/${profileId}-`);
        expect(repoInstance.update).toHaveBeenCalledWith(profileId, { picture: result.pictureUrl });
      });
  
      it('debe actualizar la imagen usando URL', async () => {
        repoInstance.findById.mockResolvedValue(existingProfile);
        const urlImage = 'https://example.com/new-picture.jpg';
        repoInstance.update.mockResolvedValue({
          ...existingProfile,
          picture: urlImage
        });
  
        const result = await updateUserPicture(profileId, urlImage);
        expect(result.success).toBe(true);
        expect(result.pictureUrl).toEqual(urlImage);
        expect(repoInstance.update).toHaveBeenCalledWith(profileId, { picture: urlImage });
      });
  
      it('debe lanzar error si el perfil no se encuentra', async () => {
        repoInstance.findById.mockResolvedValue(null);
        await expect(
          updateUserPicture(profileId, 'https://example.com/new-picture.jpg')
        ).rejects.toThrow('Perfil no encontrado');
      });
  
      it('debe lanzar error si el formato de imagen no es soportado', async () => {
        repoInstance.findById.mockResolvedValue(existingProfile);
        await expect(
          updateUserPicture(profileId, 'invalidFormatImage')
        ).rejects.toThrow('Formato de imagen no soportado');
      });
  
      it('debe lanzar error si ocurre un problema al actualizar la imagen', async () => {
        repoInstance.findById.mockResolvedValue(existingProfile);
        const urlImage = 'https://example.com/new-picture.jpg';
        repoInstance.update.mockResolvedValue(null);
  
        await expect(
          updateUserPicture(profileId, urlImage)
        ).rejects.toThrow('Error al actualizar la imagen');
      });
    });
  
    describe('searchUsers', () => {
      it('debe lanzar error si la consulta es menor a 3 caracteres', async () => {
        await expect(searchUsers('ab')).rejects.toThrow(
          'La consulta de búsqueda debe tener al menos 3 caracteres'
        );
      });
  
      it('debe retornar usuarios y total', async () => {
        const dummyUsers = [
          { id: '1', username: 'user1', firstName: 'User', lastName: 'One', picture: 'pic1' },
          { id: '2', username: 'user2', firstName: 'User', lastName: 'Two', picture: 'pic2' }
        ];
        const total = 2;
        repoInstance.search.mockResolvedValue([dummyUsers, total]);
  
        const result = await searchUsers('user');
        expect(result.users).toEqual(dummyUsers);
        expect(result.total).toEqual(total);
        expect(repoInstance.search).toHaveBeenCalledWith('user', 10, 0);
      });
  
      it('debe manejar errores en la búsqueda', async () => {
        repoInstance.search.mockRejectedValue(new Error('Database error'));
        await expect(searchUsers('user')).rejects.toThrow(
          'No se pudo realizar la búsqueda: Database error'
        );
      });
    });
  
    describe('createUserProfile', () => {
      it('debe crear un nuevo perfil exitosamente', async () => {
        const profileData = {
          username: 'newuser',
          firstName: 'New',
          lastName: 'User',
          picture: 'http://example.com/pic.jpg'
        };
        const createdProfile = {
          id: 'profile1',
          ...profileData
        };
        repoInstance.create.mockResolvedValue(createdProfile);
  
        const result = await createUserProfile(profileData);
        expect(result).toEqual(createdProfile);
        expect(repoInstance.create).toHaveBeenCalledWith(profileData);
      });
  
      it('debe lanzar error si ocurre un problema al crear el perfil', async () => {
        repoInstance.create.mockRejectedValue(new Error('Creation error'));
        await expect(createUserProfile({ username: 'failuser' })).rejects.toThrow(
          'No se pudo crear el perfil: Creation error'
        );
      });
    });
  });
  