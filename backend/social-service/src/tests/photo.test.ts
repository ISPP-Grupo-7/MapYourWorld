import { Request, Response } from 'express';
import * as PhotoService from '../services/photo.service';
import * as PhotoController from '../controllers/photo.controller';

// Mockear las funciones de PhotoService
jest.mock('../services/photo.service', () => ({
  findAllPhotos: jest.fn(),
  uploadPhotoToPoi: jest.fn(),
  findPhotoById: jest.fn(),
  updatePhoto: jest.fn(),
  deletePhoto: jest.fn(),
  getPhotosByPoiId: jest.fn(),
}));

// Mockear console.error para evitar mensajes de error en los tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Photo Controller Tests', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Inicializar mocks
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock }); // Mockear json dentro de status
    res = { status: statusMock } as Partial<Response>;
    req = {} as Partial<Request>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllPhotos', () => {
    it('debe retornar todas las fotos con éxito', async () => {
      const mockPhotos = [
        { id: '1', poi: { id: 'poi1', name: 'Place 1' }, image: 10, uploadDate: new Date(), caption: 'caption', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', poi: { id: 'poi2', name: 'Place 2' }, image: 20, uploadDate: new Date(), caption: 'caption', createdAt: new Date(), updatedAt: new Date() },
      ];

      // Mockear la función findAllPhotos
      (PhotoService.findAllPhotos as jest.Mock).mockResolvedValue(mockPhotos);

      await PhotoController.findAllPhotos(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Fotos obtenidas correctamente',
        data: mockPhotos,
      });
    });

    it('debe manejar errores al obtener fotos', async () => {
      // Mockear la función findAllPhotos para simular un error
      (PhotoService.findAllPhotos as jest.Mock).mockRejectedValue(new Error('Error en la base de datos'));

      await PhotoController.findAllPhotos(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Error al obtener las fotos',
        data: null,
      });
    });
  });

  describe('uploadPhoto', () => {
    it('debe subir una foto correctamente', async () => {
      const mockPhoto = {
        image: 10,
        caption: 'New Photo',
        uploadDate: new Date(),
        createdAt: new Date(),
        updatedAt: null
      };
      
      const mockResult = {
        id: '1',
        poi: { id: 'poi1', name: 'Place 1' },
        ...mockPhoto
      };
      
      req = {
        params: { poiId: 'poi1' },
        body: { photoData: mockPhoto },
      };

      // Mockear la función uploadPhotoToPoi
      (PhotoService.uploadPhotoToPoi as jest.Mock).mockResolvedValue(mockResult);

      await PhotoController.uploadPhoto(req as Request, res as Response);

      expect(PhotoService.uploadPhotoToPoi).toHaveBeenCalledWith(mockPhoto, 'poi1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Foto subida correctamente',
        data: mockResult
      });
    });

    it('debe manejar errores al subir una foto cuando no hay datos', async () => {
      req = { params: { poiId: 'poi1' }, body: { photoData: null } };

      await PhotoController.uploadPhoto(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'No se encontró ninguna foto',
        data: null
      });
    });

    it('debe manejar falta de poiId', async () => {
      req = { params: {}, body: { photoData: { image: 10, caption: 'New Photo' } } };

      await PhotoController.uploadPhoto(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'No se encontró el punto de interés',
        data: null
      });
    });

    it('debe manejar errores cuando el poi no existe', async () => {
      const mockPhoto = { image: 10, caption: 'New Photo' };
      req = {
        params: { poiId: 'non-existent-poi' },
        body: { photoData: mockPhoto },
      };

      // Simular el error específico que lanza el repositorio cuando el POI no existe
      const error = new Error('Poi con id non-existent-poi no ha sido encontrado');
      (PhotoService.uploadPhotoToPoi as jest.Mock).mockRejectedValue(error);

      await PhotoController.uploadPhoto(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Error al subir la foto',
        data: null
      });
    });
  });

  describe('getPhotoById', () => {
    it('debe retornar una foto correctamente', async () => {
      const mockPhoto = { 
        id: '1', 
        poi: { id: 'poi1', name: 'Place 1' }, 
        image: 10, 
        uploadDate: new Date(), 
        caption: 'caption', 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      req = { params: { photoId: '1' } };

      // Mockear la función findPhotoById
      (PhotoService.findPhotoById as jest.Mock).mockResolvedValue(mockPhoto);

      await PhotoController.getPhotoById(req as Request, res as Response);

      expect(PhotoService.findPhotoById).toHaveBeenCalledWith('1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Foto obtenida correctamente',
        data: mockPhoto,
      });
    });

    it('debe manejar el caso de no encontrar la foto', async () => {
      req = { params: { photoId: 'non-existent-id' } };

      // En este caso, según el repositorio, debería lanzar un error
      const error = new Error('Photo with id non-existent-id not found');
      (PhotoService.findPhotoById as jest.Mock).mockRejectedValue(error);

      await PhotoController.getPhotoById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Error al procesar la solicitud',
        data: null,
      });
    });

    it('debe manejar errores generales al obtener la foto', async () => {
      req = { params: { photoId: '1' } };

      // Mockear la función findPhotoById para simular un error general
      (PhotoService.findPhotoById as jest.Mock).mockRejectedValue(new Error('Error de conexión'));

      await PhotoController.getPhotoById(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Error al procesar la solicitud',
        data: null,
      });
    });
  });

  describe('updatePhoto', () => {
    it('debe actualizar una foto correctamente', async () => {
      const photoData = { caption: 'Updated caption' };
      req = { 
        params: { photoId: '1' },
        body: { photoData }
      };
      
      const updatedPhoto = { 
        id: '1', 
        poi: { id: 'poi1', name: 'Place 1' },
        caption: 'Updated caption', 
        image: 10,
        uploadDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (PhotoService.updatePhoto as jest.Mock).mockResolvedValue(updatedPhoto);

      await PhotoController.updatePhoto(req as Request, res as Response);

      expect(PhotoService.updatePhoto).toHaveBeenCalledWith('1', photoData);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Foto actualizada correctamente',
        data: updatedPhoto
      });
    });

    it('debe manejar errores cuando la foto no existe', async () => {
      req = { 
        params: { photoId: 'non-existent-id' },
        body: { photoData: { caption: 'Updated caption' } }
      };

      // Simular el error específico que lanza el repositorio cuando la foto no existe
      const error = new Error('Photo with id non-existent-id not found');
      (PhotoService.updatePhoto as jest.Mock).mockRejectedValue(error);

      await PhotoController.updatePhoto(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Error al actualizar la foto',
        data: null
      });
    });

    it('debe manejar falta de datos para actualizar', async () => {
      req = { 
        params: { photoId: '1' },
        body: {}
      };

      await PhotoController.updatePhoto(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'No se proporcionaron datos para actualizar',
        data: null
      });
    });
  });

  describe('deletePhoto', () => {
    it('debe eliminar una foto correctamente', async () => {
      req = { params: { photoId: '1' } };

      (PhotoService.deletePhoto as jest.Mock).mockResolvedValue(true);

      await PhotoController.deletePhoto(req as Request, res as Response);

      expect(PhotoService.deletePhoto).toHaveBeenCalledWith('1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Foto eliminada correctamente',
        data: null
      });
    });

    it('debe manejar errores cuando la foto no existe', async () => {
      req = { params: { photoId: 'non-existent-id' } };

      // Si el servicio intenta eliminar una foto inexistente, devolvería false
      (PhotoService.deletePhoto as jest.Mock).mockResolvedValue(false);

      await PhotoController.deletePhoto(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Foto no encontrada',
        data: null
      });
    });

    it('debe manejar errores generales al eliminar una foto', async () => {
      req = { params: { photoId: '1' } };

      (PhotoService.deletePhoto as jest.Mock).mockRejectedValue(new Error('Error al eliminar foto'));

      await PhotoController.deletePhoto(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Error al eliminar la foto',
        data: null
      });
    });
  });

  describe('getPhotosByPoiId', () => {
    it('debe obtener fotos por ID de POI correctamente', async () => {
      const mockPhotos = [
        { 
          id: '1', 
          poi: { id: 'poi1', name: 'Place 1' }, 
          image: 10, 
          uploadDate: new Date(), 
          caption: 'Photo 1',
          createdAt: new Date(),
          updatedAt: null
        },
        { 
          id: '2', 
          poi: { id: 'poi1', name: 'Place 1' }, 
          image: 20, 
          uploadDate: new Date(), 
          caption: 'Photo 2',
          createdAt: new Date(),
          updatedAt: null
        }
      ];
      req = { params: { poiId: 'poi1' } };

      (PhotoService.getPhotosByPoiId as jest.Mock).mockResolvedValue(mockPhotos);

      await PhotoController.getPhotosofPoi(req as Request, res as Response);

      expect(PhotoService.getPhotosByPoiId).toHaveBeenCalledWith('poi1');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Fotos obtenidas correctamente',
        data: mockPhotos
      });
    });

    it('debe manejar el caso de no encontrar fotos para un POI', async () => {
      req = { params: { poiId: 'poi-without-photos' } };

      // Si no hay fotos para el POI, debería devolver array vacío
      (PhotoService.getPhotosByPoiId as jest.Mock).mockResolvedValue([]);

      await PhotoController.getPhotosofPoi(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Fotos obtenidas correctamente',
        data: []
      });
    });

    it('debe manejar errores al obtener fotos por ID de POI', async () => {
      req = { params: { poiId: 'poi1' } };

      (PhotoService.getPhotosByPoiId as jest.Mock).mockRejectedValue(new Error('Error al obtener fotos'));

      await PhotoController.getPhotosofPoi(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: 'Error al obtener las fotos',
        data: null
      });
    });
  });
});