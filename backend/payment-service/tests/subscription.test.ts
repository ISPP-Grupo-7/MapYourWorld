// subscription.service.test.ts

// Declaramos los mocks antes de cualquier importación
const mockedCreate = jest.fn();
const mockedUpdate = jest.fn();
const mockedGetById = jest.fn();
const mockedGetActiveSubscriptionByUserId = jest.fn();
const mockedDelete = jest.fn();

// Mockeamos el repositorio (esto se hace antes de importar el servicio)
jest.mock('../repositories/subscription.repository', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    create: mockedCreate,
    update: mockedUpdate,
    getById: mockedGetById,
    getActiveSubscriptionByUserId: mockedGetActiveSubscriptionByUserId,
    delete: mockedDelete,
  })),
}));

// Ahora importamos los módulos que usan el repositorio mockeado
import {
  createSubscription,
  updateSubscription,
  getSubscriptionById,
  getActiveSubscriptionByUserId,
  deleteSubscription,
} from '../services/subscription.service';
import { Subscription, PlanType } from '../models/subscription.model';
import { User, Role } from '../../auth-service/src/models/user.model';

// Creamos un dummy completo de User para los tests
const dummyUser: User = {
  id: 'user1-uuid',
  email: 'user1@example.com',
  role: Role.USER,
  password: 'secret',
  is_active: true,
  token_data: undefined,
  profile: {} as any, // Ajusta según la estructura real de UserProfile
  sentFriendRequests: [],
  receivedFriendRequests: [],
  maps_joined: [],
  subscription: {} as any,
  userDistrict: [],
};

describe('Subscription Service', () => {
  // Fecha fija para controlar la generación de fechas
  const fixedDate = new Date('2021-01-01T00:00:00.000Z');
  const thirtyDaysLater = new Date(fixedDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Deshabilitamos globalmente los logs de error para no imprimirlos en consola
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers(); // Usamos fake timers sin 'modern'
    jest.setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    // Reiniciamos los mocks antes de cada test
    mockedCreate.mockReset();
    mockedUpdate.mockReset();
    mockedGetById.mockReset();
    mockedGetActiveSubscriptionByUserId.mockReset();
    mockedDelete.mockReset();
  });

  describe('createSubscription', () => {
    it('debe crear una suscripción asignando plan FREE por defecto, id y is_active false', async () => {
      const inputData = {
        user: dummyUser,
        // No se especifica plan, se asigna por defecto FREE
      };

      // Simulamos que el repositorio devuelve un objeto plano con el id asignado
      mockedCreate.mockImplementation(async (subscription: Subscription) => {
        return {
          id: 'sub1-uuid',
          plan: subscription.plan,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          is_active: subscription.is_active,
          autoRenew: subscription.autoRenew,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
          user: subscription.user,
        };
      });

      const result = await createSubscription(inputData);

      expect(result.id).toBe('sub1-uuid');
      expect(result.plan).toBe(PlanType.FREE);
      expect(result.startDate).toEqual(fixedDate);
      expect(result.endDate).toEqual(thirtyDaysLater);
      expect(result.is_active).toBe(false);
      expect(result.autoRenew).toBe(false);
      expect(result.createdAt).toEqual(fixedDate);
      expect(result.updatedAt).toEqual(fixedDate);

      expect(mockedCreate).toHaveBeenCalledTimes(1);
      // Verificamos que se le haya pasado el usuario correcto al repositorio
      const passedSubscription = mockedCreate.mock.calls[0][0];
      expect(passedSubscription.user).toEqual(dummyUser);
    });

    it('debe lanzar error si no se proporciona información de suscripción', async () => {
      await expect(createSubscription(undefined as any))
        .rejects.toThrow("No se ha proporcionado información de suscripción");
    });

    it("debe lanzar error si falta el campo 'user'", async () => {
      const inputData = {
        plan: PlanType.PREMIUM,
      };

      await expect(createSubscription(inputData))
        .rejects.toThrow("El campo 'user' es obligatorio para crear una suscripción");
    });

    it('debe marcar is_active como true para plan PREMIUM dentro del rango de fechas', async () => {
      const inputData = {
        user: dummyUser,
        plan: PlanType.PREMIUM,
      };

      // Para este test simulamos que se asigna otro id
      mockedCreate.mockImplementation(async (subscription: Subscription) => {
        return {
          id: 'sub2-uuid',
          plan: subscription.plan,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          is_active: subscription.is_active,
          autoRenew: subscription.autoRenew,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
          user: subscription.user,
        };
      });

      const result = await createSubscription(inputData);

      expect(result.id).toBe('sub2-uuid');
      expect(result.plan).toBe(PlanType.PREMIUM);
      expect(result.is_active).toBe(true);
    });
  });

  describe('updateSubscription', () => {
    it('debe actualizar la suscripción cuando el usuario tiene permisos', async () => {
      const subscriptionId = 'sub1-uuid';
      const userId = dummyUser.id;

      const existingSubscription: Subscription = {
        id: subscriptionId,
        plan: PlanType.FREE,
        startDate: fixedDate,
        endDate: thirtyDaysLater,
        is_active: false,
        autoRenew: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        user: dummyUser,
      };

      mockedGetById.mockResolvedValue(existingSubscription);
      mockedUpdate.mockImplementation(async (id, data) => {
        return {
          id,
          plan: data.plan || existingSubscription.plan,
          startDate: data.startDate || existingSubscription.startDate,
          endDate: data.endDate || existingSubscription.endDate,
          is_active: data.is_active !== undefined ? data.is_active : existingSubscription.is_active,
          autoRenew: data.autoRenew !== undefined ? data.autoRenew : existingSubscription.autoRenew,
          createdAt: existingSubscription.createdAt,
          updatedAt: data.updatedAt || existingSubscription.updatedAt,
          user: existingSubscription.user,
        };
      });

      const updateData = {
        plan: PlanType.PREMIUM,
        startDate: fixedDate,
        endDate: thirtyDaysLater,
      };

      const result = await updateSubscription(subscriptionId, updateData, userId);

      expect(mockedGetById).toHaveBeenCalledWith(subscriptionId);
      expect(mockedUpdate).toHaveBeenCalledTimes(1);
      expect(result.is_active).toBe(true);
      expect(result.updatedAt).toEqual(fixedDate);
      expect(result.id).toBe(subscriptionId);
    });

    it('debe lanzar error si los IDs de usuario no coinciden', async () => {
      const subscriptionId = 'sub1-uuid';
      const userId = dummyUser.id;

      const existingSubscription: Subscription = {
        id: subscriptionId,
        plan: PlanType.FREE,
        startDate: fixedDate,
        endDate: thirtyDaysLater,
        is_active: false,
        autoRenew: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        user: { ...dummyUser, id: 'otro-uuid' },
      };

      mockedGetById.mockResolvedValue(existingSubscription);

      const updateData = {
        plan: PlanType.PREMIUM,
      };

      await expect(updateSubscription(subscriptionId, updateData, userId))
        .rejects.toThrow("No tienes permisos para actualizar esta suscripción");
    });
  });

  describe('getSubscriptionById', () => {
    it('debe retornar la suscripción según el ID', async () => {
      const subscriptionId = 'sub1-uuid';
      const expectedSubscription: Subscription = {
        id: subscriptionId,
        plan: PlanType.FREE,
        startDate: fixedDate,
        endDate: thirtyDaysLater,
        is_active: false,
        autoRenew: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        user: dummyUser,
      };

      mockedGetById.mockResolvedValue(expectedSubscription);

      const result = await getSubscriptionById(subscriptionId);
      expect(result).toEqual(expectedSubscription);
      expect(mockedGetById).toHaveBeenCalledWith(subscriptionId);
    });
  });

  describe('getActiveSubscriptionByUserId', () => {
    it('debe retornar la suscripción activa de un usuario', async () => {
      const userId = dummyUser.id;
      const activeSubscription: Subscription = {
        id: 'sub-active-uuid',
        plan: PlanType.PREMIUM,
        startDate: fixedDate,
        endDate: thirtyDaysLater,
        is_active: true,
        autoRenew: true,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        user: dummyUser,
      };

      mockedGetActiveSubscriptionByUserId.mockResolvedValue(activeSubscription);

      const result = await getActiveSubscriptionByUserId(userId);
      expect(result).toEqual(activeSubscription);
      expect(mockedGetActiveSubscriptionByUserId).toHaveBeenCalledWith(userId);
    });

    it('debe retornar null si no existe una suscripción activa', async () => {
      const userId = 'otro-uuid';
      mockedGetActiveSubscriptionByUserId.mockResolvedValue(null);

      const result = await getActiveSubscriptionByUserId(userId);
      expect(result).toBeNull();
      expect(mockedGetActiveSubscriptionByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('deleteSubscription', () => {
    it('debe eliminar la suscripción cuando los IDs de usuario coinciden', async () => {
      const subscriptionId = 'sub1-uuid';
      const userId = dummyUser.id;
      const existingSubscription: Subscription = {
        id: subscriptionId,
        plan: PlanType.FREE,
        startDate: fixedDate,
        endDate: thirtyDaysLater,
        is_active: false,
        autoRenew: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        user: dummyUser,
      };

      mockedGetById.mockResolvedValue(existingSubscription);
      mockedDelete.mockResolvedValue(undefined);

      await deleteSubscription(subscriptionId, userId);

      expect(mockedGetById).toHaveBeenCalledWith(subscriptionId);
      expect(mockedDelete).toHaveBeenCalledWith(subscriptionId);
    });

    it('debe lanzar error cuando los IDs de usuario no coinciden', async () => {
      const subscriptionId = 'sub1-uuid';
      const userId = dummyUser.id;
      const existingSubscription: Subscription = {
        id: subscriptionId,
        plan: PlanType.FREE,
        startDate: fixedDate,
        endDate: thirtyDaysLater,
        is_active: false,
        autoRenew: false,
        createdAt: fixedDate,
        updatedAt: fixedDate,
        user: { ...dummyUser, id: 'otro-uuid' },
      };

      mockedGetById.mockResolvedValue(existingSubscription);

      await expect(deleteSubscription(subscriptionId, userId))
        .rejects.toThrow("No tienes permisos para actualizar esta suscripción");
    });
  });
});
